'use client';

import { SetStateAction, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import P2PNetwork, { Message, Peer, MessageType } from '../lib/p2p';
import ContactManager, { Contact } from '../lib/contact';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { useBattery, getBatteryIcon, getBatteryColor, getBatteryPercentage } from '../lib/battery';
import { MediaMessage } from '../components/MediaMessage';
import { MessageDisplay } from '../components/MessageDisplay';
import { ResourceSharing, ResourceList } from '../components/ResourceSharing';
import { LanguageSelector } from '../components/LanguageSelector';
import { useTranslation, setLanguage, getLanguage, type Language } from '../lib/i18n';

// Dynamically import Map component to avoid SSR issues
const MapView = dynamic(() => import('../components/Map'), {
  ssr: false,
  loading: () => (
    <div className="z-0 h-[600px] w-full rounded-lg border-2 border-gray-300 flex items-center justify-center bg-gray-50">
      <p className="text-gray-500">Loading map...</p>
    </div>
  ),
});


export default function Home() {
  const [network, setNetwork] = useState<P2PNetwork | null>(null);
  const [contactManager] = useState(() => new ContactManager());
  const [userName, setUserName] = useState('');
  const [isSetup, setIsSetup] = useState(false);
  const [peers, setPeers] = useState<Peer[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [activeTab, setActiveTab] = useState<'sos' | 'messages' | 'contacts' | 'map' | 'peers' | 'resources'>('sos');
  const [messageInput, setMessageInput] = useState('');
  const [userStatus, setUserStatus] = useState<'safe' | 'help' | 'emergency'>('safe');
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [newContactName, setNewContactName] = useState('');
  const [newContactRelation, setNewContactRelation] = useState('');
  const [currentLang, setCurrentLang] = useState<Language>('en');
  const battery = useBattery();
  const { t } = useTranslation(currentLang);

  useEffect(() => {
    setCurrentLang(getLanguage());
  }, []);

  const handleLanguageChange = (lang: Language) => {
    setCurrentLang(lang);
    setLanguage(lang);
  };

  useEffect(() => {
    // Check if user is already set up
    const storedName = localStorage.getItem('pulselink-username');
    if (storedName) {
      setupNetwork(storedName);
    }

    // Get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.log('Location access denied');
        }
      );
    }
  }, []);

  const setupNetwork = (name: string) => {
    const userId = localStorage.getItem('pulselink-userid') || `user-${Date.now()}`;
    localStorage.setItem('pulselink-userid', userId);
    localStorage.setItem('pulselink-username', name);

    const p2p = new P2PNetwork(userId, name);
    p2p.loadFromStorage();

    p2p.onMessage((msg: { type: string; fromName: any; content: any; }) => {
      setMessages((prev) => [msg as Message, ...prev]);

      // Show notification for SOS messages
      if (msg.type === 'SOS' && Notification.permission === 'granted') {
        new Notification('PulseLink SOS Alert', {
          body: `${msg.fromName}: ${msg.content}`,
          icon: '/icon.png',
        });
      }
    });

    p2p.onPeersUpdate((peerList: SetStateAction<Peer[]>) => {
      setPeers(peerList);
    });

    setMessages(p2p.getMessages());
    setNetwork(p2p);
    setIsSetup(true);
    setUserName(name);
    setContacts(contactManager.getContacts());

    // Request notification permission
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };

  const addContact = () => {
    if (newContactName.trim() && newContactRelation.trim()) {
      contactManager.addContact({
        name: newContactName.trim(),
        relation: newContactRelation.trim(),
        lastSeen: 0
      });
      setContacts(contactManager.getContacts());
      setNewContactName('');
      setNewContactRelation('');
    }
  };

  const deleteContact = (id: string) => {
    contactManager.deleteContact(id);
    setContacts(contactManager.getContacts());
  };

  const handleSetup = () => {
    if (userName.trim()) {
      setupNetwork(userName.trim());
    }
  };

  const sendSOS = () => {
    if (network) {
      network.sendMessage('SOS', 'EMERGENCY! I need immediate help!', location || undefined);
      setUserStatus('emergency');
    }
  };

  const sendStatusUpdate = (status: 'safe' | 'help') => {
    if (network) {
      const content = status === 'safe' ? 'I am safe' : 'I need help';
      network.sendMessage('STATUS', content, location || undefined);
      setUserStatus(status);
    }
  };

  const sendChatMessage = () => {
    if (network && messageInput.trim()) {
      network.sendMessage('CHAT', messageInput.trim(), location || undefined);
      setMessageInput('');
    }
  };

  const sendImage = (imageData: string, caption: string) => {
    if (network) {
      const msg = network.sendMessage('IMAGE', caption || 'Shared an image', location || undefined);
      // Add image data to the message
      const lastMsg = network.getMessages()[0];
      if (lastMsg) {
        (lastMsg as any).imageData = imageData;
        setMessages([...network.getMessages()]);
      }
    }
  };

  const sendVoice = (audioData: string) => {
    if (network) {
      const msg = network.sendMessage('VOICE', 'Voice message', location || undefined);
      // Add audio data to the message
      const lastMsg = network.getMessages()[0];
      if (lastMsg) {
        (lastMsg as any).audioData = audioData;
        setMessages([...network.getMessages()]);
      }
    }
  };

  const shareResource = (type: string, quantity: string, description: string) => {
    if (network) {
      const msg = network.sendMessage('RESOURCE', description, location || undefined);
      // Add resource data to the message
      const lastMsg = network.getMessages()[0];
      if (lastMsg) {
        (lastMsg as any).resourceType = type;
        (lastMsg as any).resourceQuantity = quantity;
        setMessages([...network.getMessages()]);
      }
    }
  };

  const simulateIncomingMessage = () => {
    if (network) {
      const demoMessages = [
        { type: 'SOS' as MessageType, content: 'Help! Trapped in building at 2nd floor!', from: 'Sarah Martinez' },
        { type: 'STATUS' as MessageType, content: 'I am safe, heading to shelter', from: 'David Chen' },
        { type: 'CHAT' as MessageType, content: 'Anyone near the hospital?', from: 'Emma Wilson' },
        { type: 'STATUS' as MessageType, content: 'I need help, running low on water', from: 'James Brown' },
      ];

      const randomMsg = demoMessages[Math.floor(Math.random() * demoMessages.length)];
      const demoMessage: Message = {
        id: `demo-${Date.now()}-${Math.random()}`,
        from: `demo-${randomMsg.from}`,
        fromName: randomMsg.from,
        type: randomMsg.type,
        content: randomMsg.content,
        timestamp: Date.now(),
        location: location ? {
          lat: location.lat + (Math.random() - 0.5) * 0.01,
          lng: location.lng + (Math.random() - 0.5) * 0.01,
        } : undefined,
        ttl: 3,
      };

      network.receiveMessage(demoMessage);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'safe': return 'success';
      case 'help': return 'warning';
      case 'emergency': return 'danger';
      case 'offline': return 'outline';
      default: return 'default';
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  if (!isSetup) {
    return (
      <div className="min-h-screen bg-linear-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-2 border-red-200">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-20 h-20 bg-red-600 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <CardTitle className="text-3xl font-bold text-red-900">PulseLink</CardTitle>
            <CardDescription className="text-base">
              Emergency Connection Without Internet
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Your Name</label>
              <Input
                type="text"
                placeholder="Enter your name"
                value={userName}
                onChange={(e: { target: { value: SetStateAction<string>; }; }) => setUserName(e.target.value)}
                onKeyPress={(e: { key: string; }) => e.key === 'Enter' && handleSetup()}
                className="text-base"
              />
            </div>
            <Button onClick={handleSetup} className="w-full" size="lg" variant="emergency">
              Connect to Network
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Your device will connect to nearby peers using mesh networking
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-red-50 via-white to-orange-50">
      {/* Header */}
      <div className="bg-red-600 text-white shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold">PulseLink</h1>
                <p className="text-xs text-red-100">{userName}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <LanguageSelector
                currentLang={currentLang}
                onLanguageChange={handleLanguageChange}
              />
              <Badge variant={getStatusColor(userStatus)}>
                {userStatus.toUpperCase()}
              </Badge>
              <Badge variant={peers.filter(p => p.status !== 'offline').length > 0 ? 'success' : 'outline'}>
                {peers.filter(p => p.status !== 'offline').length} {t('peers')}
              </Badge>
              {battery.supported && (
                <Badge variant="outline" className={`${getBatteryColor(battery.level, battery.charging)} bg-white`}>
                  {getBatteryIcon(battery.level, battery.charging)} {getBatteryPercentage(battery.level)}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex gap-1">
            {[
              { id: 'sos', label: 'Emergency', icon: '🚨' },
              { id: 'messages', label: 'Messages', icon: '💬' },
              { id: 'resources', label: 'Resources', icon: '📦' },
              { id: 'contacts', label: 'Contacts', icon: '❤️' },
              { id: 'map', label: 'Map', icon: '🗺️' },
              { id: 'peers', label: 'Network', icon: '👥' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'sos' | 'messages' | 'peers' | 'contacts' | 'map' | 'resources')}
                className={`flex-1 py-3 px-2 sm:px-4 font-medium transition-colors text-sm sm:text-base ${
                  activeTab === tab.id
                    ? 'text-red-600 border-b-2 border-red-600'
                    : 'text-gray-600 hover:text-red-600'
                }`}
              >
                <span className="mr-1 sm:mr-2">{tab.icon}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-4">
        {/* SOS Tab */}
        {activeTab === 'sos' && (
          <div className="space-y-4">
            <Card className="border-2 border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="text-red-900">Emergency Actions</CardTitle>
                <CardDescription>Send emergency alerts to nearby peers</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={sendSOS}
                  variant="emergency"
                  size="xl"
                  className="w-full animate-pulse"
                >
                  🚨 SEND SOS ALERT
                </Button>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={() => sendStatusUpdate('help')}
                    variant="outline"
                    className="border-yellow-500 text-yellow-700 hover:bg-yellow-50"
                  >
                    ⚠️ Need Help
                  </Button>
                  <Button
                    onClick={() => sendStatusUpdate('safe')}
                    variant="safe"
                  >
                    ✓ I'm Safe
                  </Button>
                </div>
              </CardContent>
            </Card>

            {location && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Your Location</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs font-mono text-muted-foreground">
                    Lat: {location.lat.toFixed(6)}, Lng: {location.lng.toFixed(6)}
                  </p>
                  <p className="text-xs mt-2 text-muted-foreground">
                    Location is shared with emergency messages
                  </p>
                </CardContent>
              </Card>
            )}

            <Card className="bg-purple-50 border-purple-200">
              <CardHeader>
                <CardTitle className="text-sm text-purple-900">Demo Mode</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-purple-700 mb-3">
                  Test the app by simulating incoming messages from nearby users
                </p>
                <Button
                  onClick={simulateIncomingMessage}
                  variant="outline"
                  size="sm"
                  className="w-full border-purple-500 text-purple-700 hover:bg-purple-100"
                >
                  Simulate Incoming Message
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">How It Works</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>✓ Works without internet using mesh networking</p>
                <p>✓ Messages relay through nearby devices</p>
                <p>✓ Location shared with emergency alerts</p>
                <p>✓ Offline storage for message history</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Messages Tab */}
        {activeTab === 'messages' && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Send Message</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Type a message..."
                    value={messageInput}
                    onChange={(e: { target: { value: SetStateAction<string>; }; }) => setMessageInput(e.target.value)}
                    onKeyPress={(e: { key: string; }) => e.key === 'Enter' && sendChatMessage()}
                  />
                  <Button onClick={sendChatMessage}>Send</Button>
                </div>

                <MediaMessage
                  onSendImage={sendImage}
                  onSendVoice={sendVoice}
                />
              </CardContent>
            </Card>

            <div className="space-y-2">
              {messages.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    No messages yet
                  </CardContent>
                </Card>
              ) : (
                messages.map((msg) => (
                  <Card
                    key={msg.id}
                    className={msg.type === 'SOS' ? 'border-2 border-red-500 bg-red-50' : ''}
                  >
                    <CardContent>
                      <MessageDisplay message={msg} formatTime={formatTime} />
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}

        {/* Peers Tab */}
        {activeTab === 'peers' && (
          <div className="space-y-4">
            <Card className="bg-linear-to-r from-red-600 to-orange-600 text-white">
              <CardHeader>
                <CardTitle>Mesh Network Status</CardTitle>
                <CardDescription className="text-red-100">
                  Connected peers in your area
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {peers.filter(p => p.status !== 'offline').length} Active
                </div>
                <p className="text-sm text-red-100 mt-1">
                  Messages relay through {peers.length} total peers
                </p>
              </CardContent>
            </Card>

            <div className="space-y-2">
              {peers.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    <p>Scanning for nearby peers...</p>
                    <p className="text-xs mt-2">Make sure other devices are nearby</p>
                  </CardContent>
                </Card>
              ) : (
                peers.map((peer) => (
                  <Card key={peer.id} className={peer.status === 'offline' ? 'opacity-50' : ''}>
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            peer.status === 'safe' ? 'bg-green-100 text-green-700' :
                            peer.status === 'help' ? 'bg-yellow-100 text-yellow-700' :
                            peer.status === 'emergency' ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {peer.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold">{peer.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {peer.distance ? `~${Math.round(peer.distance)}m away` : 'Distance unknown'}
                            </p>
                          </div>
                        </div>
                        <Badge variant={getStatusColor(peer.status)}>
                          {peer.status}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}

        {/* Contacts Tab */}
        {activeTab === 'contacts' && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Add Loved One</CardTitle>
                <CardDescription>
                  Keep track of family and friends during emergencies
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <Input
                    type="text"
                    placeholder="Enter name"
                    value={newContactName}
                    onChange={(e: { target: { value: SetStateAction<string>; }; }) => setNewContactName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Relation</label>
                  <Input
                    type="text"
                    placeholder="e.g., Mother, Brother, Friend"
                    value={newContactRelation}
                    onChange={(e: { target: { value: SetStateAction<string>; }; }) => setNewContactRelation(e.target.value)}
                    onKeyPress={(e: { key: string; }) => e.key === 'Enter' && addContact()}
                  />
                </div>
                <Button onClick={addContact} className="w-full">
                  Add Contact
                </Button>
              </CardContent>
            </Card>

            <div className="space-y-2">
              <h3 className="font-semibold text-sm text-muted-foreground px-1">
                Your Contacts ({contacts.length})
              </h3>
              {contacts.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    <p>No contacts added yet</p>
                    <p className="text-xs mt-2">Add loved ones to track during emergencies</p>
                  </CardContent>
                </Card>
              ) : (
                contacts.map((contact) => (
                  <Card key={contact.id}>
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-red-100 text-red-700 flex items-center justify-center font-bold text-lg">
                            {contact.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold">{contact.name}</p>
                            <p className="text-xs text-muted-foreground">{contact.relation}</p>
                            {contact.lastSeen && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Last seen: {new Date(contact.lastSeen).toLocaleString()}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={getStatusColor(contact.status)}>
                            {contact.status}
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteContact(contact.id)}
                            className="text-red-600 hover:bg-red-50"
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                      {contact.lastLocation && (
                        <p className="text-xs text-muted-foreground mt-2">
                          📍 {contact.lastLocation.lat.toFixed(4)}, {contact.lastLocation.lng.toFixed(4)}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="py-4">
                <p className="text-sm text-blue-900">
                  <strong>Note:</strong> Contact status will automatically update when they send messages through the mesh network.
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Resources Tab */}
        {activeTab === 'resources' && (
          <div className="space-y-4">
            <ResourceSharing onShareResource={shareResource} />

            <Card>
              <CardHeader>
                <CardTitle>Available Resources</CardTitle>
                <CardDescription>
                  Resources shared by people in your area
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResourceList
                  resources={messages.filter(m => m.type === 'RESOURCE').map(m => ({
                    id: m.id,
                    fromName: m.fromName,
                    type: (m as any).resourceType || 'other',
                    quantity: (m as any).resourceQuantity || 'Unknown',
                    content: m.content,
                    timestamp: m.timestamp,
                    location: m.location,
                  }))}
                  formatTime={formatTime}
                />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Map Tab */}
        {activeTab === 'map' && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Location Map</CardTitle>
                <CardDescription>
                  View your location, nearby peers, and contacts on the map
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MapView
                  userLocation={location}
                  userName={userName}
                  peers={peers}
                  contacts={contacts}
                  userStatus={userStatus}
                />
              </CardContent>
            </Card>

            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="py-4">
                <p className="text-sm text-blue-900">
                  <strong>Map Info:</strong> Your location is shown with a special marker.
                  Peers and contacts appear based on their last known locations.
                  The dotted circle shows a 500m radius around you.
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
