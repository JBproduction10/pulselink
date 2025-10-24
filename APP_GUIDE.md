# PulseLink - Quick Start Guide

## What is PulseLink?

PulseLink is an **emergency communication app** that works **without internet**. It uses mesh networking to connect nearby devices, allowing you to send SOS alerts, messages, and track loved ones during disasters or in areas with no connectivity.

## Getting Started

### 1. First Time Setup
1. Open the app
2. Enter your name
3. Click "Connect to Network"
4. Allow location access when prompted (optional but recommended)
5. Allow notifications when prompted (recommended for emergency alerts)

### 2. Understanding the Interface

The app has 4 main tabs:

#### 🚨 Emergency Tab
- **SEND SOS ALERT**: Large red button - press in case of emergency
  - Sends distress signal to all nearby peers
  - Includes your location (if enabled)
  - Message relays through mesh network

- **Need Help**: Yellow button for non-critical assistance
- **I'm Safe**: Green button to let others know you're okay

#### 💬 Messages Tab
- View all received messages (SOS, status updates, chat)
- Send text messages to nearby peers
- Messages show timestamp and sender location
- SOS messages are highlighted in red

#### ❤️ Contacts Tab
- Add family members and loved ones
- Track their status (safe/help/emergency)
- Quick access to important people
- See when they were last active

#### 👥 Network Tab
- View connected peers in real-time
- See active mesh network participants
- Monitor connection health
- View approximate distance to peers

## How to Use

### Sending an Emergency Alert
1. Go to Emergency tab
2. Press the large red "SEND SOS ALERT" button
3. Alert broadcasts to all connected peers
4. Message includes your location and timestamp

### Messaging Others
1. Go to Messages tab
2. Type your message in the input field
3. Press "Send" or hit Enter
4. Message appears immediately in your feed

### Adding Contacts
1. Go to Contacts tab
2. Enter contact name (e.g., "Mom")
3. Enter relationship (e.g., "Mother")
4. Press "Add Contact"

### Testing the App (Demo Mode)
1. Go to Emergency tab
2. Find the purple "Demo Mode" card
3. Click "Simulate Incoming Message"
4. Check Messages tab to see simulated alerts

## How Mesh Networking Works

```
You → Peer 1 → Peer 2 → Peer 3 → Destination
```

Messages "hop" through nearby devices to reach further destinations. Each message can relay up to 5 times, extending your range significantly.

### Range Information
- **Direct Connection**: ~100 meters
- **With 1 Relay**: ~200 meters
- **With 5 Relays**: ~600 meters+

*Actual range depends on obstacles, device type, and environment*

## Emergency Scenarios

### Natural Disaster
1. Open PulseLink immediately
2. Send status update ("I'm Safe" or "Need Help")
3. Add family members to contacts
4. Monitor messages for updates
5. Send SOS if in danger

### Lost/Stranded
1. Send SOS with location
2. Send periodic status updates
3. Monitor for responses
4. Save battery by closing other apps

### Communication Blackout
1. PulseLink continues to work
2. Messages relay through mesh network
3. Share critical information via chat
4. Coordinate meeting points

## Tips for Best Results

### Battery Conservation
- Close background apps
- Reduce screen brightness
- Disable features you don't need
- Keep device in power saving mode

### Message Priority
- Use SOS button only for real emergencies
- Use status updates for routine check-ins
- Use chat for non-critical communication

### Network Optimization
- Stay in populated areas when possible
- Encourage others to install PulseLink
- More users = stronger mesh network
- Keep app open for better connectivity

## Offline Features

All features work **completely offline**:
- ✅ Send/receive messages
- ✅ Location sharing
- ✅ Contact management
- ✅ Message history
- ✅ Peer discovery
- ✅ Status updates

Data is stored locally on your device and persists even when you close the app.

## Privacy & Security

- **No internet needed** - your data never leaves the mesh network
- **No server** - fully peer-to-peer communication
- **Local storage** - all data stays on your device
- **No tracking** - we don't collect any information
- **User control** - you decide what to share

## Installation as PWA

Install PulseLink as a Progressive Web App for offline access:

**On Android (Chrome):**
1. Open the app in Chrome
2. Tap the menu (⋮)
3. Select "Install app" or "Add to Home screen"

**On iPhone (Safari):**
1. Open the app in Safari
2. Tap the Share button
3. Select "Add to Home Screen"

**On Desktop (Chrome/Edge):**
1. Click the install icon in the address bar
2. Or go to Settings → Install PulseLink

## Troubleshooting

### Not seeing any peers?
- Make sure other people nearby have the app installed
- Try the "Demo Mode" to simulate connections
- Check if your browser supports WebRTC

### Location not working?
- Allow location permissions in browser
- Check device location settings
- Try refreshing the page

### Messages not sending?
- Verify you're connected to peers
- Check Messages tab for delivery status
- Try demo mode to test functionality

### App not working offline?
- Install as PWA for full offline support
- Check if service worker is registered
- Clear cache and reload

## System Requirements

- **Browser**: Chrome, Firefox, Safari, or Edge (latest version)
- **Device**: Any smartphone, tablet, or computer
- **Location**: GPS-enabled device (optional)
- **Notifications**: Supported on most modern devices

## Technical Details

- **Technology**: WebRTC mesh networking
- **Storage**: HTML5 LocalStorage
- **Framework**: Next.js + React
- **Offline**: Service Worker + PWA
- **No Server Required**: Fully decentralized

## Future Features

Coming soon:
- Real-time map view
- Voice messages
- Photo sharing
- Bluetooth integration
- Emergency resource sharing
- Multi-language support

## Support & Feedback

PulseLink is open source and community-driven. We welcome your feedback and contributions!

## Legal Notice

**Emergency Use Only**: PulseLink is designed for emergency and disaster scenarios. Always call official emergency services (911, 112, etc.) when available. This app supplements but does not replace professional emergency response systems.

**No Warranty**: This app is provided as-is without any warranty. Use at your own risk in emergency situations.

---

## Quick Reference Card

**Emergency**: 🚨 → Large Red Button
**Safe**: ✓ → Green "I'm Safe" Button
**Help**: ⚠️ → Yellow "Need Help" Button
**Message**: 💬 → Messages Tab → Type & Send
**Contacts**: ❤️ → Contacts Tab → Add Contact
**Network**: 👥 → Network Tab → View Peers
**Demo**: Emergency Tab → Purple Demo Card

---

**Remember**: In a real emergency, your safety comes first. Use PulseLink to coordinate with others and request help, but always prioritize your immediate safety.
