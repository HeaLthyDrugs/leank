# 🧠 AI IDE Rules – P2P Communication Web App

This document defines all architectural, coding, and behavioral rules that **AI assistants or IDE copilots** must follow while contributing to this project.

---

## 🏗️ 1. Project Overview

**Goal:**  
Build a **frontend-only SaaS-quality P2P communication web app** using **Next.js (React)**.  
It supports:
- 1:1 or group **video & voice calls**
- **Real-time chat**
- **File sharing**
- **Screen sharing**
- **No backend, no auth, no persistence**

Everything runs **peer-to-peer** using **WebRTC** and **Trystero/simple-peer** with **public STUN/TURN servers**.

---

## ⚙️ 2. Core Tech Stack

| Layer | Library / Tool | Notes |
|-------|----------------|-------|
| Framework | **Next.js (App Router)** | For modern routing and build optimization |
| Styling | **TailwindCSS** + custom gradients | Use Apple/VisionOS-inspired clean aesthetic |
| P2P Core | **Trystero** or **simple-peer** | For WebRTC abstraction |
| Signaling | **Firebase Realtime DB (temporary)** or **Trystero’s room API** | For initial handshake only |
| UI Components | ShadCN UI or Radix Primitives | Accessible, clean, modular |
| Icons | Lucide React | Consistent and modern |
| Deployment | **Vercel** | Zero-backend hosting |
| Testing | **Playwright** (UI) + **Vitest** (logic) | Focus on UI and P2P flow validation |

---

## 🧩 3. Architecture Rules

1. **Pure Frontend Logic**
   - No custom backend, databases, or persistent storage.
   - Use only client-side signaling for peer discovery.
   - All media and data must travel directly between peers.

2. **Component Segmentation**
   - `/components/ui` → Shared reusable UI.
   - `/components/p2p` → WebRTC & Trystero hooks and logic.
   - `/hooks` → Encapsulated logic for connection, media, and chat.
   - `/lib` → Helper functions and utilities.
   - `/styles` → Tailwind base styles and custom themes.

3. **Room System**
   - Each session = a unique room ID (generated via `crypto.randomUUID()`).
   - Room links can be shared; joining triggers peer negotiation.

4. **Media Flow**
   - Use `getUserMedia()` and `getDisplayMedia()` for local tracks.
   - Always allow toggling mic/camera.
   - Auto-handle cleanup on disconnect/unload.

5. **File Sharing**
   - Use WebRTC **DataChannel** for binary transfer.
   - Support drag-and-drop file sharing.
   - Include progress feedback and download blobs.

---

## 🎨 4. UI/UX Best Practices

1. Keep UI **clean, minimal, frosted-glass** inspired.
2. Show clear feedback for connection status (connecting, connected, disconnected).
3. Avoid clutter — every tool (chat, call, share) should be accessible via FAB or modular bottom bar.
4. Implement **responsive design**: must run smoothly on desktop browsers, tablets, and mobile Chrome.
5. Optimize re-renders — heavy elements (like video) should use `React.memo()` and lazy loading.

---

## 🧠 5. AI Coding Directives

**AI Assistants Must:**

✅ Write strictly **TypeScript-based React/Next.js** code.  
✅ Follow **functional component** style with React hooks.  
✅ Use **ESLint + Prettier** standards for formatting.  
✅ Always comment key logic for clarity.  
✅ Prioritize **performance, clarity, modularity**.  
✅ Suggest **fallbacks** for browser permissions or P2P failure.  
✅ Never introduce any third-party backend (e.g., Supabase, Firebase) unless for temporary signaling.

**AI Assistants Must NOT:**

❌ Create backend APIs, databases, or auth flows.  
❌ Store personal data or chat logs.  
❌ Use unsafe `eval()` or direct DOM manipulation.  
❌ Hardcode sensitive credentials or server URLs.  
❌ Use class components or legacy React patterns.

---

## 🔐 6. WebRTC & Networking Rules

1. Use **Google STUN server** for free connectivity:
   ```ts
   const rtcConfig = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };
