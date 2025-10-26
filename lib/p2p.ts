import SimplePeer from 'simple-peer';

export type MessageType = 'SOS' | 'STATUS' | 'LOCATION' | 'CHAT' | 'RELAY' | 'IMAGE' | 'VOICE' | 'RESOURCE';

export interface Message {
  id: string;
  from: string;
  fromName: string;
  type: MessageType;
  content: string;
  timestamp: number;
  location?: {
    lat: number;
    lng: number;
  };
  ttl: number; // Time to live for relay messages
  imageData?: string; // Base64 encoded image
  audioData?: string; // Base64 encoded audio
  resourceType?: 'water' | 'food' | 'medical' | 'shelter' | 'other';
  resourceQuantity?: string;
}

export interface Peer {
  id: string;
  name: string;
  status: 'safe' | 'help' | 'emergency' | 'offline';
  lastSeen: number;
  distance?: number;
  connection?: SimplePeer.Instance;
}

class P2PNetwork {
  private peers: Map<string, Peer> = new Map();
  private messages: Message[] = [];
  private userId: string;
  private userName: string;
  private messageHandlers: ((message: Message) => void)[] = [];
  private peerHandlers: ((peers: Peer[]) => void)[] = [];
  private seenMessages: Set<string> = new Set();

  constructor(userId: string, userName: string) {
    this.userId = userId;
    this.userName = userName;
    this.initializeSimulation();
  }

  // Simulate a mesh network with nearby peers
  private initializeSimulation() {
    // In a real implementation, this would use WebRTC signaling
    // For demo purposes, we'll simulate peer discovery
    if (typeof window !== 'undefined') {
      // Simulate peer discovery every 5 seconds
      setInterval(() => {
        this.simulatePeerDiscovery();
      }, 5000);
    }
  }

  private simulatePeerDiscovery() {
    // Simulate finding nearby peers
    const simulatedPeers = [
      { id: 'peer-1', name: 'Alice Johnson', status: 'safe' as const },
      { id: 'peer-2', name: 'Bob Smith', status: 'help' as const },
      { id: 'peer-3', name: 'Charlie Davis', status: 'safe' as const },
    ];

    simulatedPeers.forEach(peer => {
      if (!this.peers.has(peer.id) && Math.random() > 0.5) {
        this.addPeer({
          ...peer,
          lastSeen: Date.now(),
          distance: Math.random() * 500, // meters
        });
      }
    });

    // Simulate peers going offline
    this.peers.forEach((peer, id) => {
      if (Math.random() > 0.9) {
        peer.status = 'offline';
        setTimeout(() => this.peers.delete(id), 30000);
      }
    });

    this.notifyPeerHandlers();
  }

  private addPeer(peer: Peer) {
    this.peers.set(peer.id, peer);
    this.notifyPeerHandlers();
  }

  sendMessage(type: MessageType, content: string, location?: { lat: number; lng: number }) {
    const message: Message = {
      id: `${this.userId}-${Date.now()}-${Math.random()}`,
      from: this.userId,
      fromName: this.userName,
      type,
      content,
      timestamp: Date.now(),
      location,
      ttl: 5, // Message will be relayed 5 times max
    };

    this.messages.push(message);
    this.seenMessages.add(message.id);

    // Broadcast to all peers
    this.broadcastMessage(message);
    this.notifyMessageHandlers(message);

    // Store in localStorage for offline access
    this.saveToStorage();
  }

  private broadcastMessage(message: Message) {
    // In real implementation, send to all connected peers via WebRTC
    // For simulation, we'll just store locally and simulate relay
    if (message.ttl > 0) {
      // Simulate message relay through mesh network
      setTimeout(() => {
        // Random chance other peers relay the message
        if (Math.random() > 0.3) {
          const relayedMessage = { ...message, ttl: message.ttl - 1 };
          // This would propagate through the network
        }
      }, 1000);
    }
  }

  receiveMessage(message: Message) {
    // Check if we've seen this message before (prevent loops)
    if (this.seenMessages.has(message.id)) {
      return;
    }

    this.seenMessages.add(message.id);
    this.messages.push(message);
    this.notifyMessageHandlers(message);

    // Relay message if TTL > 0
    if (message.ttl > 0) {
      const relayedMessage = { ...message, ttl: message.ttl - 1 };
      this.broadcastMessage(relayedMessage);
    }

    this.saveToStorage();
  }

  onMessage(handler: (message: Message) => void) {
    this.messageHandlers.push(handler);
  }

  onPeersUpdate(handler: (peers: Peer[]) => void) {
    this.peerHandlers.push(handler);
  }

  private notifyMessageHandlers(message: Message) {
    this.messageHandlers.forEach(handler => handler(message));
  }

  private notifyPeerHandlers() {
    const peerList = Array.from(this.peers.values());
    this.peerHandlers.forEach(handler => handler(peerList));
  }

  getPeers(): Peer[] {
    return Array.from(this.peers.values());
  }

  getMessages(): Message[] {
    return [...this.messages].sort((a, b) => b.timestamp - a.timestamp);
  }

  private saveToStorage() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('pulselink-messages', JSON.stringify(this.messages));
    }
  }

  loadFromStorage() {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('pulselink-messages');
      if (stored) {
        this.messages = JSON.parse(stored);
      }
    }
  }

  getUserId(): string {
    return this.userId;
  }

  getUserName(): string {
    return this.userName;
  }
}

export default P2PNetwork;
