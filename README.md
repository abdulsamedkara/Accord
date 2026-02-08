# 🎮 Accord

A private Discord-like real-time communication platform.

![Next.js](https://img.shields.io/badge/Next.js-16-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791)
![Redis](https://img.shields.io/badge/Redis-7-red)
![LiveKit](https://img.shields.io/badge/LiveKit-Voice-purple)

---

## 🚀 Quick Start

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (required)
- [Node.js 20+](https://nodejs.org/) (for local dev without Docker)

### Option 1: Docker (Recommended)

Start everything with one command:

```bash
docker-compose up
```

This starts:
| Service | Port | Description |
|---------|------|-------------|
| **app** | 3000 | Next.js application |
| **postgres** | 5432 | PostgreSQL database |
| **redis** | 6379 | Redis cache |
| **livekit** | 7880 | Voice/Video server |

Open [http://localhost:3000](http://localhost:3000)

### Option 2: Local Development

1. **Start infrastructure only:**
   ```bash
   docker-compose up postgres redis livekit -d
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Setup database:**
   ```bash
   npm run db:push
   ```

4. **Start dev server:**
   ```bash
   npm run dev
   ```

---

## 📁 Project Structure

```
accord/
├── docker-compose.yml      # All services
├── prisma/                 # Database schema
├── server/                 # Socket.io server
└── src/
    ├── app/               # Next.js pages & API
    ├── components/        # React components
    ├── lib/               # Utilities
    ├── realtime/          # Socket.io client
    ├── store/             # Zustand state
    └── types/             # TypeScript types
```

---

## 🔧 Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start with Socket.io |
| `npm run dev:next` | Start Next.js only |
| `npm run build` | Production build |
| `npm run db:push` | Push schema to DB |
| `npm run db:studio` | Open Prisma Studio |

---

## 📦 Tech Stack

- **Frontend**: Next.js 16, TypeScript, TailwindCSS, shadcn/ui, Zustand
- **Backend**: Next.js API Routes, Socket.io
- **Database**: PostgreSQL + Prisma ORM
- **Cache**: Redis
- **Voice/Video**: LiveKit + WebRTC

---

## 🏗️ Features

### Phase 1 ✅
- [x] User authentication (JWT)
- [x] Server creation & management
- [x] Text & voice channels
- [x] Real-time messaging
- [x] Typing indicators
- [x] Message edit/delete

### Phase 2 (Next)
- [ ] Invite system
- [ ] Presence (online/offline)
- [ ] Reactions
- [ ] Unread counts
- [ ] Mentions (@user)

### Phase 3
- [ ] Voice channels (LiveKit)
- [ ] Mute/unmute
- [ ] Speaking indicators

### Phase 4
- [ ] Screen sharing

---

## 📄 License

Private project - All rights reserved.
