# Quick Test Guide - Peer Connection

## ✅ Solution to "Unable to Find and Connect to Nearby Peer"

The issue was that the app needs a **signaling server** to help peers discover each other. I've set up a local signaling server for you!

## 🚀 Test Right Now (Easiest Way)

Both servers are already running:
- **Signaling Server**: `localhost:3001` ✅
- **PulseLink App**: `localhost:3000` ✅

### Test with Two Browser Tabs:

1. **Tab 1:**
   - Go to `http://localhost:3000`
   - Enter name: "Alice"
   - Click "Connect to Network"

2. **Tab 2:**
   - Open a NEW tab to `http://localhost:3000`
   - Enter name: "Bob"
   - Click "Connect to Network"

3. **Check Connection:**
   - Go to the "Network" tab in both windows
   - You should see the other peer listed!
   - Try sending a message from one to the other

## 📱 Test on Different Devices (Same WiFi)

### Step 1: Find Your Computer's IP Address

**On Mac/Linux:**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

**On Windows:**
```bash
ipconfig
```

Look for an IP like `192.168.1.x` or `10.0.0.x`

### Step 2: Access from Phones/Tablets

- **Phone 1**: Open browser, go to `http://YOUR_IP:3000`
- **Phone 2**: Open browser, go to `http://YOUR_IP:3000`
- Enter different names and connect!

## 🎯 What You Can Test

Once connected:

✅ **Send Messages**: Go to Messages tab, chat between devices
✅ **Send SOS**: Click the red SOS button, see it on the other device
✅ **Share Location**: Location is automatically shared with messages
✅ **File Transfer**: Send images/files between peers
✅ **Group Chat**: Create or join group rooms
✅ **Demo Mode**: Test without a second device (see Emergency tab)

## 🔧 Troubleshooting

### Still Can't Connect?

1. **Check the servers are running:**
   ```bash
   # Check signaling server
   curl http://localhost:3001

   # You should see "Cannot GET /"
   ```

2. **Check browser console:**
   - Press F12 to open developer tools
   - Look for "Connected to signaling server" message
   - Check for any errors

3. **Restart servers:**
   ```bash
   # Kill any existing processes
   pkill -f "node server.js"
   pkill -f "next dev"

   # Start signaling server
   cd pulselink
   bun run signaling

   # In another terminal, start app
   cd pulselink
   bun run dev
   ```

4. **Try Demo Mode:**
   - Go to Emergency tab
   - Find "Demo Mode" purple card
   - Click "Simulate Incoming Message"
   - This works WITHOUT peer connections

### Firewall Issues?

If on different devices and can't connect:
- Make sure both devices are on the same WiFi network
- Check if your firewall is blocking ports 3000 and 3001
- Try disabling firewall temporarily for testing

## 📚 For Production Use

For deploying to production (real emergency use):
1. Deploy signaling server to Glitch, Railway, or Render (free)
2. See [SIGNALING_SERVER.md](SIGNALING_SERVER.md) for detailed instructions
3. Update `lib/webrtc.ts` with your production server URL

## 🎉 You're All Set!

The app is now fully functional for peer-to-peer emergency communication!

Questions? Check:
- [SIGNALING_SERVER.md](SIGNALING_SERVER.md) - Detailed server setup
- [README.md](README.md) - Full app documentation
- [APP_GUIDE.md](APP_GUIDE.md) - User guide
