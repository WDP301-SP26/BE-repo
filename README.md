[![Build and Test](https://github.com/WDP301-SP26/BE-repo/actions/workflows/build-and-test.yml/badge.svg)](https://github.com/WDP301-SP26/BE-repo/actions/workflows/build-and-test.yml)
[![Test and Build Docker](https://github.com/WDP301-SP26/BE-repo/actions/workflows/test-build-docker.yml/badge.svg)](https://github.com/WDP301-SP26/BE-repo/actions/workflows/test-build-docker.yml)

# WDP391 Backend API

A robust backend API built with NestJS framework, featuring comprehensive authentication, OAuth 2.0 integration, and modern development practices.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
  - [Option 1: Docker Compose (Recommended)](#option-1-docker-compose-recommended)
  - [Option 2: Local Development](#option-2-local-development)
- [Environment Configuration](#environment-configuration)
- [Database Setup](#database-setup)
- [OAuth Configuration](#oauth-configuration)
  - [GitHub OAuth Setup](#github-oauth-setup)
  - [Jira OAuth Setup](#jira-oauth-setup)
- [API Testing](#api-testing)
- [Development Commands](#development-commands)
- [Troubleshooting](#troubleshooting)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [Documentation](#documentation)

---

## ✨ Features

- ✅ **JWT-based Authentication** - Secure token-based authentication
- ✅ **Email/Password Registration & Login** - Traditional authentication flow
- ✅ **OAuth 2.0 Integration** - GitHub and Jira/Atlassian OAuth support
- ✅ **Account Linking** - Link multiple OAuth providers to a single account
- ✅ **Hybrid Authentication** - Combine email/password with OAuth providers
- ✅ **Swagger API Documentation** - Interactive API documentation with testing interface
- ✅ **Docker Support** - Containerized development and deployment
- ✅ **Database Migrations** - Version-controlled schema management with Prisma
- ✅ **Health Checks** - Application health monitoring endpoints
- ✅ **CI/CD Pipelines** - Automated testing and Docker builds

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|-----------|
| **Framework** | NestJS |
| **Language** | TypeScript |
| **Database** | PostgreSQL 15 |
| **ORM** | Prisma |
| **Authentication** | JWT, Passport.js |
| **OAuth Providers** | GitHub, Jira/Atlassian |
| **API Documentation** | Swagger/OpenAPI |
| **Containerization** | Docker, Docker Compose |
| **Testing** | Jest |

---

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 20+ ([Download](https://nodejs.org/))
- **npm** or **pnpm** (comes with Node.js)
- **Docker Desktop** ([Download](https://www.docker.com/products/docker-desktop/))
- **Git** ([Download](https://git-scm.com/))
- **PostgreSQL 15** (optional if using Docker)

---

## 🚀 Quick Start

### Option 1: Docker Compose (Recommended)

Perfect for getting started quickly with zero configuration.

```bash
# 1. Clone the repository
git clone https://github.com/WDP301-SP26/BE-repo.git
cd BE-repo

# 2. Copy environment file
cp .env.example .env

# 3. Start all services (PostgreSQL + API)
docker-compose up -d

# 4. Run database migrations
docker exec -it wdp391-api npx prisma migrate deploy

# 5. Open Swagger documentation
# Visit: http://localhost:3000/api
```

**That's it!** Your API is running at `http://localhost:3000`

---

### Option 2: Local Development

For developers who prefer running services locally.

```bash
# 1. Clone the repository
git clone https://github.com/WDP301-SP26/BE-repo.git
cd BE-repo

# 2. Install dependencies
npm install

# 3. Copy environment file
cp .env.example .env
# Edit .env with your database credentials

# 4. Start PostgreSQL (using Docker)
docker run -d \
  --name postgres-dev \
  -e POSTGRES_USER=wdp391 \
  -e POSTGRES_PASSWORD=wdp391password \
  -e POSTGRES_DB=wdp391_db \
  -p 5432:5432 \
  postgres:15-alpine

# 5. Generate Prisma client
npx prisma generate

# 6. Run database migrations
npx prisma migrate deploy

# 7. Start development server
npm run start:dev

# 8. Open Swagger documentation
# Visit: http://localhost:3000/api
```

---

## ⚙️ Environment Configuration

Create a `.env` file in the root directory with the following variables:

```env
# Database Configuration
DATABASE_URL="postgresql://wdp391:wdp391password@localhost:5432/wdp391_db?schema=public"

# JWT Configuration
JWT_SECRET=your-super-secret-key-change-in-production-min-32-chars
JWT_EXPIRES_IN=7d

# GitHub OAuth (Optional - leave empty if not using)
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_CALLBACK_URL=http://localhost:3000/api/auth/github/callback

# Jira OAuth (Optional - leave empty if not using)
JIRA_CLIENT_ID=your_jira_client_id
JIRA_CLIENT_SECRET=your_jira_client_secret
JIRA_CALLBACK_URL=http://localhost:3000/api/auth/jira/callback

# Frontend URL (for OAuth redirects)
FRONTEND_URL=http://localhost:5173

# Server Configuration
PORT=3000
NODE_ENV=development
```

**Important Notes:**
- Change `JWT_SECRET` to a strong, random string (minimum 32 characters)
- Update database credentials if using custom PostgreSQL setup
- OAuth credentials are optional for basic authentication testing

---

## 🗄️ Database Setup

### View Database with Prisma Studio

Prisma Studio provides a visual interface to browse and edit your database:

```bash
npx prisma studio
```

Visit: **http://localhost:5555**

### Common Database Commands

```bash
# Generate Prisma client after schema changes
npx prisma generate

# Create and apply migrations
npx prisma migrate dev --name your_migration_name

# Apply existing migrations
npx prisma migrate deploy

# Reset database (WARNING: Deletes all data)
npx prisma migrate reset --force

# View migration status
npx prisma migrate status
```

### Database Management Tools

You can also connect to PostgreSQL using GUI tools:

| Tool | Connection String |
|------|-------------------|
| **DBeaver** | `postgresql://wdp391:wdp391password@localhost:5432/wdp391_db` |
| **TablePlus** | Host: `localhost`, Port: `5432`, User: `wdp391`, Password: `wdp391password` |
| **pgAdmin** | Same as above |

---

## 🔐 OAuth Configuration

### GitHub OAuth Setup

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **"New OAuth App"**
3. Fill in the application details:
   - **Application name**: `WDP391 Local Dev`
   - **Homepage URL**: `http://localhost:3000`
   - **Authorization callback URL**: `http://localhost:3000/api/auth/github/callback`
4. Click **"Register application"**
5. Copy the **Client ID** and **Client Secret**
6. Add them to your `.env` file:
   ```env
   GITHUB_CLIENT_ID=your_client_id_here
   GITHUB_CLIENT_SECRET=your_client_secret_here
   ```

**Testing GitHub OAuth:**
- Open browser: `http://localhost:3000/api/auth/github`
- Login with GitHub and authorize the app
- You'll be redirected with an authentication token

---

### Jira OAuth Setup

1. Go to [Atlassian Developer Console](https://developer.atlassian.com/console/myapps/)
2. Click **"Create"** → **"OAuth 2.0 integration"**
3. Fill in the app details:
   - **App name**: `WDP391 Local Dev`
4. Add **OAuth 2.0 (3LO)** callback URL:
   - `http://localhost:3000/api/auth/jira/callback`
5. Add required scopes:
   - `read:me`
   - `offline_access`
6. Copy the **Client ID** and **Client Secret**
7. Add them to your `.env` file:
   ```env
   JIRA_CLIENT_ID=your_client_id_here
   JIRA_CLIENT_SECRET=your_client_secret_here
   ```

**Testing Jira OAuth:**
- Open browser: `http://localhost:3000/api/auth/jira`
- Login with Atlassian account and authorize the app
- You'll be redirected with an authentication token

---

## 🧪 API Testing

### Using Swagger UI (Recommended)

1. **Start the server** (if not already running)
2. **Open Swagger**: http://localhost:3000/api
3. **Test Authentication Flow**:

#### Step 1: Register a New User

- Endpoint: `POST /auth/register`
- Click **"Try it out"**
- Request body:
  ```json
  {
    "email": "test@example.com",
    "password": "password123",
    "full_name": "Test User",
    "student_id": "SE123456"
  }
  ```
- Click **"Execute"**
- Copy the `access_token` from the response

#### Step 2: Authorize Swagger

- Click the **"Authorize"** button (lock icon) at the top
- Enter: `Bearer YOUR_ACCESS_TOKEN`
- Click **"Authorize"** → **"Close"**

#### Step 3: Test Protected Endpoints

- Try `GET /auth/me` to view your profile
- Try `GET /auth/linked-accounts` to see connected OAuth accounts
- All requests now include your authentication token

### Quick Testing Commands

```bash
# Register a user
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"pass123","full_name":"Test User","student_id":"SE123"}'

# Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"pass123"}'

# Get profile (replace TOKEN with your access_token)
curl http://localhost:3000/auth/me \
  -H "Authorization: Bearer TOKEN"
```

### Testing OAuth Flows

OAuth flows require browser interaction and cannot be tested directly in Swagger:

1. **OAuth Login Flow** (New User):
   - Visit: `http://localhost:3000/api/auth/github` (or `/jira`)
   - Authorize the application
   - System creates account and returns token

2. **OAuth Account Linking** (Existing User):
   - Login first and get JWT token
   - Add token to Authorization header
   - Visit: `http://localhost:3000/api/auth/github` (or `/jira`)
   - Authorize to link account

For more testing scenarios, explore the Swagger UI interface at http://localhost:3000/api

---

## 💻 Development Commands

### Running the Application

```bash
# Development mode (with hot reload)
npm run start:dev

# Production mode
npm run start:prod

# Debug mode
npm run start:debug
```

### Testing

```bash
# Run all unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Run e2e tests
npm run test:e2e

# Generate test coverage report
npm run test:cov
```

### Docker Commands

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# View logs for specific service
docker-compose logs -f api

# Restart services
docker-compose restart

# Stop services
docker-compose stop

# Stop and remove containers (keeps data)
docker-compose down

# Stop and remove everything including volumes (deletes database)
docker-compose down -v

# Rebuild after code changes
docker-compose up -d --build

# Access API container shell
docker exec -it wdp391-api sh

# Access PostgreSQL container
docker exec -it wdp391-postgres psql -U wdp391 -d wdp391_db
```

### Prisma Commands

```bash
# Open Prisma Studio (visual database browser)
npx prisma studio

# Generate Prisma Client
npx prisma generate

# Create a new migration
npx prisma migrate dev --name migration_name

# Apply migrations
npx prisma migrate deploy

# Reset database
npx prisma migrate reset

# Check migration status
npx prisma migrate status

# Format schema file
npx prisma format
```

---

## 🐛 Troubleshooting

### Port 3000 Already in Use

**Windows:**
```powershell
# Find process using port 3000
netstat -ano | findstr :3000

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

**macOS/Linux:**
```bash
lsof -ti:3000 | xargs kill -9
```

**Alternative:** Change port in `.env`:
```env
PORT=3001
```

---

### Port 5432 Already in Use (PostgreSQL)

**Option 1: Stop local PostgreSQL**
```bash
# macOS
brew services stop postgresql

# Linux
sudo systemctl stop postgresql

# Windows (as Administrator)
net stop postgresql-x64-15
```

**Option 2: Use different port**

Update `docker-compose.yml`:
```yaml
postgres:
  ports:
    - "5433:5432"
```

Update `.env`:
```env
DATABASE_URL="postgresql://wdp391:wdp391password@localhost:5433/wdp391_db?schema=public"
```

---

### Database Connection Failed

```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Check PostgreSQL logs
docker-compose logs postgres

# Verify DATABASE_URL in .env matches your setup
# Ensure host, port, username, password are correct
```

---

### Prisma Client Not Generated

```bash
# Regenerate Prisma Client
npx prisma generate

# If using Docker, regenerate inside container
docker exec -it wdp391-api npx prisma generate
```

---

### OAuth Redirect Not Working

1. **Check callback URLs** match exactly in:
   - `.env` file
   - OAuth app settings (GitHub/Jira)
2. **Verify OAuth credentials** are correct
3. **Ensure frontend URL** is configured if using separate frontend
4. **Check browser console** for CORS errors

---

### Docker Container Won't Start

```bash
# View detailed logs
docker-compose logs api

# Common issues:
# 1. Syntax errors in code
# 2. Database not ready yet (wait 10-15 seconds)
# 3. Missing environment variables
# 4. Port conflicts

# Rebuild from scratch
docker-compose down -v
docker-compose up -d --build
```

---

### Cannot Access Swagger UI

1. **Verify server is running**: Check `http://localhost:3000/health`
2. **Check port**: Ensure PORT in `.env` matches URL
3. **Clear browser cache**: Try incognito/private mode
4. **Check CORS settings**: If accessing from different domain

---

### Migration Errors

```bash
# View migration status
npx prisma migrate status

# Reset and reapply all migrations (WARNING: Deletes data)
npx prisma migrate reset --force

# If migration files are out of sync
npx prisma migrate resolve --applied "migration_name"
```

For additional troubleshooting tips, check the Docker logs: `docker-compose logs -f`

---

## 📁 Project Structure

```
BE-repo/
├── src/
│   ├── modules/
│   │   ├── auth/              # Authentication & OAuth
│   │   │   ├── dto/           # Data Transfer Objects
│   │   │   ├── guards/        # Auth guards (JWT, OAuth)
│   │   │   ├── strategies/    # Passport strategies
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   └── auth.module.ts
│   │   ├── users/             # User management
│   │   └── prisma/            # Prisma service
│   ├── main.ts                # Application entry point
│   └── swagger.ts             # Swagger configuration
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── migrations/            # Database migrations
├── docs/                      # Documentation
│   ├── SWAGGER_TESTING_GUIDE.md
│   └── DOCKER_SETUP_GUIDE.md
├── test/                      # E2E tests
├── docker-compose.yml         # Docker services configuration
├── Dockerfile                 # Docker image configuration
├── .env.example               # Environment variables template
└── README.md                  # This file
```

---

## 🤝 Contributing

## Branch Naming Conventions

### Naming Rules

- Use lowercase with hyphens: `feature/add-user-authentication`
- Keep it short and descriptive (Max 3–5 words)
- Prefix with a category: `feature/`, `fix/`, `hotfix/`, etc.
- Avoid special characters, ambiguous names, or overly long names

### Branch Categories

| Prefix | Purpose | Example |
|--------|---------|---------|
| `feature/` | New features | `feature/add-search-filter` |
| `fix/` | Bug fixes | `fix/login-error-mobile` |
| `hotfix/` | Critical production fixes | `hotfix/critical-api-fix` |
| `chore/` | Maintenance tasks | `chore/update-dependencies` |
| `docs/` | Documentation updates | `docs/update-readme` |
| `refactor/` | Code refactoring | `refactor/simplify-auth-logic` |

## Commit Message Conventions

### Format

```
<type>(<optional scope>): <description>
```

### Rules

- Use imperative, present tense: "add" not "added" or "adds"
- Do not capitalize the first letter
- Do not end with a period
- Keep description concise (1-100 characters)

### Commit Types

| Type | Purpose | Example |
|------|---------|---------|
| `feat` | New feature or functionality | `feat(auth): add login endpoint` |
| `fix` | Bug fix | `fix(api): resolve null pointer error` |
| `refactor` | Code restructuring without behavior change | `refactor: simplify user service` |
| `perf` | Performance improvements | `perf: optimize database queries` |
| `style` | Code formatting (whitespace, semicolons) | `style: fix indentation` |
| `test` | Add or update tests | `test: add unit tests for auth` |
| `docs` | Documentation changes | `docs: update api documentation` |
| `build` | Build system or dependencies | `build: update nestjs to v10` |
| `ops` | Infrastructure, deployment, CI/CD | `ops: configure docker compose` |
| `chore` | Other changes (gitignore, configs) | `chore: init` |

### Pull Request Process

1. Create a feature branch from `main`
2. Make your changes with clear commit messages
3. Write or update tests as needed
4. Ensure all tests pass: `npm test`
5. Update documentation if needed
6. Submit a pull request to `main`
7. Request review from team members

---

## 🔗 Useful Links

- **API Documentation (Swagger)**: http://localhost:3000/api
- **Health Check**: http://localhost:3000/health
- **Prisma Studio**: http://localhost:5555
- **GitHub Repository**: https://github.com/WDP301-SP26/BE-repo

---

## 🆘 Need Help?

- Check the [Troubleshooting](#troubleshooting) section
- Review the [Swagger Testing Guide](./docs/SWAGGER_TESTING_GUIDE.md)
- Open an issue on GitHub
- Contact the development team

---

## 📝 License

## 🆘 Need Help?

- Check the [Troubleshooting](#troubleshooting) section
- Try the [API Testing](#api-testing) guide
- Open an issue on GitHub
- Contact the development team