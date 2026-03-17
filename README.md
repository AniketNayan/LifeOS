
# Life OS Goals System

A comprehensive goal-tracking and productivity application built with React (frontend) and NestJS (backend). Track your goals, milestones, tasks, and daily productivity with beautiful analytics and insights.

## Features

- **Goal Management**: Create hierarchical goals with milestones and short-term objectives
- **Task Tracking**: Manage daily tasks with priority levels and completion tracking
- **Daily Records**: Log productivity scores, focus hours, and personal reflections
- **Analytics Dashboard**: Visualize progress with heatmaps, streaks, and performance metrics
- **Authentication**: Secure user authentication with JWT and optional Google OAuth
- **Responsive Design**: Beautiful, mobile-first UI with dark theme

## Tech Stack

### Frontend
- React 18 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- Radix UI for accessible components
- React Router for navigation
- Recharts for data visualization

### Backend
- NestJS with TypeScript
- PostgreSQL with Prisma ORM
- JWT authentication with refresh tokens
- bcrypt for password hashing
- Rate limiting and CORS protection

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL 12+
- Git

## Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd life-os-goals-system
npm install
cd backend && npm install
```

### 2. Environment Setup

#### Backend Configuration
Copy the example environment file and configure your settings:

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` with your configuration:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/life_os_goals"

# JWT Secrets (generate secure random strings)
JWT_ACCESS_SECRET="your-super-secret-access-key"
JWT_REFRESH_SECRET="your-super-secret-refresh-key"

# Server
PORT=3000
FRONTEND_URL="http://localhost:5173"

# Optional: Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_CALLBACK_URL="http://localhost:3000/auth/google/callback"
```

#### Frontend Configuration
The frontend uses Vite's environment variables. Create `.env` in the root if needed:

```env
VITE_API_URL="http://localhost:3000"
```

### 3. Database Setup

```bash
cd backend
# Generate and run migrations
npx prisma migrate dev --name init

# Seed with sample data (optional)
npm run db:seed
```

### 4. Development

#### Start Backend
```bash
cd backend
npm run start:dev
```

#### Start Frontend
```bash
npm run dev
```

#### Start Both (Recommended)
```bash
npm run dev:all
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000

## Demo Account

After seeding the database, you can log in with:
- Email: `demo@example.com`
- Password: `password123`

## Project Structure

```
├── backend/                 # NestJS API server
│   ├── src/
│   │   ├── analytics/       # Analytics calculations
│   │   ├── auth/           # Authentication & authorization
│   │   ├── goals/          # Goal management
│   │   ├── tasks/          # Task management
│   │   ├── daily-records/  # Daily productivity logs
│   │   └── prisma/         # Database service
│   ├── prisma/
│   │   ├── schema.prisma   # Database schema
│   │   └── seed.ts         # Sample data
│   └── test/               # Backend tests
├── src/                    # React frontend
│   ├── app/
│   │   ├── components/     # Reusable UI components
│   │   ├── context/        # React context providers
│   │   ├── screens/        # Page components
│   │   └── types.ts        # TypeScript definitions
│   └── test/               # Frontend tests
├── scripts/                # Development scripts
└── guidelines/             # Project guidelines
```

## API Documentation

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - User logout
- `GET /auth/me` - Get current user info
- `GET /auth/google/url` - Get Google OAuth URL
- `GET /auth/google/callback` - Google OAuth callback

### Goals
- `GET /goals` - List user goals
- `POST /goals` - Create new goal
- `GET /goals/:id` - Get goal details
- `PUT /goals/:id` - Update goal
- `DELETE /goals/:id` - Delete goal
- `POST /goals/:id/claim-reward` - Claim goal reward

### Tasks
- `GET /tasks` - List user tasks
- `POST /tasks` - Create new task
- `GET /tasks/:id` - Get task details
- `PUT /tasks/:id` - Update task
- `DELETE /tasks/:id` - Delete task

### Daily Records
- `GET /daily-records` - List user daily records
- `POST /daily-records` - Create/update daily record
- `GET /daily-records/:date` - Get daily record for date
- `PUT /daily-records/:date` - Update daily record

### Analytics
- `GET /analytics/overview?year=2024` - Get analytics overview

## Development

### Code Quality
- ESLint for code linting
- Prettier for code formatting
- TypeScript for type safety

### Testing
```bash
# Backend tests
cd backend
npm run test

# Frontend tests (requires additional setup)
npm run test
```

### Database Management
```bash
cd backend

# Create new migration
npx prisma migrate dev --name migration-name

# Update Prisma client
npx prisma generate

# View database
npx prisma studio
```

## Deployment

### Environment Variables for Production
Ensure these are set in your production environment:

- `NODE_ENV=production`
- `DATABASE_URL` - Production PostgreSQL connection
- `JWT_ACCESS_SECRET` - Secure random string
- `JWT_REFRESH_SECRET` - Secure random string
- `FRONTEND_URL` - Your frontend domain
- `PORT` - Server port (optional, defaults to 3000)

### Build Commands
```bash
# Build frontend
npm run build

# Build backend
cd backend && npm run build
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

This project is licensed under the UNLICENSED license - see the package.json files for details.

## Acknowledgments

- Original design from Figma community
- Built with modern web technologies
- Inspired by productivity and goal-tracking methodologies
  