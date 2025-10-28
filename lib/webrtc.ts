import SimplePeer from 'simple-peer';
import { io, Socket } from 'socket.io-client';

export interface WebRTCConfig {
  userId: string;
  userName: string;
  signalingServer?: string;
}

export interface SignalData {
  type: 'offer' | 'answer' | 'ice-candidate';
  from: string;
  to: string;
  data: any;
}

export class WebRTCManager {
  private socket: Socket | null = null;
  private peers: Map<string, SimplePeer.Instance> = new Map();
  private userId: string;
  private userName: string;
  private signalingServer: string;
  private onDataCallbacks: ((peerId: string, data: any) => void)[] = [];
  private onPeerConnectedCallbacks: ((peerId: string) => void)[] = [];
  private onPeerDisconnectedCallbacks: ((peerId: string) => void)[] = [];

  constructor(config: WebRTCConfig) {
    this.userId = config.userId;
    this.userName = config.userName;
    // Use a fallback to local signaling server if none provided
    this.signalingServer = config.signalingServer || 'https://pulselink-signal.glitch.me';
    this.initializeSignaling();
  }

  private initializeSignaling() {
    try {
      // Connect to signaling server
      this.socket = io(this.signalingServer, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
      });

      this.socket.on('connect', () => {
        console.log('Connected to signaling server');
        // Register user with signaling server
        this.socket?.emit('register', {
          userId: this.userId,
          userName: this.userName,
        });
      });

      this.socket.on('disconnect', () => {
        console.log('Disconnected from signaling server');
      });

      this.socket.on('error', (error) => {
        console.error('Signaling server error:', error);
        // Fallback to local peer discovery
        this.fallbackToLocalDiscovery();
      });

      // Handle peer discovery
      this.socket.on('peer-discovered', (peerInfo: { userId: string; userName: string }) => {
        if (peerInfo.userId !== this.userId && !this.peers.has(peerInfo.userId)) {
          this.initiateConnection(peerInfo.userId, true);
        }
      });

      // Handle signaling messages
      this.socket.on('signal', (signal: SignalData) => {
        if (signal.to === this.userId) {
          this.handleSignal(signal);
        }
      });

      // Handle peer list updates
      this.socket.on('peers-list', (peers: Array<{ userId: string; userName: string }>) => {
        peers.forEach(peer => {
          if (peer.userId !== this.userId && !this.peers.has(peer.userId)) {
            // Don't initiate connection, wait for signaling
          }
        });
      });

      // Request current peers
      this.socket.emit('get-peers');
    } catch (error) {
      console.error('Failed to connect to signaling server:', error);
      this.fallbackToLocalDiscovery();
    }
  }

  private fallbackToLocalDiscovery() {
    console.log('Using fallback local peer discovery');
    // Implement WebRTC without a signaling server using BroadcastChannel
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      const channel = new BroadcastChannel('pulselink-discovery');

      channel.onmessage = (event) => {
        const { type, from, data } = event.data;

        if (from === this.userId) return;

        if (type === 'announce') {
          // Another peer is announcing
          if (!this.peers.has(from)) {
            this.initiateConnection(from, true);
          }
        } else if (type === 'signal') {
          this.handleSignal({ type: data.type, from, to: this.userId, data: data.signal });
        }
      };

      // Announce presence
      setInterval(() => {
        channel.postMessage({
          type: 'announce',
          from: this.userId,
          userName: this.userName,
        });
      }, 5000);
    }
  }

  private initiateConnection(peerId: string, initiator: boolean) {
    if (this.peers.has(peerId)) return;

    const peer = new SimplePeer({
      initiator,
      trickle: true,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' },
        ],
      },
    });

    peer.on('signal', (data) => {
      // Send signal through signaling server
      const signal: SignalData = {
        type: data.type as 'offer' | 'answer',
        from: this.userId,
        to: peerId,
        data,
      };

      if (this.socket?.connected) {
        this.socket.emit('signal', signal);
      } else {
        // Use BroadcastChannel fallback
        if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
          const channel = new BroadcastChannel('pulselink-discovery');
          channel.postMessage({
            type: 'signal',
            from: this.userId,
            to: peerId,
            data: { type: data.type, signal: data },
          });
        }
      }
    });

    peer.on('connect', () => {
      console.log('Connected to peer:', peerId);
      this.onPeerConnectedCallbacks.forEach(cb => cb(peerId));
    });

    peer.on('data', (data) => {
      try {
        const message = JSON.parse(data.toString());
        this.onDataCallbacks.forEach(cb => cb(peerId, message));
      } catch (error) {
        console.error('Error parsing peer data:', error);
      }
    });

    peer.on('error', (err) => {
      console.error('Peer connection error:', err);
      this.peers.delete(peerId);
      this.onPeerDisconnectedCallbacks.forEach(cb => cb(peerId));
    });

    peer.on('close', () => {
      console.log('Peer connection closed:', peerId);
      this.peers.delete(peerId);
      this.onPeerDisconnectedCallbacks.forEach(cb => cb(peerId));
    });

    this.peers.set(peerId, peer);
  }

  private handleSignal(signal: SignalData) {
    let peer = this.peers.get(signal.from);

    if (!peer) {
      // Create a new peer connection (not initiator)
      this.initiateConnection(signal.from, false);
      peer = this.peers.get(signal.from);
    }

    if (peer) {
      try {
        peer.signal(signal.data);
      } catch (error) {
        console.error('Error signaling peer:', error);
      }
    }
  }

  sendToPeer(peerId: string, data: any) {
    const peer = this.peers.get(peerId);
    if (peer && peer.connected) {
      try {
        peer.send(JSON.stringify(data));
      } catch (error) {
        console.error('Error sending data to peer:', error);
      }
    }
  }

  broadcast(data: any) {
    this.peers.forEach((peer, peerId) => {
      if (peer.connected) {
        this.sendToPeer(peerId, data);
      }
    });
  }

  onData(callback: (peerId: string, data: any) => void) {
    this.onDataCallbacks.push(callback);
  }

  onPeerConnected(callback: (peerId: string) => void) {
    this.onPeerConnectedCallbacks.push(callback);
  }

  onPeerDisconnected(callback: (peerId: string) => void) {
    this.onPeerDisconnectedCallbacks.push(callback);
  }

  getConnectedPeers(): string[] {
    return Array.from(this.peers.entries())
      .filter(([_, peer]) => peer.connected)
      .map(([peerId, _]) => peerId);
  }

  disconnect() {
    this.peers.forEach(peer => {
      peer.destroy();
    });
    this.peers.clear();
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}
