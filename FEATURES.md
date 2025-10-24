# PulseLink Features

## Core Emergency Features

### 1. SOS Alert System
- **Emergency Button**: Large, prominent SOS button that sends immediate distress signals
- **Location Sharing**: Automatically includes GPS coordinates with emergency alerts
- **Status Updates**: Quick status buttons for "I'm Safe" and "Need Help"
- **Persistent Alerts**: SOS messages are highlighted and stored for offline access

### 2. Peer-to-Peer Mesh Networking
- **No Internet Required**: Works entirely offline using local device-to-device communication
- **Message Relay**: Messages hop through nearby devices to extend range (up to 5 hops)
- **Auto Discovery**: Automatically finds and connects to nearby peers
- **Range Estimation**: Shows approximate distance to connected peers

### 3. Messaging System
- **Real-time Chat**: Send text messages to nearby peers
- **Message Types**: Supports SOS, status updates, and general chat
- **Message History**: Stores messages locally for offline access
- **Timestamps**: All messages include time information
- **Location Tags**: Optional location sharing with messages

### 4. Contact Management
- **Loved Ones List**: Keep track of family and friends
- **Status Tracking**: Monitor contact status (safe/help/emergency/unknown)
- **Quick Access**: Easily find and communicate with important contacts
- **Contact Relations**: Tag relationships (Mother, Father, Friend, etc.)
- **Last Seen**: Track when contacts were last active

### 5. Network Status Display
- **Active Peers**: See who's connected in real-time
- **Network Health**: Monitor mesh network connectivity
- **Peer Information**: View names, status, and approximate distance
- **Connection History**: Track peer availability

## Technical Features

### Offline-First Architecture
- **Local Storage**: All data persists even when app is closed
- **PWA Support**: Installable as a Progressive Web App
- **Service Worker**: Enables offline functionality
- **No Server Required**: Fully decentralized communication

### Privacy & Security
- **No Data Upload**: All information stays on your device
- **Local-Only Communication**: Messages don't leave the mesh network
- **User Control**: Complete control over what information to share

### User Experience
- **Responsive Design**: Works on all screen sizes
- **Emergency Theme**: Red color scheme for quick recognition
- **Clear Status Indicators**: Visual badges show connection and safety status
- **Intuitive Navigation**: Tab-based interface for easy access

## Use Cases

### Disaster Scenarios
- Natural disasters (earthquakes, hurricanes, floods)
- Power outages affecting internet infrastructure
- Communication network failures
- Search and rescue operations

### Rural & Remote Areas
- Areas with poor or no internet connectivity
- Remote hiking and camping
- Rural communities with limited infrastructure
- Maritime and aviation emergencies

### Mass Gatherings
- Large events where cellular networks are overwhelmed
- Protests and demonstrations
- Festivals and concerts
- Emergency evacuations

## Technology Stack
- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS
- **P2P**: WebRTC (via SimplePeer)
- **Storage**: LocalStorage API
- **Location**: Geolocation API
- **Notifications**: Web Notifications API
- **PWA**: Service Workers, Web App Manifest

## Browser Compatibility
Works on all modern browsers that support:
- WebRTC
- LocalStorage
- Geolocation
- Service Workers
- Web Notifications

Recommended browsers: Chrome, Firefox, Safari, Edge (latest versions)
