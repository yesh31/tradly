# Tradly - Modern Marketplace Platform

A full-stack marketplace web application connecting sellers and buyers directly. Built with React, Node.js, Express, PostgreSQL, and TypeScript.

## Tech Stack

- **Frontend**: React 19, Vite, TypeScript, Tailwind CSS, Framer Motion, Zustand, React Query
- **Backend**: Node.js, Express, TypeScript, Prisma ORM, Socket.IO, OpenAI API
- **Database**: PostgreSQL
- **Authentication**: JWT with refresh tokens, Google OAuth
- **Realtime**: Socket.IO for bidding, chat, and notifications

## Features

### Core
- User authentication (email/password + Google OAuth)
- Product listings with multiple images
- Live bidding system with real-time updates
- Real-time chat with typing indicators
- Product management (create, edit, delete, mark sold)
- AI assistant chatbot
- AI product description generator
- AI price suggestions

### Advanced
- Trust score system with verified badges
- Geolocation-based product search
- Advanced search with multiple filters
- Watchlist / saved items
- Notification system (bids, messages, auctions)
- Dark minimal UI (black & white, Apple-inspired)
- Admin dashboard with analytics
- Trending products
- Product recommendations
- Image upload with optimization
- Responsive design (mobile/tablet/desktop)

## Project Structure

```
Tradly/
├── backend/
│   ├── src/
│   │   ├── config/          # Environment & app configuration
│   │   ├── controllers/     # Route handlers
│   │   ├── middleware/       # Auth, validation, error handling
│   │   ├── routes/          # Express route definitions
│   │   ├── services/        # Business logic (AI, etc.)
│   │   ├── socket/          # Socket.IO real-time setup
│   │   ├── types/           # TypeScript type definitions
│   │   ├── utils/           # Helpers, email, upload, prisma
│   │   └── index.ts         # Server entry point
│   ├── prisma/
│   │   └── schema.prisma    # Database schema
│   └── uploads/             # Uploaded images
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/          # Reusable UI components
│   │   │   ├── layout/      # Layout components
│   │   │   └── ai/          # AI chatbot widget
│   │   ├── pages/           # Route pages
│   │   ├── store/           # Zustand state management
│   │   ├── services/        # API client & Socket.IO
│   │   ├── hooks/           # Custom React hooks
│   │   ├── types/           # Frontend type definitions
│   │   ├── App.tsx          # Main app with routing
│   │   └── main.tsx         # Entry point
│   └── ...
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Environment Setup

1. Clone the repository
2. Copy environment files:

```bash
cp backend/.env backend/.env.local
cp frontend/.env frontend/.env.local
```

3. Update the values in `.env.local` files with your credentials.

### Database Setup

```bash
cd backend
npm install
npx prisma generate
npx prisma db push
```

### Running the Application

**Backend:**
```bash
cd backend
npm run dev
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

The app will be available at `http://localhost:5173`.

### API Endpoints

| Category | Endpoint | Description |
|----------|----------|-------------|
| Auth | `POST /api/auth/register` | Register new user |
| Auth | `POST /api/auth/login` | Login |
| Auth | `POST /api/auth/google` | Google OAuth |
| Products | `GET /api/products` | List products (with filters) |
| Products | `GET /api/products/:id` | Get product details |
| Products | `POST /api/products` | Create product |
| Bids | `POST /api/bids` | Place bid |
| Bids | `GET /api/bids/product/:productId` | Get product bids |
| Chat | `POST /api/chat/conversations` | Create/get conversation |
| Chat | `GET /api/chat/conversations` | List conversations |
| Chat | `POST /api/chat/conversations/:id/messages` | Send message |
| AI | `POST /api/ai/chat` | AI chatbot |
| AI | `POST /api/ai/generate-description` | AI generate description |
| Admin | `GET /api/admin/users` | List users (admin) |
| Admin | `GET /api/admin/analytics` | Platform analytics |

## Deployment

### Build Frontend
```bash
cd frontend
npm run build
```

### Build Backend
```bash
cd backend
npm run build
```

### Docker (Coming Soon)
Docker support with `docker-compose.yml` for easy deployment.

## License

MIT
