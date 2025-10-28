# New Features Implementation

This document describes the three major features that have been added to PulseLink:

## 1. Real WebRTC Peer Connections

### Overview
Replaced the simulated mesh network with real peer-to-peer connections using WebRTC technology.

### Implementation Details

#### WebRTCManager (`lib/webrtc.ts`)
- Uses SimplePeer library for WebRTC abstraction
- Supports signaling via Socket.io server
- Fallback to BroadcastChannel API for local testing
- STUN servers for NAT traversal (Google's public STUN servers)

#### Features
- **Real-time P2P Communication**: Direct peer-to-peer data channels
- **Automatic Peer Discovery**: Connects to nearby users automatically
- **Message Broadcasting**: Send messages to all connected peers
- **Connection Management**: Track connected/disconnected peers
- **Fallback Mechanism**: Uses BroadcastChannel if signaling server unavailable

#### Usage
```typescript
const webrtc = new WebRTCManager({
  userId: 'user-123',
  userName: 'John Doe',
  signalingServer: 'https://your-signal-server.com' // optional
});

webrtc.onData((peerId, data) => {
  console.log('Received from', peerId, data);
});

webrtc.broadcast({ type: 'message', content: 'Hello!' });
```

#### Configuration
The P2PNetwork now accepts options to enable/disable features:
```typescript
new P2PNetwork(userId, userName, {
  useRealWebRTC: true,  // Enable real WebRTC
  useSimulation: false   // Keep simulation as backup
});
```

### Limitations
- Requires a signaling server for initial connection (falls back to BroadcastChannel)
- Browser support: Chrome, Firefox, Safari, Edge (modern versions)
- May not work behind restrictive firewalls/NATs without TURN server

---

## 2. Bluetooth Integration

### Overview
Added Web Bluetooth API support for closer-range, direct device-to-device communication.

### Implementation Details

#### BluetoothManager (`lib/bluetooth.ts`)
- Uses Web Bluetooth API
- Custom GATT service for PulseLink
- Device discovery and pairing
- Message transmission over Bluetooth LE

#### Features
- **Device Pairing**: Connect directly to nearby Bluetooth devices
- **Close-Range Communication**: 10-100 meters depending on device
- **Independent Channel**: Works alongside WebRTC
- **Message Broadcasting**: Send emergency messages via Bluetooth
- **Browser Support Detection**: Automatically detects if browser supports Bluetooth

#### UI Component (`components/BluetoothControl.tsx`)
- Connect/disconnect Bluetooth devices
- Scan for nearby devices
- Visual connection status
- Browser compatibility warnings

#### Usage
```typescript
const bluetooth = new BluetoothManager(userId);

if (bluetooth.isBluetoothSupported()) {
  await bluetooth.requestDevice(); // Prompts user to select device
  await bluetooth.sendMessage({ type: 'SOS', content: 'Help!' });
}
```

#### Integration with P2PNetwork
```typescript
// Check if Bluetooth is supported
network.isBluetoothSupported();

// Connect to a Bluetooth device
await network.connectBluetooth();

// Scan for devices
await network.scanBluetoothDevices();

// Check connection status
network.isBluetoothConnected();

// Disconnect
network.disconnectBluetooth();
```

### Bluetooth UUIDs
```
Service UUID:         12345678-1234-5678-1234-56789abcdef0
Message Characteristic: 12345678-1234-5678-1234-56789abcdef1
Discovery Characteristic: 12345678-1234-5678-1234-56789abcdef2
```

### Limitations
- **Browser Support**: Limited to Chrome/Edge on desktop, Android browsers
- **HTTPS Required**: Bluetooth API only works on secure contexts
- **User Interaction**: Requires explicit user permission/pairing
- **Range**: ~10-100 meters (depends on device and environment)
- **Payload Size**: Max ~512 bytes per write (chunked for larger messages)

---

## 3. Group Chat Rooms

### Overview
Added group chat functionality for coordinated emergency response and communication.

### Implementation Details

#### GroupChatManager (`lib/groupchat.ts`)
- Room creation and management
- Public and private rooms with password protection
- Member management and permissions
- Real-time messaging
- Message persistence

#### Features
- **Public Rooms**: Open to all users
- **Private Rooms**: Password-protected rooms
- **Default Rooms**:
  - "Global Emergency" - Emergency coordination
  - "General Discussion" - General communication
- **Room Management**:
  - Create rooms
  - Join/leave rooms
  - Room ownership and permissions
  - Member lists
- **Message Types**:
  - Text messages
  - System messages (join/leave notifications)
  - Support for images, voice, location (extensible)
- **Persistence**: Rooms and messages saved to localStorage

#### UI Component (`components/GroupChat.tsx`)
- Room list (my rooms + public rooms)
- Room creation form
- Chat interface with message history
- Member count display
- Leave/manage room actions

#### Usage
```typescript
const groupChat = new GroupChatManager(userId, userName);

// Create a room
const room = groupChat.createRoom({
  name: 'Emergency Team Alpha',
  description: 'Rescue coordination',
  isPrivate: true,
  password: 'secure123'
});

// Join a room
groupChat.joinRoom(roomId, password);

// Send message
groupChat.sendMessage(roomId, 'Need medical supplies at location X');

// Listen for messages
groupChat.onMessage((message) => {
  console.log(message.content);
});

// Get room messages
const messages = groupChat.getRoomMessages(roomId);
```

#### Room Structure
```typescript
interface ChatRoom {
  id: string;
  name: string;
  description: string;
  createdBy: string;
  createdAt: number;
  members: string[];
  isPrivate: boolean;
  password?: string;
}
```

#### Message Structure
```typescript
interface GroupMessage {
  id: string;
  roomId: string;
  from: string;
  fromName: string;
  content: string;
  timestamp: number;
  type: 'text' | 'image' | 'voice' | 'location' | 'system';
  metadata?: any;
}
```

### Network Integration
Group messages can be synchronized across the mesh network via WebRTC and Bluetooth connections.

---

## Connection Status Component

### ConnectionStatus (`components/ConnectionStatus.tsx`)
Visual display of all peer connections categorized by type:
- WebRTC peers
- Bluetooth peers
- Other/simulated peers

Shows:
- Connection type icons
- Peer count per type
- Individual peer status (safe/help/emergency/offline)
- Distance to peers (if available)

---

## UI Updates

### New Navigation Tabs
1. **Groups** (👥) - Access group chat rooms
2. **Bluetooth** (🔵) - Bluetooth connection management

### Updated Tabs
- **Network** (📡) - Now shows detailed connection status including WebRTC and Bluetooth peers

---

## Testing the Features

### Testing WebRTC
1. Open the app in two different browser windows/tabs
2. Both should auto-connect via BroadcastChannel (local testing)
3. Send messages and verify they appear in both windows
4. Check Network tab to see connected peers

### Testing Bluetooth
1. Open app on a device with Bluetooth support (Chrome/Edge)
2. Navigate to Bluetooth tab
3. Click "Connect Device" and select a Bluetooth device
4. Verify connection status shows "Connected"
5. Test message transmission

**Note**: For real Bluetooth testing, you need:
- HTTPS connection (or localhost)
- Two physical devices with Bluetooth LE support
- Both devices running the app

### Testing Group Chat
1. Navigate to Groups tab
2. Create a new room (public or private)
3. Open app in another window/tab
4. Join the same room from the other instance
5. Send messages and verify they appear in both windows
6. Test leaving/rejoining rooms
7. Create private rooms and verify password protection

---

## Architecture

```
┌─────────────────────────────────────────────┐
│           PulseLink Application             │
├─────────────────────────────────────────────┤
│                                             │
│  ┌──────────────┐      ┌─────────────────┐ │
│  │  P2PNetwork  │─────▶│ WebRTCManager   │ │
│  │              │      │                 │ │
│  │              │      │ • SimplePeer    │ │
│  │              │      │ • Socket.io     │ │
│  │              │      │ • BroadcastCh.  │ │
│  └──────────────┘      └─────────────────┘ │
│         │                                   │
│         ├──────────────▶┌─────────────────┐ │
│         │               │BluetoothManager │ │
│         │               │                 │ │
│         │               │ • Web Bluetooth │ │
│         │               │ • GATT Services │ │
│         │               └─────────────────┘ │
│         │                                   │
│         └──────────────▶┌─────────────────┐ │
│                         │ GroupChatMgr    │ │
│                         │                 │ │
│                         │ • Rooms         │ │
│                         │ • Messages      │ │
│                         │ • Members       │ │
│                         └─────────────────┘ │
│                                             │
└─────────────────────────────────────────────┘
```

---

## Browser Compatibility

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| WebRTC | ✅ | ✅ | ✅ | ✅ |
| Bluetooth | ✅ | ⚠️ Limited | ❌ | ✅ |
| Group Chat | ✅ | ✅ | ✅ | ✅ |
| BroadcastChannel | ✅ | ✅ | ✅ | ✅ |

✅ Full support | ⚠️ Partial support | ❌ Not supported

---

## Future Enhancements

1. **WebRTC**
   - TURN server support for restrictive networks
   - Video/audio calls
   - File transfer
   - Screen sharing

2. **Bluetooth**
   - Bluetooth mesh networking
   - Background scanning (when API supports)
   - Beacon-based proximity detection

3. **Group Chat**
   - End-to-end encryption
   - File/media sharing in groups
   - Admin/moderator roles
   - Message reactions
   - Read receipts
   - Typing indicators

4. **Network**
   - Hybrid routing (auto-select best path)
   - Network quality indicators
   - Bandwidth usage monitoring
   - Connection quality metrics

---

## Security Considerations

1. **WebRTC**: Data channels are encrypted by default (DTLS-SRTP)
2. **Bluetooth**: Consider implementing additional encryption for sensitive data
3. **Group Chat**: Private rooms use password protection (consider hashing)
4. **Local Storage**: Data stored in localStorage is not encrypted

For production use, implement:
- End-to-end message encryption
- Secure password hashing (bcrypt, scrypt)
- Certificate pinning for signaling server
- Regular security audits

---

## Performance Notes

- **WebRTC**: Low latency (<100ms typically)
- **Bluetooth**: Slightly higher latency than WebRTC
- **Group Chat**: Messages stored in memory and localStorage
- **Storage**: Consider implementing message cleanup for old rooms/messages
- **Scalability**: Current implementation suitable for small groups (<50 peers)

---

## Deployment Notes

### Required for Production:
1. **Signaling Server**: Deploy a Socket.io server for WebRTC signaling
   - Example: Node.js + Socket.io server on Heroku/Render/Railway

2. **HTTPS**: Required for:
   - Web Bluetooth API
   - Service Workers
   - Geolocation
   - Notifications

3. **TURN Server** (optional but recommended):
   - For NAT traversal in restrictive networks
   - Consider services like Twilio, Xirsys, or self-hosted coturn

### Environment Variables:
```env
NEXT_PUBLIC_SIGNALING_SERVER=https://your-signaling-server.com
NEXT_PUBLIC_TURN_SERVER=turn:your-turn-server.com:3478
NEXT_PUBLIC_TURN_USERNAME=username
NEXT_PUBLIC_TURN_CREDENTIAL=password
```

---

## Contributing

When extending these features:
1. Maintain backward compatibility
2. Update this documentation
3. Add tests for new functionality
4. Consider offline-first design
5. Test on multiple browsers/devices

---

## License

Same as PulseLink project license.
