export interface ChatRoom {
  id: string;
  name: string;
  description: string;
  createdBy: string;
  createdAt: number;
  members: string[];
  isPrivate: boolean;
  password?: string;
}

export interface GroupMessage {
  id: string;
  roomId: string;
  from: string;
  fromName: string;
  content: string;
  timestamp: number;
  type: 'text' | 'image' | 'voice' | 'location' | 'system';
  metadata?: any;
}

export interface RoomMember {
  userId: string;
  userName: string;
  joinedAt: number;
  role: 'owner' | 'admin' | 'member';
}

export class GroupChatManager {
  private rooms: Map<string, ChatRoom> = new Map();
  private roomMessages: Map<string, GroupMessage[]> = new Map();
  private roomMembers: Map<string, RoomMember[]> = new Map();
  private userId: string;
  private userName: string;
  private onRoomUpdateCallbacks: ((rooms: ChatRoom[]) => void)[] = [];
  private onMessageCallbacks: ((message: GroupMessage) => void)[] = [];
  private onMemberJoinCallbacks: ((roomId: string, member: RoomMember) => void)[] = [];
  private onMemberLeaveCallbacks: ((roomId: string, userId: string) => void)[] = [];

  constructor(userId: string, userName: string) {
    this.userId = userId;
    this.userName = userName;
    this.loadFromStorage();
    this.createDefaultRooms();
  }

  private createDefaultRooms() {
    // Create default emergency room if it doesn't exist
    if (!this.hasRoom('emergency-global')) {
      this.createRoom({
        id: 'emergency-global',
        name: 'Global Emergency',
        description: 'Emergency coordination for all users',
        isPrivate: false,
      });
    }

    // Create default general room
    if (!this.hasRoom('general')) {
      this.createRoom({
        id: 'general',
        name: 'General Discussion',
        description: 'General communication channel',
        isPrivate: false,
      });
    }
  }

  createRoom(params: {
    id?: string;
    name: string;
    description: string;
    isPrivate: boolean;
    password?: string;
  }): ChatRoom {
    const roomId = params.id || `room-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const room: ChatRoom = {
      id: roomId,
      name: params.name,
      description: params.description,
      createdBy: this.userId,
      createdAt: Date.now(),
      members: [this.userId],
      isPrivate: params.isPrivate,
      password: params.password,
    };

    this.rooms.set(roomId, room);
    this.roomMessages.set(roomId, []);

    const ownerMember: RoomMember = {
      userId: this.userId,
      userName: this.userName,
      joinedAt: Date.now(),
      role: 'owner',
    };

    this.roomMembers.set(roomId, [ownerMember]);

    // Send system message
    this.sendSystemMessage(roomId, `${this.userName} created the room`);

    this.saveToStorage();
    this.notifyRoomUpdate();

    return room;
  }

  joinRoom(roomId: string, password?: string): boolean {
    const room = this.rooms.get(roomId);

    if (!room) {
      console.error('Room not found');
      return false;
    }

    // Check password for private rooms
    if (room.isPrivate && room.password && room.password !== password) {
      console.error('Invalid room password');
      return false;
    }

    // Check if already a member
    if (room.members.includes(this.userId)) {
      return true;
    }

    // Add user to room
    room.members.push(this.userId);

    const member: RoomMember = {
      userId: this.userId,
      userName: this.userName,
      joinedAt: Date.now(),
      role: 'member',
    };

    const members = this.roomMembers.get(roomId) || [];
    members.push(member);
    this.roomMembers.set(roomId, members);

    // Send system message
    this.sendSystemMessage(roomId, `${this.userName} joined the room`);

    this.saveToStorage();
    this.notifyRoomUpdate();
    this.onMemberJoinCallbacks.forEach(cb => cb(roomId, member));

    return true;
  }

  leaveRoom(roomId: string): boolean {
    const room = this.rooms.get(roomId);

    if (!room) {
      console.error('Room not found');
      return false;
    }

    // Remove user from members
    room.members = room.members.filter(id => id !== this.userId);

    const members = this.roomMembers.get(roomId) || [];
    const updatedMembers = members.filter(m => m.userId !== this.userId);
    this.roomMembers.set(roomId, updatedMembers);

    // If user was owner and room is empty, delete room
    if (room.createdBy === this.userId && room.members.length === 0) {
      this.deleteRoom(roomId);
    } else {
      // Send system message
      this.sendSystemMessage(roomId, `${this.userName} left the room`);

      // Transfer ownership if user was owner
      if (room.createdBy === this.userId && room.members.length > 0) {
        room.createdBy = room.members[0];
        const newOwner = updatedMembers.find(m => m.userId === room.members[0]);
        if (newOwner) {
          newOwner.role = 'owner';
        }
      }
    }

    this.saveToStorage();
    this.notifyRoomUpdate();
    this.onMemberLeaveCallbacks.forEach(cb => cb(roomId, this.userId));

    return true;
  }

  deleteRoom(roomId: string): boolean {
    const room = this.rooms.get(roomId);

    if (!room || room.createdBy !== this.userId) {
      console.error('Cannot delete room - not owner or room not found');
      return false;
    }

    this.rooms.delete(roomId);
    this.roomMessages.delete(roomId);
    this.roomMembers.delete(roomId);

    this.saveToStorage();
    this.notifyRoomUpdate();

    return true;
  }

  sendMessage(roomId: string, content: string, type: GroupMessage['type'] = 'text', metadata?: any): GroupMessage | null {
    const room = this.rooms.get(roomId);

    if (!room || !room.members.includes(this.userId)) {
      console.error('Cannot send message - not a member of room');
      return null;
    }

    const message: GroupMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      roomId,
      from: this.userId,
      fromName: this.userName,
      content,
      timestamp: Date.now(),
      type,
      metadata,
    };

    const messages = this.roomMessages.get(roomId) || [];
    messages.push(message);
    this.roomMessages.set(roomId, messages);

    this.saveToStorage();
    this.onMessageCallbacks.forEach(cb => cb(message));

    return message;
  }

  private sendSystemMessage(roomId: string, content: string) {
    const message: GroupMessage = {
      id: `sys-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      roomId,
      from: 'system',
      fromName: 'System',
      content,
      timestamp: Date.now(),
      type: 'system',
    };

    const messages = this.roomMessages.get(roomId) || [];
    messages.push(message);
    this.roomMessages.set(roomId, messages);

    this.saveToStorage();
    this.onMessageCallbacks.forEach(cb => cb(message));
  }

  getRooms(): ChatRoom[] {
    return Array.from(this.rooms.values());
  }

  getUserRooms(): ChatRoom[] {
    return Array.from(this.rooms.values()).filter(room =>
      room.members.includes(this.userId)
    );
  }

  getPublicRooms(): ChatRoom[] {
    return Array.from(this.rooms.values()).filter(room => !room.isPrivate);
  }

  getRoom(roomId: string): ChatRoom | undefined {
    return this.rooms.get(roomId);
  }

  getRoomMessages(roomId: string): GroupMessage[] {
    return this.roomMessages.get(roomId) || [];
  }

  getRoomMembers(roomId: string): RoomMember[] {
    return this.roomMembers.get(roomId) || [];
  }

  hasRoom(roomId: string): boolean {
    return this.rooms.has(roomId);
  }

  isMember(roomId: string): boolean {
    const room = this.rooms.get(roomId);
    return room ? room.members.includes(this.userId) : false;
  }

  isOwner(roomId: string): boolean {
    const room = this.rooms.get(roomId);
    return room ? room.createdBy === this.userId : false;
  }

  onRoomUpdate(callback: (rooms: ChatRoom[]) => void) {
    this.onRoomUpdateCallbacks.push(callback);
  }

  onMessage(callback: (message: GroupMessage) => void) {
    this.onMessageCallbacks.push(callback);
  }

  onMemberJoin(callback: (roomId: string, member: RoomMember) => void) {
    this.onMemberJoinCallbacks.push(callback);
  }

  onMemberLeave(callback: (roomId: string, userId: string) => void) {
    this.onMemberLeaveCallbacks.push(callback);
  }

  private notifyRoomUpdate() {
    const rooms = this.getUserRooms();
    this.onRoomUpdateCallbacks.forEach(cb => cb(rooms));
  }

  private saveToStorage() {
    if (typeof window !== 'undefined') {
      const data = {
        rooms: Array.from(this.rooms.entries()),
        messages: Array.from(this.roomMessages.entries()),
        members: Array.from(this.roomMembers.entries()),
      };
      localStorage.setItem('pulselink-groupchats', JSON.stringify(data));
    }
  }

  private loadFromStorage() {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('pulselink-groupchats');
      if (stored) {
        try {
          const data = JSON.parse(stored);
          this.rooms = new Map(data.rooms);
          this.roomMessages = new Map(data.messages);
          this.roomMembers = new Map(data.members);
        } catch (error) {
          console.error('Error loading group chats from storage:', error);
        }
      }
    }
  }

  // Sync messages with network
  syncWithNetwork(callback: (message: GroupMessage) => void) {
    // This would integrate with WebRTC/Bluetooth to broadcast messages
    this.onMessage((message) => {
      callback(message);
    });
  }
}
