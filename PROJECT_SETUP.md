# LeanK - P2P Communication Platform

## 🚀 Quick Start

### Installation
```bash
npm install
```

### Development
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
leank/
├── app/                    # Next.js app directory
│   ├── page.tsx           # Landing page (create/join room)
│   ├── layout.tsx         # Root layout
│   └── globals.css        # Global styles
├── components/
│   ├── ui/                # Reusable UI components
│   │   └── Button.tsx
│   └── p2p/               # P2P-specific components
│       ├── RoomView.tsx   # Main room interface
│       ├── VideoGrid.tsx  # Video display grid
│       ├── ChatPanel.tsx  # Chat interface
│       └── ControlBar.tsx # Media controls
├── hooks/                 # Custom React hooks
│   ├── useRoom.ts        # Room connection management
│   ├── useMedia.ts       # Media stream handling
│   ├── useChat.ts        # Chat functionality
│   └── useFileShare.ts   # File sharing
└── lib/                   # Utilities
    ├── rtc-config.ts     # WebRTC configuration
    └── utils.ts          # Helper functions
```

## ✨ Features

- ✅ **1:1 and Group Video/Voice Calls** - WebRTC-powered real-time communication
- ✅ **Real-time Chat** - P2P messaging with no server storage
- ✅ **File Sharing** - Direct peer-to-peer file transfers
- ✅ **Screen Sharing** - Share your screen with participants
- ✅ **No Backend Required** - Pure frontend, serverless architecture
- ✅ **End-to-End Encrypted** - Direct peer connections
- ✅ **Responsive Design** - Works on desktop and mobile browsers

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS 4
- **P2P Library**: Trystero (WebRTC abstraction)
- **Icons**: Lucide React
- **Deployment**: Vercel-ready

## 🎯 Usage

### Creating a Room
1. Click "Create Room" on the homepage
2. Share the generated room link with participants
3. Grant camera/microphone permissions when prompted

### Joining a Room
1. Paste the room link or ID
2. Click "Join Room"
3. Grant permissions and start communicating

### Controls
- 🎤 **Microphone**: Toggle audio on/off
- 📹 **Camera**: Toggle video on/off
- 🖥️ **Screen Share**: Share your screen
- 💬 **Chat**: Open/close chat panel
- 📤 **Upload**: Share files with peers
- ☎️ **Leave**: Exit the room

## 🔒 Privacy & Security

- No data is stored on any server
- All communication is peer-to-peer
- Room IDs are randomly generated UUIDs
- Connections use STUN servers for NAT traversal only

## 🚀 Deployment

Deploy to Vercel with one click:

```bash
npm run build
```

Or deploy directly:
```bash
vercel
```

## 📝 Notes

- Requires HTTPS in production for media permissions
- Works best on modern browsers (Chrome, Firefox, Safari, Edge)
- TURN servers may be needed for restrictive networks (not included)

## 🤝 Contributing

This is a frontend-only project following strict architectural rules:
- No backend APIs
- No authentication system
- No persistent storage
- Pure P2P communication

Refer to `.amazonq/rules/guide.md` for detailed development guidelines.
