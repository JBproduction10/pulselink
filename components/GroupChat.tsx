'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { GroupChatManager, ChatRoom, GroupMessage } from '../lib/groupchat';
import { Users, Plus, Send, Lock, Unlock, LogOut, Crown, Settings } from 'lucide-react';

interface GroupChatProps {
  userId: string;
  userName: string;
}

export function GroupChat({ userId, userName }: GroupChatProps) {
  const [chatManager] = useState(() => new GroupChatManager(userId, userName));
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [publicRooms, setPublicRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomDesc, setNewRoomDesc] = useState('');
  const [newRoomPrivate, setNewRoomPrivate] = useState(false);
  const [newRoomPassword, setNewRoomPassword] = useState('');
  const [joinPassword, setJoinPassword] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load rooms
    setRooms(chatManager.getUserRooms());
    setPublicRooms(chatManager.getPublicRooms());

    // Listen for room updates
    chatManager.onRoomUpdate((updatedRooms) => {
      setRooms(updatedRooms);
      setPublicRooms(chatManager.getPublicRooms());
    });

    // Listen for messages
    chatManager.onMessage((message) => {
      if (selectedRoom && message.roomId === selectedRoom.id) {
        setMessages((prev) => [...prev, message]);
      }
    });
  }, [chatManager, selectedRoom]);

  useEffect(() => {
    // Load messages when room is selected
    if (selectedRoom) {
      setMessages(chatManager.getRoomMessages(selectedRoom.id));
    }
  }, [selectedRoom, chatManager]);

  useEffect(() => {
    // Auto-scroll to bottom
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleCreateRoom = () => {
    if (!newRoomName.trim()) return;

    chatManager.createRoom({
      name: newRoomName,
      description: newRoomDesc,
      isPrivate: newRoomPrivate,
      password: newRoomPrivate ? newRoomPassword : undefined,
    });

    setNewRoomName('');
    setNewRoomDesc('');
    setNewRoomPassword('');
    setNewRoomPrivate(false);
    setShowCreateRoom(false);
  };

  const handleJoinRoom = (room: ChatRoom) => {
    const success = chatManager.joinRoom(room.id, room.isPrivate ? joinPassword : undefined);
    if (success) {
      setJoinPassword('');
      setSelectedRoom(room);
    }
  };

  const handleLeaveRoom = () => {
    if (selectedRoom) {
      chatManager.leaveRoom(selectedRoom.id);
      setSelectedRoom(null);
    }
  };

  const handleSendMessage = () => {
    if (!selectedRoom || !messageInput.trim()) return;

    chatManager.sendMessage(selectedRoom.id, messageInput);
    setMessageInput('');
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="h-full flex gap-4">
      {/* Rooms List */}
      <div className="w-80 flex flex-col gap-4">
        {/* My Rooms */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                My Rooms
              </CardTitle>
              <Button
                size="sm"
                onClick={() => setShowCreateRoom(!showCreateRoom)}
                className="h-8 w-8 p-0"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 max-h-64 overflow-y-auto">
            {rooms.map((room) => (
              <div
                key={room.id}
                onClick={() => setSelectedRoom(room)}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedRoom?.id === room.id
                    ? 'bg-red-100 border-2 border-red-500'
                    : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{room.name}</span>
                    {room.isPrivate && <Lock className="h-3 w-3" />}
                    {chatManager.isOwner(room.id) && <Crown className="h-3 w-3 text-yellow-500" />}
                  </div>
                  <Badge variant="outline">{room.members.length}</Badge>
                </div>
                <p className="text-xs text-gray-500 mt-1">{room.description}</p>
              </div>
            ))}
            {rooms.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">
                No rooms joined yet
              </p>
            )}
          </CardContent>
        </Card>

        {/* Public Rooms */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Unlock className="h-5 w-5" />
              Public Rooms
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-64 overflow-y-auto">
            {publicRooms.filter(r => !chatManager.isMember(r.id)).map((room) => (
              <div
                key={room.id}
                className="p-3 rounded-lg bg-gray-50 border-2 border-transparent hover:border-gray-300"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{room.name}</span>
                  <Button
                    size="sm"
                    onClick={() => handleJoinRoom(room)}
                    className="h-6 text-xs"
                  >
                    Join
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-1">{room.description}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Create Room Form */}
        {showCreateRoom && (
          <Card>
            <CardHeader>
              <CardTitle>Create New Room</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                placeholder="Room name"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
              />
              <Input
                placeholder="Description"
                value={newRoomDesc}
                onChange={(e) => setNewRoomDesc(e.target.value)}
              />
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="private"
                  checked={newRoomPrivate}
                  onChange={(e) => setNewRoomPrivate(e.target.checked)}
                  className="h-4 w-4"
                />
                <label htmlFor="private" className="text-sm">Private Room</label>
              </div>
              {newRoomPrivate && (
                <Input
                  type="password"
                  placeholder="Password"
                  value={newRoomPassword}
                  onChange={(e) => setNewRoomPassword(e.target.value)}
                />
              )}
              <div className="flex gap-2">
                <Button onClick={handleCreateRoom} className="flex-1">
                  Create
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowCreateRoom(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedRoom ? (
          <Card className="flex-1 flex flex-col">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {selectedRoom.name}
                    {selectedRoom.isPrivate && <Lock className="h-4 w-4" />}
                  </CardTitle>
                  <CardDescription>{selectedRoom.description}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    <Users className="h-3 w-3 mr-1" />
                    {selectedRoom.members.length}
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleLeaveRoom}
                    className="h-8"
                  >
                    <LogOut className="h-4 w-4 mr-1" />
                    Leave
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto space-y-2 mb-4 p-4 bg-gray-50 rounded-lg">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`p-3 rounded-lg ${
                      msg.from === userId
                        ? 'bg-red-500 text-white ml-12'
                        : msg.type === 'system'
                        ? 'bg-yellow-100 text-yellow-900 text-center text-sm'
                        : 'bg-white border mr-12'
                    }`}
                  >
                    {msg.type !== 'system' && (
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">{msg.fromName}</span>
                        <span className="text-xs opacity-70">{formatTime(msg.timestamp)}</span>
                      </div>
                    )}
                    <p className="wrap-break-word">{msg.content}</p>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="flex gap-2">
                <Input
                  placeholder="Type a message..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
                <Button onClick={handleSendMessage}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="flex-1 flex items-center justify-center">
            <CardContent>
              <p className="text-gray-500">Select a room to start chatting</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
