# Localhost - Multiplayer Music Quiz Game

A real-time multiplayer music quiz game built with Next.js, Express, Socket.io, and Three.js. Players can compete in song guessing games, dialect lyrics quizzes, and enjoy a 3D interactive gaming experience.

## 🎮 Features

- **Multiplayer Game Rooms**: Create or join game rooms with friends
- **Song Guessing Game**: Listen to music clips and guess the song title
- **Dialect Lyrics Quiz**: Guess songs from dialect lyrics (사투리 가사 맞추기)
- **3D Interactive Environment**: Immersive 3D game experience powered by Three.js
- **User Authentication**: Support for Kakao, Google, and email/password login
- **Shop System**: Purchase skins, effects, and emojis with in-game currency (Beats)
- **User Profiles**: Track your level, beats, and game statistics
- **Real-time Chat**: Communicate with other players during games
- **Playlist Mode**: Create and share music playlists

## 🛠️ Tech Stack

### Frontend
- **Next.js 16** - React framework with App Router
- **React 19** - UI library
- **Three.js** - 3D graphics and rendering
- **React Three Fiber** - React renderer for Three.js
- **Socket.io Client** - Real-time communication
- **Tailwind CSS** - Styling
- **TypeScript** - Type safety

### Backend
- **Express.js** - Web server framework
- **Socket.io** - Real-time bidirectional communication
- **Prisma** - ORM for database management
- **PostgreSQL** - Primary database
- **Redis** - Session and real-time state management
- **TypeScript** - Type safety

### Infrastructure
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration

## 📋 Prerequisites

- **Node.js** 20+ and npm
- **Docker** and **Docker Compose**
- **PostgreSQL** 15+ (or use Docker)
- **Redis** (or use Docker)
- **FFmpeg** (for MP3 processing)
- **yt-dlp** (for downloading songs)

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd localhost
```

### 2. Environment Setup

Create a `.env` file in the project root (copy from `.env.example`):

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Backend API and Socket URLs (for browser connections)
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001

# ElevenLabs API Key (for dialect TTS)
ELEVENLABS_API_KEY=your_api_key_here
```

### 3. Backend Setup

Navigate to the backend directory:

```bash
cd backend
npm install
```

Set up the database:

```bash
# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# (Optional) Seed initial data
npm run seed:songs
```

Create a `.env` file in the `backend` directory:

```env
DATABASE_URL="postgresql://admin:1234@localhost:5432/localhost_db"
PORT=3001
NODE_ENV=development
```

### 4. Frontend Setup

Navigate to the frontend directory:

```bash
cd frontend
npm install
```

Create a `.env.local` file in the `frontend` directory:

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
ELEVENLABS_API_KEY=your_api_key_here
```

### 5. Download Songs (Optional)

To enable the song guessing game, you need to download MP3 files:

```bash
cd backend
npm run download:songs
```

This will download songs organized by genre into the `backend/songs` directory.

## 🏃 Running Locally

### Option 1: Docker Compose (Recommended)

Start all services with Docker:

```bash
# From project root
docker-compose up --build
```

This will start:
- PostgreSQL on port `5432`
- Redis on port `6379`
- Backend API on port `3001`
- Frontend on port `3000`

### Option 2: Manual Setup

#### Start Database Services

```bash
# Start PostgreSQL and Redis with Docker
docker-compose up postgres redis -d
```

#### Start Backend

```bash
cd backend
npm run dev
```

Backend will be available at `http://localhost:3001`

#### Start Frontend

```bash
cd frontend
npm run dev
```

Frontend will be available at `http://localhost:3000`

## 🐳 Docker Deployment

For production deployment, see [DEPLOY.md](./DEPLOY.md) for detailed instructions.

Quick deployment:

```bash
# Set environment variables
cp .env.example .env
# Edit .env with your EC2 IP address

# Build and start containers
docker-compose up --build -d

# Check logs
docker-compose logs -f
```

## 📁 Project Structure

```
localhost/
├── backend/                 # Express.js backend server
│   ├── prisma/             # Database schema and migrations
│   ├── songs/              # MP3 files (organized by genre)
│   ├── server.ts           # Main server file
│   └── package.json
├── frontend/               # Next.js frontend application
│   ├── app/                # Next.js App Router pages
│   │   ├── auth/           # Authentication pages
│   │   ├── game/           # Game pages
│   │   ├── main/           # Main app pages (lobby, shop, mypage)
│   │   └── page.tsx        # Root page
│   └── package.json
├── docker-compose.yml      # Docker services configuration
├── .env.example            # Environment variables template
└── README.md
```

## 🎯 Available Scripts

### Backend

```bash
npm run dev              # Start development server with hot reload
npm run start            # Start production server
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run database migrations
npm run prisma:studio    # Open Prisma Studio (database GUI)
npm run seed:songs       # Seed songs data
npm run download:songs   # Download MP3 files for games
```

### Frontend

```bash
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint
```

## 🔧 Configuration

### Database

The application uses PostgreSQL with Prisma ORM. Database schema is defined in `backend/prisma/schema.prisma`.

### Socket.io

Real-time features use Socket.io for bidirectional communication between client and server.

### MP3 Files

Songs are stored in `backend/songs/` organized by genre. For Docker deployment, mount the songs directory to `/app/songs` in the container.

## 🎨 Game Modes

1. **Music Quiz (노래 맞추기)**: Listen to song clips and guess the title
2. **Dialect Lyrics Quiz (사투리 가사 맞추기)**: Guess songs from dialect lyrics with TTS
3. **Playlist Mode**: Create and share music playlists

## 👥 User System

- **Authentication**: Kakao, Google OAuth, or email/password
- **Currency**: Beats (earned by playing games)
- **Level System**: Gain experience and level up
- **Inventory**: Purchase and equip skins, effects, and emojis
- **Game History**: Track your game results and statistics

## 🐛 Troubleshooting

### Backend won't connect

1. Check if PostgreSQL is running: `docker ps`
2. Verify database URL in `backend/.env`
3. Check backend logs: `docker-compose logs backend`

### Songs not playing

1. Ensure MP3 files exist in `backend/songs/<genre>/`
2. For Docker: Mount songs directory correctly in `docker-compose.yml`
3. Check backend logs for file access errors

### Frontend can't connect to backend

1. Verify `NEXT_PUBLIC_BACKEND_URL` in `frontend/.env.local`
2. Check if backend is running on port 3001
3. Ensure CORS is properly configured

For more troubleshooting tips, see [DEPLOY.md](./DEPLOY.md).

## 📝 License

This project is private and proprietary.

## 🤝 Contributing

This is a private project. For questions or issues, please contact the development team.
