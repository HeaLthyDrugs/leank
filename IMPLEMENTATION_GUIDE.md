# Implementation Guide - LeanK P2P Platform

## User Flow

### 1. Home Page (`/`)
- User can **Create Room** or **Join Room**
- Creating room generates UUID and redirects to `/lobby/[roomId]?host=true`
- Joining room accepts room ID or full link and redirects to `/lobby/[roomId]`

### 2. Lobby Page (`/lobby/[roomId]`)

#### Host Flow:
1. Arrives with `?host=true` parameter
2. Sees QR code and shareable links
3. Views real-time list of participants joining
4. Can start session anytime by clicking "Start Session"
5. System checks camera/microphone permissions
6. On permission grant, broadcasts session start to all peers
7. Redirects to `/room/[roomId]`

#### Participant Flow:
1. Arrives without host parameter
2. Sees "Waiting for host" message
3. Views participant list in real-time
4. "Join Session" button is disabled until host starts
5. When host starts, receives session state update
6. Auto-redirects to `/room/[roomId]`
7. Can also manually click "Join Session" after host starts

### 3. Room Page (`/room/[roomId]`)
- Active video/audio call interface
- Video grid with all participants
- Control bar with media controls
- Chat panel (toggle)
- File sharing capability
- Screen sharing option

## Key Features Implemented

### ✅ Room Management
- UUID-based room IDs
- QR code generation for easy sharing
- Multiple sharing options (link, room ID)
- Host/participant role distinction

### ✅ Real-time Synchronization
- Peer join/leave detection
- Live participant count
- Session state broadcasting
- Automatic participant redirection

### ✅ Media Permissions
- Pre-flight permission checks
- Error handling for denied permissions
- Retry mechanism
- Clear error messages

### ✅ P2P Connection
- Trystero for signaling
- SimplePeer for WebRTC
- STUN server configuration
- Automatic peer discovery

### ✅ Session Control
- Host-controlled session start
- State synchronization across peers
- Graceful handling of late joiners
- Session persistence

## Technical Implementation

### Hooks Created:
1. **useRoom** - Room connection and peer management
2. **useRoomState** - Session state synchronization
3. **useMedia** - Local media stream handling
4. **useMediaPermissions** - Permission checking
5. **useChat** - P2P messaging
6. **useFileShare** - File transfer
7. **usePeerConnection** - WebRTC peer connections

### Routes:
- `/` - Landing page
- `/lobby/[roomId]` - Pre-session lobby
- `/room/[roomId]` - Active session

### Components:
- **VideoGrid** - Responsive video layout
- **ChatPanel** - Real-time messaging UI
- **ControlBar** - Media controls
- **RoomView** - Main session interface
- **Button** - Reusable UI component

## How It Works

### Room Creation:
```
User clicks "Create Room"
  → Generate UUID
  → Navigate to /lobby/[roomId]?host=true
  → Initialize Trystero room
  → Display QR code and links
  → Wait for peers or start session
```

### Joining Room:
```
User enters room ID/link
  → Parse room ID
  → Navigate to /lobby/[roomId]
  → Connect to Trystero room
  → Listen for session start
  → Auto-redirect when host starts
```

### Starting Session:
```
Host clicks "Start Session"
  → Check media permissions
  → Broadcast session state
  → Navigate to /room/[roomId]
  → Initialize WebRTC connections
  → Start media streaming
```

### Peer Connection:
```
Peer A joins room
  → Trystero signals peer join
  → SimplePeer creates offer
  → Exchange ICE candidates
  → Establish WebRTC connection
  → Stream media tracks
```

## Testing Checklist

- [ ] Create room and verify QR code generation
- [ ] Copy room link and verify format
- [ ] Join room from another browser/device
- [ ] Verify real-time peer list updates
- [ ] Test host starting session
- [ ] Verify participant auto-redirect
- [ ] Test media permissions flow
- [ ] Verify video/audio streaming
- [ ] Test chat functionality
- [ ] Test file sharing
- [ ] Test screen sharing
- [ ] Verify graceful disconnection

## Next Steps

1. Add TURN server support for restrictive networks
2. Implement reconnection logic
3. Add network quality indicators
4. Implement recording capability
5. Add virtual backgrounds
6. Implement hand raise feature
7. Add participant muting (host control)
8. Implement breakout rooms
