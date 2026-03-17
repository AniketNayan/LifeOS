# Setup Guide

This guide provides detailed instructions for setting up the Life OS Goals System for development and production.

## Prerequisites

### System Requirements
- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 8.0.0 or higher (comes with Node.js)
- **PostgreSQL**: Version 12.0 or higher
- **Git**: For version control

### Verify Installation
```bash
node --version
npm --version
psql --version
git --version
```

## Development Setup

### 1. Clone Repository
```bash
git clone <repository-url>
cd life-os-goals-system
```

### 2. Install Dependencies
```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

### 3. PostgreSQL Setup

#### Option A: Local PostgreSQL Installation
1. Install PostgreSQL on your system
2. Create a database:
```sql
CREATE DATABASE life_os_goals;
CREATE USER lifeos_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE life_os_goals TO lifeos_user;
```

#### Option B: Docker PostgreSQL
```bash
docker run --name lifeos-postgres \
  -e POSTGRES_DB=life_os_goals \
  -e POSTGRES_USER=lifeos_user \
  -e POSTGRES_PASSWORD=your_password \
  -p 5432:5432 \
  -d postgres:13
```

### 4. Environment Configuration

#### Backend (.env)
```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:
```env
DATABASE_URL="postgresql://postgres:Anik@localhost:5432/life_os_goals"
JWT_ACCESS_SECRET="your-secure-access-secret-here"
JWT_REFRESH_SECRET="your-secure-refresh-secret-here"
PORT=3000
FRONTEND_URL="http://localhost:5173"
```

**Security Note**: Never commit `.env` files to version control. Use strong, random strings for JWT secrets.

#### Frontend (.env) - Optional
Only needed if changing default API URL:
```env
VITE_API_URL="http://localhost:3000"
```

### 5. Database Initialization
```bash
cd backend

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# Optional: Seed with sample data
npm run db:seed
```

### 6. Start Development Servers

#### Option A: Start Both Services
```bash
npm run dev:all
```

#### Option B: Start Separately
```bash
# Terminal 1: Backend
npm run dev:backend

# Terminal 2: Frontend
npm run dev:frontend
```

### 7. Verify Setup
1. Open http://localhost:5173 in your browser
2. Try registering a new account or logging in with demo credentials
3. Check that you can create goals and tasks

## Production Deployment

### Environment Variables
Set these in your production environment:

```env
NODE_ENV=production
DATABASE_URL="postgresql://user:pass@host:5432/db"
JWT_ACCESS_SECRET="secure-random-string"
JWT_REFRESH_SECRET="secure-random-string"
FRONTEND_URL="https://yourdomain.com"
PORT=3000
```

### Build Process
```bash
# Build frontend
npm run build

# Build backend
cd backend && npm run build
```

### Database Migration
```bash
cd backend
npx prisma migrate deploy
```

### Running in Production
```bash
# Backend
cd backend
npm run start:prod

# Frontend is served as static files
```

## Troubleshooting

### Common Issues

#### Database Connection Failed
- Verify PostgreSQL is running
- Check DATABASE_URL format
- Ensure database and user exist
- Test connection: `psql "postgresql://user:pass@localhost:5432/db"`

#### Port Already in Use
- Change PORT in .env
- Kill process using port: `lsof -ti:3000 | xargs kill`

#### CORS Errors
- Verify FRONTEND_URL matches your frontend domain
- For development, ensure backend runs on port 3000

#### Authentication Issues
- Check JWT secrets are set
- Verify cookie settings for your domain
- Clear browser cookies if issues persist

### Database Issues

#### Reset Database
```bash
cd backend
npx prisma migrate reset --force
npm run db:seed
```

#### View Database
```bash
cd backend
npx prisma studio
```

### Performance Issues

#### Database Optimization
- Ensure proper indexes (check schema.prisma)
- Monitor slow queries
- Consider connection pooling for production

#### Frontend Performance
- Run `npm run build` for production build
- Enable gzip compression on server
- Use CDN for static assets

## Development Tools

### Recommended VS Code Extensions
- TypeScript and JavaScript Language Features
- Prisma
- Tailwind CSS IntelliSense
- ESLint
- Prettier

### Useful Commands
```bash
# Format code
cd backend && npm run format

# Lint code
cd backend && npm run lint

# Run tests
cd backend && npm run test

# Database management
cd backend && npx prisma studio
cd backend && npx prisma migrate dev --name new-feature
```

## Security Checklist

- [ ] JWT secrets are strong random strings
- [ ] Database credentials are secure
- [ ] CORS origin is restricted to your domain
- [ ] HTTPS is enabled in production
- [ ] Database backups are configured
- [ ] Environment variables are not logged
- [ ] Rate limiting is enabled
- [ ] Input validation is in place

## Support

If you encounter issues:
1. Check this guide and README.md
2. Review error logs in terminal/console
3. Verify all prerequisites are met
4. Check GitHub issues for similar problems