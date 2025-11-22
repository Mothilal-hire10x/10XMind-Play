# 10XMind-Play Backend API

Complete backend implementation with **SQLite database** for persistent data storage, replacing the temporary Spark KV store.

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation & Setup

1. **Navigate to server directory:**
```bash
cd server
```

2. **Install dependencies:**
```bash
npm install
```

3. **Configure environment variables:**
```bash
cp .env.example .env
```

Edit `.env` if needed (default values work for local development).

4. **Run database migrations and seed admin user:**
```bash
npm run migrate
npm run seed
```

5. **Start the development server:**
```bash
npm run dev
```

The backend API will be available at **http://localhost:3001**

---

## 📁 Project Structure

```
server/
├── src/
│   ├── middleware/
│   │   └── auth.ts              # JWT authentication middleware
│   ├── models/
│   │   └── types.ts             # TypeScript interfaces
│   ├── routes/
│   │   ├── auth.ts              # Authentication endpoints
│   │   ├── results.ts           # Game results endpoints
│   │   └── admin.ts             # Admin management endpoints
│   ├── utils/
│   │   ├── database.ts          # SQLite database wrapper
│   │   ├── migrate.ts           # Database migrations
│   │   └── seed.ts              # Database seeding
│   └── server.ts                # Express app entry point
├── package.json
├── tsconfig.json
└── .env
```

---

## 🗄️ Database Schema

### **users** table
| Column | Type | Description |
|--------|------|-------------|
| id | TEXT | Primary key (user_xxxxx) |
| email | TEXT | Unique email address |
| password | TEXT | Bcrypt hashed password |
| role | TEXT | 'admin' or 'student' |
| created_at | INTEGER | Unix timestamp |
| updated_at | INTEGER | Unix timestamp |

**Indexes:** email, role

### **game_results** table
| Column | Type | Description |
|--------|------|-------------|
| id | TEXT | Primary key (result_xxxxx) |
| user_id | TEXT | Foreign key to users |
| game_id | TEXT | Game identifier |
| score | REAL | Game score |
| accuracy | REAL | Accuracy percentage |
| reaction_time | REAL | Average reaction time (ms) |
| details | TEXT | JSON string with additional metrics |
| completed_at | INTEGER | Unix timestamp |

**Indexes:** user_id, game_id, completed_at

### **sessions** table
| Column | Type | Description |
|--------|------|-------------|
| id | TEXT | Primary key |
| user_id | TEXT | Foreign key to users |
| token | TEXT | JWT token |
| expires_at | INTEGER | Expiration timestamp |
| created_at | INTEGER | Unix timestamp |

**Indexes:** user_id, token

---

## 🔌 API Endpoints

### **Authentication** (`/api/auth`)

#### `POST /api/auth/signup`
Create a new student account.

**Request:**
```json
{
  "email": "student@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "user": {
    "id": "user_xxxxx",
    "email": "student@example.com",
    "role": "student",
    "createdAt": 1700000000000
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### `POST /api/auth/login`
Login with existing credentials.

**Request:**
```json
{
  "email": "admin@10xscale.ai",
  "password": "Jack@123"
}
```

**Response:**
```json
{
  "user": {
    "id": "admin_default",
    "email": "admin@10xscale.ai",
    "role": "admin",
    "createdAt": 1700000000000
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### `GET /api/auth/me`
Get current user information (requires authentication).

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "user": {
    "id": "user_xxxxx",
    "email": "student@example.com",
    "role": "student",
    "createdAt": 1700000000000
  }
}
```

#### `POST /api/auth/logout`
Logout (client-side token removal).

---

### **Game Results** (`/api/results`)

All endpoints require authentication (JWT token in Authorization header).

#### `POST /api/results`
Save a game result.

**Request:**
```json
{
  "gameId": "stroop",
  "score": 95.5,
  "accuracy": 96.7,
  "reactionTime": 650,
  "details": {
    "trials": [...],
    "stroopInterference": 120,
    "congruentRT": 580,
    "incongruentRT": 700
  }
}
```

**Response:**
```json
{
  "result": {
    "id": "result_xxxxx",
    "userId": "user_xxxxx",
    "gameId": "stroop",
    "score": 95.5,
    "accuracy": 96.7,
    "reactionTime": 650,
    "details": { ... },
    "completedAt": 1700000000000
  }
}
```

#### `GET /api/results`
Get all results for the current user.

**Response:**
```json
{
  "results": [
    {
      "id": "result_xxxxx",
      "userId": "user_xxxxx",
      "gameId": "stroop",
      "score": 95.5,
      "accuracy": 96.7,
      "reactionTime": 650,
      "details": { ... },
      "completedAt": 1700000000000
    }
  ]
}
```

#### `GET /api/results/:gameId`
Get results for a specific game.

#### `DELETE /api/results/:id`
Delete a specific result (only own results).

---

### **Admin** (`/api/admin`)

All endpoints require admin authentication.

#### `GET /api/admin/users`
Get all users.

**Response:**
```json
{
  "users": [
    {
      "id": "user_xxxxx",
      "email": "student@example.com",
      "role": "student",
      "createdAt": 1700000000000
    }
  ]
}
```

#### `GET /api/admin/users/:id`
Get specific user by ID.

#### `DELETE /api/admin/users/:id`
Delete a user (cannot delete admin).

#### `GET /api/admin/results`
Get all game results from all users.

#### `GET /api/admin/results/user/:userId`
Get all results for a specific user.

#### `GET /api/admin/stats`
Get overall statistics.

**Response:**
```json
{
  "stats": {
    "totalUsers": 25,
    "totalResults": 150,
    "resultsByGame": [
      { "game_id": "stroop", "count": 30, "avg_score": 92.5 }
    ],
    "recentActivity": [
      { "date": "2025-11-22", "count": 15 }
    ]
  }
}
```

#### `DELETE /api/admin/results/:id`
Delete any result.

#### `POST /api/admin/reset`
Reset entire database (⚠️ DANGEROUS - deletes all non-admin users and results).

---

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: Bcrypt with 10 rounds
- **CORS Protection**: Configured for frontend origin only
- **Helmet**: Security headers
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **SQL Injection Protection**: Parameterized queries
- **Foreign Key Constraints**: Data integrity

---

## 🛠️ Available Scripts

```bash
# Development (hot reload)
npm run dev

# Build TypeScript
npm run build

# Production start
npm start

# Run migrations
npm run migrate

# Seed admin user
npm run seed
```

---

## 📊 Default Admin Credentials

- **Email:** `admin@10xscale.ai`
- **Password:** `Jack@123`

⚠️ **Change these in production!**

---

## 🔄 Migration from Spark KV Store

The frontend has been updated to use this backend API instead of the temporary Spark KV store:

**Old (Spark KV):**
```typescript
const [users, setUsers] = useKV('users', {})
const [results, setResults] = useKV('game-results', [])
```

**New (SQLite API):**
```typescript
import { authAPI, resultsAPI, adminAPI } from '@/lib/api-client'

// Signup/Login
const user = await authAPI.signup(email, password)

// Save result
await resultsAPI.saveResult(gameId, score, accuracy, reactionTime, details)

// Get results
const results = await resultsAPI.getResults()
```

---

## 📝 Environment Variables

### Backend (`server/.env`)
```env
PORT=3001
NODE_ENV=development
DATABASE_PATH=./database.sqlite
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5001
ADMIN_EMAIL=admin@10xscale.ai
ADMIN_PASSWORD=Jack@123
```

### Frontend (`/.env`)
```env
VITE_API_URL=http://localhost:3001/api
```

---

## 🚨 Troubleshooting

### Database locked error
Stop all running instances and delete `database.sqlite`, then run migrations again.

### CORS errors
Ensure `FRONTEND_URL` in backend `.env` matches your frontend URL.

### JWT errors
Check that the JWT_SECRET is the same across all instances.

### Port already in use
Change `PORT` in server/.env to a different port (e.g., 3002).

---

## 📦 Database Backup

**Export all data:**
```bash
# From admin dashboard "Backup All Data" button
# Or manually:
sqlite3 database.sqlite .dump > backup.sql
```

**Restore from backup:**
```bash
sqlite3 database.sqlite < backup.sql
```

---

## 🎯 Next Steps

1. ✅ Backend API with SQLite - **COMPLETED**
2. ✅ Frontend integration - **COMPLETED**
3. 🔄 Test all endpoints
4. 🔄 Deploy to production
5. 🔄 Set up SSL/HTTPS for production
6. 🔄 Configure production database backups

---

## 📞 Support

For issues or questions, check:
- Backend logs: `server/` console output
- Database file: `server/database.sqlite`
- Frontend API calls: Browser DevTools → Network tab

---

**Built with:** Express.js, SQLite3, JWT, TypeScript, Bcrypt
