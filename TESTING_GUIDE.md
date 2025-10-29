# PulseLink - Mesh Network Testing Guide

## What Was Fixed

The mesh network connection had several issues that prevented devices from discovering and connecting to each other:

1. ✅ **Socket.IO Server Not Running**: The signaling server was not properly integrated with Next.js
2. ✅ **Wrong Signaling URL**: Fixed incorrect API route path
3. ✅ **BroadcastChannel Implementation**: Improved local peer discovery mechanism
4. ✅ **Better Error Handling**: Added comprehensive logging and error recovery
5. ✅ **Connection Status**: Enhanced UI to show connection method and status

## How to Test Mesh Networking

### Option 1: Local Testing (BroadcastChannel - Same Browser)

This is the easiest way to test the mesh network functionality:

1. **Start the Development Server**
   ```bash
   cd pulselink
   bun dev
   ```

2. **Open Multiple Browser Tabs**
   - Open http://localhost:3000 in your browser
   - Open the same URL in 2-3 more tabs (keep them in the same browser window)

3. **Set Up Each Tab**
   - In each tab, enter a different name (e.g., "Alice", "Bob", "Charlie")
   - Click "Connect to Network"

4. **Verify Connection**
   - Within 3-5 seconds, you should see other tabs appear in the "Connected Peers" section
   - Open browser console (F12) to see detailed connection logs
   - Look for messages like:
     - "Using BroadcastChannel for local peer discovery"
     - "Announced presence via BroadcastChannel"
     - "Peer discovered via BroadcastChannel"
     - "Connected to peer"

5. **Test Messaging**
   - Navigate to the "Messages" tab
   - Send a message from one tab
   - Verify it appears in other tabs

6. **Test SOS**
   - Click the SOS button in one tab
   - Verify the emergency alert appears in other tabs

### Option 2: Multi-Device Testing (Signaling Server)

For testing across different browsers or devices:

1. **Start the Signaling Server**
   ```bash
   cd pulselink
   bun run signaling
   ```
   You should see: `✅ Signaling server running on port 3001`

2. **Start the Development Server** (in another terminal)
   ```bash
   bun dev
   ```

3. **Open on Multiple Devices/Browsers**
   - Same computer, different browsers (Chrome, Firefox, Edge, etc.)
   - Different computers on the same network
   - Use your local IP address: http://192.168.x.x:3000

4. **Set Up Each Device**
   - Enter a unique name for each device
   - Click "Connect to Network"

5. **Verify Connection**
   - Check the console for signaling server connections
   - Peers should appear within 5-10 seconds

### What to Look For

#### Success Indicators

✅ **In Browser Console:**
- "Using BroadcastChannel for local peer discovery" (for same-browser tabs)
- "Announced presence via BroadcastChannel"
- "Peer discovered via BroadcastChannel: [peerId]"
- "Creating peer connection to: [peerId]"
- "Connected to peer: [peerId]"

✅ **In UI:**
- "Connected via BroadcastChannel (Local)" in Network Status card
- Green checkmark with "Connected via..." message
- Peers listed in the "Connected Peers" section
- Peer count badge shows correct number

✅ **In Signaling Server Console** (if using Option 2):
- "User connected: [socketId]"
- "User registered: [userName]"
- "Sent X peers to [userName]"
- "Forwarding signal from [userId] to [userId]"

#### Common Issues

❌ **No Peers Appearing:**
- Check browser console for errors
- Make sure you're using the same browser for multiple tabs
- Clear localStorage and try again: `localStorage.clear()`
- Refresh all tabs

❌ **"BroadcastChannel not supported":**
- Use a modern browser (Chrome, Firefox, Edge, Safari 15.4+)
- BroadcastChannel requires same browser origin

❌ **Signaling Server Not Connecting:**
- Verify signaling server is running on port 3001
- Check firewall settings
- Ensure WebSocket connections are allowed

## Debugging Tips

### Enable Verbose Logging

Open browser console (F12) and check for detailed logs. All peer discovery and connection events are logged.

### Check Connection Status

The "Network Status" card shows:
- Connection method (BroadcastChannel or Signaling Server)
- Number of connected peers
- Individual peer status

### Clear State

If connections seem stuck:
```javascript
// In browser console
localStorage.clear();
location.reload();
```

### Test Different Scenarios

1. **Rapid Connection/Disconnection**
   - Open and close tabs quickly
   - Verify cleanup and reconnection

2. **Message Relay**
   - Set up 3+ peers
   - Send messages between non-adjacent peers
   - Verify mesh routing works

3. **File Transfer**
   - Send images between peers
   - Check transfer progress

## Known Limitations

1. **BroadcastChannel Scope**: Only works within same browser instance
2. **WebRTC NAT**: Some restrictive networks may block peer connections
3. **TURN Server**: Using free public TURN servers (may have rate limits)

## Production Deployment

For production use, you'll need:

1. **Dedicated Signaling Server**: Deploy `signaling-server.js` separately
2. **TURN Servers**: Set up your own TURN servers for better reliability
3. **HTTPS**: WebRTC requires HTTPS in production

## Success Criteria

✅ Peers auto-discover within 3-5 seconds
✅ Messages sent from one peer appear on others
✅ SOS alerts trigger notifications
✅ File transfers complete successfully
✅ Connections recover after network disruptions

## Need Help?

If you're still having issues:
1. Check all console logs for errors
2. Verify network connectivity
3. Test with simplified setup (2 tabs only)
4. Try different browsers
5. Check browser compatibility with WebRTC
