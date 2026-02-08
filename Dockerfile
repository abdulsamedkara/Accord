# ═══════════════════════════════════════════════════════════════
# Accord - Private Discord Clone
# Development Dockerfile
# ═══════════════════════════════════════════════════════════════

FROM node:20-alpine

# Install dependencies for native modules
RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Generate Prisma client
RUN npx prisma generate

# Copy rest of the application
COPY . .

# Expose port
EXPOSE 3000

# Default command (overridden in docker-compose for dev)
CMD ["npm", "run", "dev"]
