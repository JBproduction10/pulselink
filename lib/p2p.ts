import SimplePeer from 'simple-peer';
import { WebRTCManager } from '../lib/webrtc';
import { BluetoothManager } from './bluetooth';
import { E2EEncryption, type EncryptedMessage, type ExportedPublicKey } from './e2e-encryption';

export type MessageType = 'SOS' | 'STATUS' | 'LOCATION' | 'CHAT' | 'RELAY' | 'IMAGE' | 'VOICE' | 'RESOURCE' | 'KEY_EXCHANGE';

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
  encrypted?: boolean; // Indicates if message is encrypted
  encryptedData?: EncryptedMessage; // Encrypted message data
}

export interface Peer {
  id: string;
  name: string;
  status: 'safe' | 'help' | 'emergency' | 'offline';
  lastSeen: number;
  distance?: number;
  connection?: SimplePeer.Instance;
  connectionType?: 'webrtc' | 'bluetooth';
}

class P2PNetwork {
  private peers: Map<string, Peer> = new Map();
  private messages: Message[] = [];
  private userId: string;
  private userName: string;
  private messageHandlers: ((message: Message) => void)[] = [];
  private peerHandlers: ((peers: Peer[]) => void)[] = [];
  private seenMessages: Set<string> = new Set();
  private webrtcManager: WebRTCManager | null = null;
  private bluetoothManager: BluetoothManager | null = null;
  private useRealWebRTC: boolean = true;
  private useSimulation: boolean = false;

  constructor(userId: string, userName: string, options?: { useRealWebRTC?: boolean; useSimulation?: boolean }) {
    this.userId = userId;
    this.userName = userName;
    this.useRealWebRTC = options?.useRealWebRTC !== false;
    this.useSimulation = options?.useSimulation || false;

    if (this.useRealWebRTC) {
      this.initializeWebRTC();
    }

    if (this.useSimulation) {
      this.initializeSimulation();
    }

    this.initializeBluetooth();
  }

  // Initialize real WebRTC connections
  private initializeWebRTC() {
    try {
      this.webrtcManager = new WebRTCManager({
        userId: this.userId,
        userName: this.userName,
      });

      this.webrtcManager.onData((peerId: any, data: { type: string; name: any; status: any; message: Message; }) => {
        // Handle incoming data from peers
        if (data.type === 'peer-info') {
          this.addPeer({
            id: peerId,
            name: data.name,
            status: data.status || 'safe',
            lastSeen: Date.now(),
            connectionType: 'webrtc',
          });
        } else if (data.type === 'message') {
          this.receiveMessage(data.message);
        }
      });

      this.webrtcManager.onPeerConnected((peerId: any) => {
        console.log('WebRTC peer connected:', peerId);
        // Send our info to the new peer
        this.webrtcManager?.sendToPeer(peerId, {
          type: 'peer-info',
          name: this.userName,
          status: 'safe',
        });
        this.notifyPeerHandlers();
      });

      this.webrtcManager.onPeerDisconnected((peerId: string) => {
        console.log('WebRTC peer disconnected:', peerId);
        const peer = this.peers.get(peerId);
        if (peer) {
          peer.status = 'offline';
          setTimeout(() => this.peers.delete(peerId), 30000);
        }
        this.notifyPeerHandlers();
      });
    } catch (error) {
      console.error('Failed to initialize WebRTC:', error);
      this.useSimulation = true;
      this.initializeSimulation();
    }
  }

  // Initialize Bluetooth for closer-range communication
  private initializeBluetooth() {
    try {
      this.bluetoothManager = new BluetoothManager(this.userId);

      if (!this.bluetoothManager.isBluetoothSupported()) {
        console.log('Bluetooth not supported in this browser');
        return;
      }

      this.bluetoothManager.onMessage((message) => {
        // Convert Bluetooth message to our Message format
        const msg: Message = {
          id: `bt-${message.timestamp}-${message.from}`,
          from: message.from,
          fromName: message.from,
          type: message.type as MessageType,
          content: message.data,
          timestamp: message.timestamp,
          ttl: 5,
        };
        this.receiveMessage(msg);
      });

      this.bluetoothManager.onDeviceDiscovered((device) => {
        console.log('Bluetooth device discovered:', device.name);
        this.addPeer({
          id: device.id,
          name: device.name,
          status: 'safe',
          lastSeen: device.lastSeen,
          connectionType: 'bluetooth',
        });
      });
    } catch (error) {
      console.error('Failed to initialize Bluetooth:', error);
    }
  }

  // Fallback simulation for demo/testing
  private initializeSimulation() {
    if (typeof window !== 'undefined') {
      setInterval(() => {
        this.simulatePeerDiscovery();
      }, 5000);
    }
  }

  private simulatePeerDiscovery() {
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
          distance: Math.random() * 500,
        });
      }
    });

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
      ttl: 5,
    };

    this.messages.push(message);
    this.seenMessages.add(message.id);

    this.broadcastMessage(message);
    this.notifyMessageHandlers(message);
    this.saveToStorage();
  }

  private broadcastMessage(message: Message) {
    // Broadcast via WebRTC
    if (this.webrtcManager) {
      this.webrtcManager.broadcast({
        type: 'message',
        message,
      });
    }

    // Broadcast via Bluetooth if connected
    if (this.bluetoothManager?.isConnected()) {
      this.bluetoothManager.sendMessage({
        type: message.type,
        content: message.content,
      });
    }

    // Fallback simulation relay
    if (this.useSimulation && message.ttl > 0) {
      setTimeout(() => {
        if (Math.random() > 0.3) {
          const relayedMessage = { ...message, ttl: message.ttl - 1 };
          // This would propagate through the network
        }
      }, 1000);
    }
  }

  receiveMessage(message: Message) {
    if (this.seenMessages.has(message.id)) {
      return;
    }

    this.seenMessages.add(message.id);
    this.messages.push(message);
    this.notifyMessageHandlers(message);

    if (message.ttl > 0) {
      const relayedMessage = { ...message, ttl: message.ttl - 1 };
      this.broadcastMessage(relayedMessage);
    }

    this.saveToStorage();
  }

  // Bluetooth connection methods
  async connectBluetooth(): Promise<boolean> {
    if (!this.bluetoothManager) {
      console.error('Bluetooth not initialized');
      return false;
    }
    return await this.bluetoothManager.requestDevice();
  }

  async scanBluetoothDevices(): Promise<void> {
    if (!this.bluetoothManager) {
      console.error('Bluetooth not initialized');
      return;
    }
    await this.bluetoothManager.scanForDevices();
  }

  disconnectBluetooth(): void {
    if (this.bluetoothManager) {
      this.bluetoothManager.disconnect();
    }
  }

  isBluetoothSupported(): boolean {
    return this.bluetoothManager?.isBluetoothSupported() || false;
  }

  isBluetoothConnected(): boolean {
    return this.bluetoothManager?.isConnected() || false;
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

  getWebRTCPeers(): Peer[] {
    return Array.from(this.peers.values()).filter(p => p.connectionType === 'webrtc');
  }

  getBluetoothPeers(): Peer[] {
    return Array.from(this.peers.values()).filter(p => p.connectionType === 'bluetooth');
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

  disconnect() {
    if (this.webrtcManager) {
      this.webrtcManager.disconnect();
    }
    if (this.bluetoothManager) {
      this.bluetoothManager.disconnect();
    }
  }
}

export default P2PNetwork;
