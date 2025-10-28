# PulseLink - Emergency Connection Without Internet

![PulseLink](https://img.shields.io/badge/Status-Production--Ready-success)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![License](https://img.shields.io/badge/License-MIT-blue)

**Production-ready emergency communication app that works without internet using peer-to-peer WebRTC mesh networking.**

## 🚨 Overview

PulseLink is a fullstack emergency communication application designed for disaster scenarios, rural areas, and situations where internet connectivity fails. It uses production WebRTC with TURN server support to enable reliable device-to-device communication.

### Key Features

- 🆘 **SOS Alert System** - Send emergency distress signals with location
- 💬 **Offline Messaging** - Chat with nearby users without internet
- ❤️ **Contact Management** - Track loved ones during emergencies
- 🌐 **Mesh Network** - Messages relay through nearby devices
- 📍 **Location Sharing** - GPS coordinates shared with emergency alerts
- 💾 **Offline Storage** - All data persists locally
- 📱 **PWA Support** - Install as a mobile app
- 🔔 **Push Notifications** - Alert sounds for SOS messages
- 📁 **File Transfer** - Share files between peers (images, documents)
- 👥 **Group Chat** - Public and private group communication
- 🔒 **End-to-End Encryption** - Secure messaging between peers
- 🌍 **Multi-language Support** - Available in multiple languages
- 🗺️ **Map View** - Visualize peer and contact locations

## 🏃 Quick Start

### Development

```bash
# Install dependencies
bun install

# Run development server
bun dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

### Production Build

```bash
# Build for production
bun run build

# Start production server
bun start
```

## 📱 Usage

1. **Setup**: Enter your name to join the network
2. **Emergency**: Press the red SOS button to send distress signal
3. **Messaging**: Switch to Messages tab to chat
4. **Contacts**: Add family/friends in Contacts tab
5. **Network**: View connected peers in Network tab

### Demo Mode

Test the app using the built-in demo mode:
- Go to Emergency tab
- Find the purple "Demo Mode" card
- Click "Simulate Incoming Message"
- See simulated messages in Messages tab

## 🏗️ Architecture

### Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **Styling**: Tailwind CSS v4
- **P2P Networking**: WebRTC with SimplePeer
- **State Management**: React Hooks
- **Storage**: LocalStorage API
- **Location**: Geolocation API
- **PWA**: Service Workers, Web App Manifest
- **Encryption**: Web Crypto API for E2E encryption
- **Real-time**: Socket.io for signaling server

### WebRTC Configuration

**Production-ready WebRTC with:**
- Multiple STUN servers for NAT traversal
- TURN servers for restrictive network environments
- Automatic fallback to BroadcastChannel for local discovery
- Optimized ICE candidate pool size

### Project Structure

```
pulselink/
├── src/
│   ├── app/              # Next.js app directory
│   │   ├── page.tsx      # Main application
│   │   ├── layout.tsx    # Root layout
│   │   └── globals.css   # Global styles
│   ├── lib/              # Utility libraries
│   │   ├── p2p.ts        # P2P mesh networking
│   │   ├── contacts.ts   # Contact management
│   │   └── utils.ts      # Helper functions
│   ├── components/       # UI components
│   │   └── ui/          # Reusable UI elements
│   └── types/           # TypeScript declarations
├── public/              # Static assets
│   ├── manifest.json    # PWA manifest
│   └── sw.js           # Service worker
└── FEATURES.md         # Detailed features doc
```

## 🌟 Features in Detail

### Emergency System
- Large, prominent SOS button
- Automatic location tagging
- Status updates (Safe/Help/Emergency)
- Visual and audio alerts
- Message persistence

### Mesh Networking
- Production WebRTC connections
- TURN server support for restrictive networks
- Message relaying (up to 5 hops)
- Distance estimation
- Connection status monitoring
- Offline-first architecture

### File Transfer
- Peer-to-peer file sharing
- Chunked transfer for large files (16KB chunks)
- Progress tracking
- Support for all file types
- Automatic download for received files

### Contact Management
- Add/remove loved ones
- Track contact status
- Last seen timestamps
- Location tracking
- Relationship tagging

### Message System
- Multiple message types (SOS, Status, Chat, File)
- Timestamp tracking
- Location embedding
- Read/unread status
- Offline queue
- End-to-end encryption

### Group Chats
- Public and private rooms
- Multi-user communication
- Message history
- Participant management

## 🔧 Configuration

### Environment Variables

No environment variables needed - the app works entirely client-side.

### Browser Requirements

- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+

Must support:
- WebRTC
- LocalStorage
- Geolocation
- Service Workers
- Web Notifications

## 📖 Documentation

- [Features Documentation](FEATURES.md) - Comprehensive feature list
- [User Guide](APP_GUIDE.md) - How to use the app
- [Todos](.same/todos.md) - Development roadmap

## 🚀 Deployment

### Deploy to Netlify

```bash
# Build and deploy
bun run build
netlify deploy --prod
```

### Deploy to Vercel

```bash
# Deploy with Vercel CLI
vercel --prod
```

## 🧪 Testing

### Test Scenarios

1. **Setup Test**: Enter name and connect
2. **SOS Test**: Send emergency alert
3. **Message Test**: Send and receive messages
4. **Contact Test**: Add/remove contacts
5. **Offline Test**: Close/reopen to verify persistence
6. **Demo Test**: Use demo mode for simulated traffic

## 🛠️ Development

### Key Files

- `src/app/page.tsx` - Main application UI
- `src/lib/p2p.ts` - P2P networking logic
- `src/lib/contacts.ts` - Contact management
- `src/components/ui/` - Reusable components

### Adding Features

1. Update UI in `page.tsx`
2. Add logic in `lib/` directory
3. Create components in `components/`
4. Update types in `types/`
5. Test and version

## 🐛 Known Limitations

- **Signaling Server**: Requires connection to signaling server for initial peer discovery
- **Browser Only**: No native mobile app (yet)
- **Range**: Limited by WebRTC/network range
- **Battery**: Continuous scanning may drain battery

## 🔮 Future Enhancements

- [ ] Video/audio calls via WebRTC
- [ ] Message reactions and read receipts
- [ ] Admin/moderator roles in group chats
- [ ] Native mobile apps (iOS/Android)
- [ ] Custom signaling server deployment
- [ ] Offline-first database (IndexedDB)

## ✅ Production Features

- ✅ Real WebRTC peer connections
- ✅ TURN server support for restrictive networks
- ✅ File transfer between peers
- ✅ End-to-end encryption
- ✅ Multi-language support
- ✅ Map view for locations
- ✅ Voice messages
- ✅ Image sharing
- ✅ Battery level indicators
- ✅ Emergency resource sharing
- ✅ Group chat rooms

## 🤝 Contributing

Contributions are welcome! To contribute:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - feel free to use for any purpose.

## ⚠️ Disclaimer

**Emergency Use Notice**: PulseLink is designed to supplement official emergency services, not replace them. Always contact professional emergency services (911, 112, etc.) when available.

**No Warranty**: This software is provided "as-is" without warranty of any kind. Use at your own risk in emergency situations.

## 🆘 Support

For issues, questions, or feedback:
- Open an issue on GitHub
- Check the [User Guide](APP_GUIDE.md)
- Review [Features Documentation](FEATURES.md)

## 🙏 Acknowledgments

Built with:
- [Next.js](https://nextjs.org/)
- [React](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [SimplePeer](https://github.com/feross/simple-peer)

---

**Made for emergencies. Works without internet. Production ready. Saves lives.**
