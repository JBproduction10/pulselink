import SimplePeer from 'simple-peer';
import { WebRTCManager } from '../lib/webrtc';
import { E2EEncryption, type EncryptedMessage, type ExportedPublicKey } from './e2e-encryption';

export type MessageType = 'SOS' | 'STATUS' | 'LOCATION' | 'CHAT' | 'RELAY' | 'IMAGE' | 'VOICE' | 'RESOURCE' | 'KEY_EXCHANGE' | 'FILE' | 'FILE_CHUNK' | 'FILE_COMPLETE';

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

export interface FileTransfer {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  from: string;
  fromName: string;
  chunks: ArrayBuffer[];
  totalChunks: number;
  receivedChunks: number;
  progress: number;
  timestamp: number;
}

export interface Peer {
  id: string;
  name: string;
  status: 'safe' | 'help' | 'emergency' | 'offline';
  lastSeen: number;
  distance?: number;
  connection?: SimplePeer.Instance;
  connectionType?: 'webrtc';
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
  private fileTransfers: Map<string, FileTransfer> = new Map();
  private fileHandlers: ((transfer: FileTransfer) => void)[] = [];
  private fileProgressHandlers: ((transferId: string, progress: number) => void)[] = [];

  constructor(userId: string, userName: string) {
    this.userId = userId;
    this.userName = userName;
    this.initializeWebRTC();
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
    }
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

  async sendFile(file: File, onProgress?: (progress: number) => void): Promise<void> {
    const transferId = `${this.userId}-${Date.now()}-${Math.random()}`;
    const CHUNK_SIZE = 16384; // 16KB chunks for reliable transfer
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

    // Send file metadata first
    this.broadcastMessage({
      id: transferId,
      from: this.userId,
      fromName: this.userName,
      type: 'FILE',
      content: JSON.stringify({
        transferId,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        totalChunks,
      }),
      timestamp: Date.now(),
      ttl: 5,
    });

    // Read and send file in chunks
    const reader = new FileReader();
    let currentChunk = 0;

    const readNextChunk = () => {
      const start = currentChunk * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, file.size);
      const blob = file.slice(start, end);
      reader.readAsArrayBuffer(blob);
    };

    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        // Send chunk
        this.broadcastMessage({
          id: `${transferId}-chunk-${currentChunk}`,
          from: this.userId,
          fromName: this.userName,
          type: 'FILE_CHUNK',
          content: JSON.stringify({
            transferId,
            chunkIndex: currentChunk,
            data: Array.from(new Uint8Array(reader.result as ArrayBuffer)),
          }),
          timestamp: Date.now(),
          ttl: 1, // Don't relay file chunks
        });

        currentChunk++;
        const progress = (currentChunk / totalChunks) * 100;

        if (onProgress) {
          onProgress(progress);
        }

        if (currentChunk < totalChunks) {
          readNextChunk();
        } else {
          // Send completion message
          this.broadcastMessage({
            id: `${transferId}-complete`,
            from: this.userId,
            fromName: this.userName,
            type: 'FILE_COMPLETE',
            content: JSON.stringify({ transferId }),
            timestamp: Date.now(),
            ttl: 1,
          });
        }
      }
    };

    readNextChunk();
  }

  private broadcastMessage(message: Message) {
    // Broadcast via WebRTC
    if (this.webrtcManager) {
      this.webrtcManager.broadcast({
        type: 'message',
        message,
      });
    }
  }

  receiveMessage(message: Message) {
    if (this.seenMessages.has(message.id)) {
      return;
    }

    this.seenMessages.add(message.id);

    // Handle file transfer messages separately
    if (message.type === 'FILE' || message.type === 'FILE_CHUNK' || message.type === 'FILE_COMPLETE') {
      this.handleFileMessage(message);
    } else {
      this.messages.push(message);
      this.notifyMessageHandlers(message);
    }

    if (message.ttl > 0) {
      const relayedMessage = { ...message, ttl: message.ttl - 1 };
      this.broadcastMessage(relayedMessage);
    }

    this.saveToStorage();
  }

  private handleFileMessage(message: Message) {
    try {
      const data = JSON.parse(message.content);

      if (message.type === 'FILE') {
        // Initialize file transfer
        const transfer: FileTransfer = {
          id: data.transferId,
          fileName: data.fileName,
          fileSize: data.fileSize,
          mimeType: data.mimeType,
          from: message.from,
          fromName: message.fromName,
          chunks: new Array(data.totalChunks),
          totalChunks: data.totalChunks,
          receivedChunks: 0,
          progress: 0,
          timestamp: message.timestamp,
        };
        this.fileTransfers.set(data.transferId, transfer);
      } else if (message.type === 'FILE_CHUNK') {
        const transfer = this.fileTransfers.get(data.transferId);
        if (transfer) {
          transfer.chunks[data.chunkIndex] = new Uint8Array(data.data).buffer;
          transfer.receivedChunks++;
          transfer.progress = (transfer.receivedChunks / transfer.totalChunks) * 100;

          this.fileProgressHandlers.forEach(handler =>
            handler(data.transferId, transfer.progress)
          );
        }
      } else if (message.type === 'FILE_COMPLETE') {
        const transfer = this.fileTransfers.get(data.transferId);
        if (transfer && transfer.receivedChunks === transfer.totalChunks) {
          // Combine all chunks into a single blob
          const combinedBuffer = new Uint8Array(
            transfer.chunks.reduce((acc, chunk) => acc + chunk.byteLength, 0)
          );
          let offset = 0;
          for (const chunk of transfer.chunks) {
            combinedBuffer.set(new Uint8Array(chunk), offset);
            offset += chunk.byteLength;
          }

          const blob = new Blob([combinedBuffer], { type: transfer.mimeType });
          const url = URL.createObjectURL(blob);

          // Notify file handlers
          this.fileHandlers.forEach(handler => handler(transfer));

          // Clean up
          setTimeout(() => this.fileTransfers.delete(data.transferId), 60000);
        }
      }
    } catch (error) {
      console.error('Error handling file message:', error);
    }
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

  disconnect() {
    if (this.webrtcManager) {
      this.webrtcManager.disconnect();
    }
  }

  onFileReceived(handler: (transfer: FileTransfer) => void) {
    this.fileHandlers.push(handler);
  }

  onFileProgress(handler: (transferId: string, progress: number) => void) {
    this.fileProgressHandlers.push(handler);
  }

  getActiveFileTransfers(): FileTransfer[] {
    return Array.from(this.fileTransfers.values());
  }
}

export default P2PNetwork;
