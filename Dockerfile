# Multi-stage build for 10XMind-Play Cognitive Testing Platform
# Stage 1: Build Frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /app

# Copy frontend package files
COPY package*.json ./
COPY tsconfig.json ./
COPY vite.config.ts ./
COPY index.html ./
COPY tailwind.config.js ./
COPY components.json ./

# Install frontend dependencies
RUN npm ci

# Copy frontend source code
COPY src ./src
COPY public ./public

# Build frontend
RUN npm run build

# Stage 2: Build Backend
FROM node:20-alpine AS backend-builder

WORKDIR /app/server

# Copy backend package files
COPY server/package*.json ./
COPY server/tsconfig.json ./

# Install backend dependencies (including dev dependencies for build)
RUN npm ci

# Copy backend source code
COPY server/src ./src

# Build backend TypeScript
RUN npm run build

# Stage 3: Production Runtime
FROM node:20-alpine

WORKDIR /app

# Install production dependencies only
COPY --from=backend-builder /app/server/package*.json ./server/
WORKDIR /app/server
RUN npm ci --omit=dev

# Copy built backend
COPY --from=backend-builder /app/server/dist ./dist

# Copy built frontend
WORKDIR /app
COPY --from=frontend-builder /app/dist ./dist

# Create data directory for SQLite database
RUN mkdir -p /app/server/data

# Expose backend port
EXPOSE 3001

# Set environment variables
ENV NODE_ENV=production
ENV DATABASE_PATH=/app/server/data/database.sqlite

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/api/health || exit 1

# Start backend server
WORKDIR /app/server
CMD ["node", "dist/server.js"]
