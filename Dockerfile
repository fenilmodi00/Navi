FROM node:20-alpine AS builder

# Build arguments for configuration
ARG NODE_ENV=production
ARG BUILD_VERSION=latest

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    build-base \
    python3 \
    make \
    git \
    curl

# Install bun globally
RUN npm install -g bun@1.2.5

# Create python symlink if it doesn't exist
RUN if [ ! -f /usr/bin/python ]; then ln -s /usr/bin/python3 /usr/bin/python; fi

# Copy package files first for better caching
COPY package.json bun.lock bunfig.toml ./

# Copy plugin package.json files first to establish workspace structure
COPY plugins/plugin-akash/package.json ./plugins/plugin-akash/
COPY plugins/plugin-akash-chat/package.json ./plugins/plugin-akash-chat/
COPY plugins/plugin-knowledge/package.json ./plugins/plugin-knowledge/
COPY plugins/plugin-web-search/package.json ./plugins/plugin-web-search/

# Install dependencies first (workspace structure is now available)
RUN bun install --frozen-lockfile

# Copy configuration files
COPY tsconfig.json tsup.config.ts ./

# Copy all plugins source code
COPY plugins ./plugins

# Copy source code
COPY src ./src

# Build all workspace plugins first

# Build the main project 
RUN bun run build

# Clean up build artifacts but keep all dependencies to avoid OpenTelemetry issues
RUN rm -rf node_modules/.cache \
    && rm -rf /root/.bun/install/cache \
    && find . -name "*.test.*" -delete \
    && find . -name "*.spec.*" -delete

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install runtime dependencies only
RUN apk add --no-cache \
    curl \
    ffmpeg \
    git \
    python3 \
    dumb-init

# Install bun globally
RUN npm install -g bun@1.2.5

# Copy built application from builder stage
COPY --from=builder /app/package.json ./
COPY --from=builder /app/bunfig.toml ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/plugins ./plugins

# Create necessary directories for ElizaOS
RUN mkdir -p data .eliza

# Set environment to production and disable plugin auto-installation
ENV NODE_ENV=production
ENV ELIZA_AUTO_INSTALL_PLUGINS=false

# Expose default ports
EXPOSE 3000
EXPOSE 50000-50100/udp

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Use dumb-init to handle signals properly and start as non-root
ENTRYPOINT ["dumb-init", "--"]
CMD ["./node_modules/.bin/elizaos", "start", "./dist/index.js"]
