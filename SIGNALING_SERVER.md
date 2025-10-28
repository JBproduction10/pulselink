# PulseLink Signaling Server

## Overview

PulseLink uses a **signaling server** to help peers discover each other and establish WebRTC connections. While the app is designed for "offline" emergency communication, peers need to initially connect through a signaling server to exchange connection information.

## How It Works

1. **Initial Discovery**: Both peers connect to the same signaling server
2. **Exchange Connection Info**: The signaling server relays WebRTC signaling data between peers
3. **Direct P2P Connection**: Once connected, peers communicate directly without the server
4. **Offline Communication**: After the initial connection, peers can continue communicating even without internet

## Running the Signaling Server Locally

### For Development (Testing on Same Machine)

To test the app with multiple browser tabs/windows:

1. **Start the signaling server:**
   ```bash
   bun run signaling
   ```
   This runs the server on `http://localhost:3001`

2. **Start the app (in another terminal):**
   ```bash
   bun run dev
   ```
   The app runs on `http://localhost:3000`

3. **Test with multiple tabs:**
   - Open `http://localhost:3000` in two different browser tabs
   - Enter different names in each tab
   - Click "Connect to Network" in both tabs
   - The peers should discover each other!

### For Testing on Different Devices (Same Network)

To test between two phones/computers on the same WiFi:

1. **Find your local IP address:**
   ```bash
   # On Mac/Linux:
   ifconfig | grep "inet "

   # On Windows:
   ipconfig
   ```
   Look for something like `192.168.1.x`

2. **Start the signaling server:**
   ```bash
   bun run signaling
   ```

3. **Update the WebRTC config** to use your local IP:
   - Edit `lib/webrtc.ts` line 31
   - Change `http://localhost:3001` to `http://YOUR_LOCAL_IP:3001`

4. **Start the app:**
   ```bash
   bun run dev
   ```

5. **Access from devices:**
   - Device 1: `http://YOUR_LOCAL_IP:3000`
   - Device 2: `http://YOUR_LOCAL_IP:3000`
   - Both will connect through the signaling server at `http://YOUR_LOCAL_IP:3001`

## Deploying the Signaling Server

### Option 1: Deploy to Glitch (Free & Easy)

1. Go to [glitch.com](https://glitch.com)
2. Create a new Node.js project
3. Copy the contents of `server.js` to your Glitch project
4. Add `socket.io` to `package.json` dependencies
5. Your server will be at `https://YOUR-PROJECT-NAME.glitch.me`
6. Update `lib/webrtc.ts` line 31 with your Glitch URL

### Option 2: Deploy to Railway (Free Tier)

1. Create account at [railway.app](https://railway.app)
2. Create a new project from GitHub repo
3. Set the start command to `node server.js`
4. Railway will give you a public URL
5. Update `lib/webrtc.ts` with your Railway URL

### Option 3: Deploy to Render (Free Tier)

1. Create account at [render.com](https://render.com)
2. Create a new Web Service
3. Connect your GitHub repo
4. Set build command: `bun install`
5. Set start command: `node server.js`
6. Update `lib/webrtc.ts` with your Render URL

### Option 4: Use Environment Variables

Add to your `.env.local`:
```
NEXT_PUBLIC_SIGNALING_SERVER=https://your-signaling-server.com
```

Then update `lib/webrtc.ts`:
```typescript
this.signalingServer = config.signalingServer ||
  process.env.NEXT_PUBLIC_SIGNALING_SERVER ||
  defaultServer;
```

## Troubleshooting

### "Unable to find and connect to nearby peer"

**Causes:**
- Signaling server is not running
- Devices are not connected to the same signaling server
- Firewall blocking WebRTC connections
- Different network restrictions (NAT, corporate firewall)

**Solutions:**
1. ✅ Make sure the signaling server is running
2. ✅ Check that both devices can reach the signaling server
3. ✅ Use the demo mode to test without peers (see README)
4. ✅ Try connecting from devices on the same network first
5. ✅ Check browser console for connection errors

### Testing Without a Signaling Server

Use the built-in **Demo Mode**:
1. Go to the Emergency tab
2. Find the purple "Demo Mode" card
3. Click "Simulate Incoming Message"
4. See simulated messages in the Messages tab

### Local Fallback (Same Browser Only)

If the signaling server is unavailable, PulseLink falls back to `BroadcastChannel` API:
- **Only works** between tabs in the same browser
- **Does not work** across different devices
- Useful for development and testing

## Production Deployment

For a production emergency communication system, you should:

1. **Deploy your own signaling server** to a reliable hosting service
2. **Use multiple signaling servers** for redundancy
3. **Configure TURN servers** for restrictive network environments (already configured in the app)
4. **Monitor server health** and implement automatic failover

The WebRTC configuration already includes:
- ✅ Multiple STUN servers for NAT traversal
- ✅ TURN servers for restrictive networks
- ✅ Automatic fallback mechanisms
- ✅ Connection retry logic

## Security Notes

The current signaling server is for development/testing. For production:

- Implement authentication
- Add rate limiting
- Use HTTPS/WSS only
- Validate all incoming messages
- Add logging and monitoring
- Implement user limits per room

## Questions?

Check the main [README.md](README.md) for more information about PulseLink features and usage.
