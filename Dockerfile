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

# Accept build arguments from Railway
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_SOCKET_URL
ARG NEXT_PUBLIC_LIVEKIT_URL

# Make them available as environment variables during build
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_SOCKET_URL=$NEXT_PUBLIC_SOCKET_URL
ENV NEXT_PUBLIC_LIVEKIT_URL=$NEXT_PUBLIC_LIVEKIT_URL

# Build the application
RUN npm run build

# Expose port
EXPOSE 3000

# Default command (overridden in docker-compose for dev)
CMD ["npm", "start"]
