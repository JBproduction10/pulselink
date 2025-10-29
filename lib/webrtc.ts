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
  private broadcastChannel: BroadcastChannel | null = null;
  private useBroadcastChannel = false;

  constructor(config: WebRTCConfig) {
    this.userId = config.userId;
    this.userName = config.userName;
    // Use local signaling server for development, can be overridden with env var
    const defaultServer = typeof window !== 'undefined' && window.location.hostname === 'localhost'
      ? 'http://localhost:3001' // Separate signaling server
      : 'https://pulselink-signaling.vercel.app'; // Production signaling server
    this.signalingServer = config.signalingServer || defaultServer;

    // Try BroadcastChannel first for local connections
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      console.log('Using BroadcastChannel for local peer discovery');
      this.useBroadcastChannel = true;
      this.initializeBroadcastChannel();
    } else {
      console.log('BroadcastChannel not available, trying signaling server');
      this.initializeSignaling();
    }
  }

  private initializeBroadcastChannel() {
    if (typeof window === 'undefined' || !('BroadcastChannel' in window)) {
      console.error('BroadcastChannel not supported');
      return;
    }

    try {
      this.broadcastChannel = new BroadcastChannel('pulselink-discovery');
      console.log('BroadcastChannel initialized successfully');

      this.broadcastChannel.onmessage = (event) => {
        const { type, from, userName, data } = event.data;

        if (from === this.userId) return;

        console.log('BroadcastChannel message received:', { type, from, userName });

        if (type === 'announce') {
          // Another peer is announcing
          console.log('Peer discovered via BroadcastChannel:', from, userName);
          if (!this.peers.has(from)) {
            // Only the peer with smaller ID initiates to avoid duplicate connections
            if (this.userId < from) {
              console.log('Initiating connection to:', from);
              this.initiateConnection(from, true);
            }
          }
        } else if (type === 'signal') {
          console.log('Received signal from:', from);
          this.handleSignal({
            type: data.signalType,
            from,
            to: this.userId,
            data: data.signal
          });
        }
      };

      // Announce presence immediately and then periodically
      const announce = () => {
        if (this.broadcastChannel) {
          this.broadcastChannel.postMessage({
            type: 'announce',
            from: this.userId,
            userName: this.userName,
          });
          console.log('Announced presence via BroadcastChannel');
        }
      };

      announce();
      setInterval(announce, 3000); // Announce every 3 seconds

    } catch (error) {
      console.error('Failed to initialize BroadcastChannel:', error);
      this.useBroadcastChannel = false;
      this.initializeSignaling();
    }
  }

  private initializeSignaling() {
    try {
      // Connect to signaling server
      console.log('Connecting to signaling server:', this.signalingServer);
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

      this.socket.on('connect_error', (error) => {
        console.error('Signaling server connection error:', error);
        // Fallback to local peer discovery if available
        if (!this.useBroadcastChannel && typeof window !== 'undefined' && 'BroadcastChannel' in window) {
          console.log('Falling back to BroadcastChannel');
          this.useBroadcastChannel = true;
          this.initializeBroadcastChannel();
        }
      });

      this.socket.on('error', (error) => {
        console.error('Signaling server error:', error);
      });

      // Handle peer discovery
      this.socket.on('peer-discovered', (peerInfo: { userId: string; userName: string }) => {
        console.log('Peer discovered via signaling server:', peerInfo);
        if (peerInfo.userId !== this.userId && !this.peers.has(peerInfo.userId)) {
          this.initiateConnection(peerInfo.userId, true);
        }
      });

      // Handle signaling messages
      this.socket.on('signal', (signal: SignalData) => {
        if (signal.to === this.userId) {
          console.log('Received signal from signaling server:', signal.from);
          this.handleSignal(signal);
        }
      });

      // Handle peer list updates
      this.socket.on('peers-list', (peers: Array<{ userId: string; userName: string }>) => {
        console.log('Received peers list:', peers.length, 'peers');
        peers.forEach(peer => {
          if (peer.userId !== this.userId && !this.peers.has(peer.userId)) {
            // Initiate connection to discovered peers
            this.initiateConnection(peer.userId, true);
          }
        });
      });

      // Request current peers after connection
      this.socket.on('connect', () => {
        this.socket?.emit('get-peers');
      });

    } catch (error) {
      console.error('Failed to connect to signaling server:', error);
      // Fallback to BroadcastChannel if available
      if (!this.useBroadcastChannel && typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        this.useBroadcastChannel = true;
        this.initializeBroadcastChannel();
      }
    }
  }



  private initiateConnection(peerId: string, initiator: boolean) {
    if (this.peers.has(peerId)) {
      console.log('Already have connection to:', peerId);
      return;
    }

    console.log('Creating peer connection to:', peerId, 'initiator:', initiator);

    const peer = new SimplePeer({
      initiator,
      trickle: true,
      config: {
        iceServers: [
          // STUN servers for NAT traversal
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' },
          { urls: 'stun:stun.relay.metered.ca:80' },
          // TURN servers for restrictive networks (relay traffic)
          {
            urls: 'turn:openrelay.metered.ca:80',
            username: 'openrelayproject',
            credential: 'openrelayproject',
          },
          {
            urls: 'turn:openrelay.metered.ca:443',
            username: 'openrelayproject',
            credential: 'openrelayproject',
          },
          {
            urls: 'turn:openrelay.metered.ca:443?transport=tcp',
            username: 'openrelayproject',
            credential: 'openrelayproject',
          },
        ],
        iceCandidatePoolSize: 10,
      },
    });

    peer.on('signal', (data) => {
      console.log('Peer signal event:', data.type, 'to:', peerId);

      // Send signal through signaling server or BroadcastChannel
      const signal: SignalData = {
        type: data.type as 'offer' | 'answer',
        from: this.userId,
        to: peerId,
        data,
      };

      if (this.useBroadcastChannel && this.broadcastChannel) {
        // Use BroadcastChannel
        console.log('Sending signal via BroadcastChannel to:', peerId);
        this.broadcastChannel.postMessage({
          type: 'signal',
          from: this.userId,
          to: peerId,
          data: { signalType: data.type, signal: data },
        });
      } else if (this.socket?.connected) {
        // Use signaling server
        console.log('Sending signal via signaling server to:', peerId);
        this.socket.emit('signal', signal);
      } else {
        console.warn('No signaling method available');
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
    console.log('Disconnecting WebRTC manager');
    this.peers.forEach(peer => {
      peer.destroy();
    });
    this.peers.clear();
    if (this.socket) {
      this.socket.disconnect();
    }
    if (this.broadcastChannel) {
      this.broadcastChannel.close();
    }
  }
}
