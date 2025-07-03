# Multi-stage Docker build for Navi ElizaOS Agent  
FROM node:20-alpine AS base

# Install system dependencies and bun
RUN apk add --no-cache curl dumb-init && \
    npm install -g bun@1.2.5

# Builder stage: install dev tools and build plugins
FROM base AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache \
    build-base \
    python3 \
    make \
    git \
    jq

# Create python symlink
RUN [ ! -f /usr/bin/python ] && ln -s /usr/bin/python3 /usr/bin/python || true

# Copy core files
COPY package.json bun.lock* bunfig.toml ./
COPY tsconfig.json tsup.config.ts ./

# Copy source code
COPY src ./src
COPY plugins ./plugins

# Install all dependencies (including workspace plugins)
RUN bun install

# Build each plugin individually
RUN echo "Building workspace plugins..." && \
    for plugin in plugins/*; do \
        if [ -d "$plugin" ] && [ -f "$plugin/package.json" ]; then \
            plugin_name=$(basename "$plugin"); \
            echo "Building plugin: $plugin_name"; \
            (cd "$plugin" && \
             bun install && \
             bun run build && \
             echo "Built $plugin_name successfully") || \
            (echo "Failed to build $plugin_name" && exit 1); \
        fi; \
    done

# Verify plugin builds
RUN echo "Verifying plugin builds..." && \
    for plugin in plugins/*; do \
        if [ -d "$plugin" ] && [ -f "$plugin/package.json" ]; then \
            if [ ! -d "$plugin/dist" ]; then \
                echo "ERROR: $plugin/dist not found!" && exit 1; \
            fi; \
            echo "✓ $(basename "$plugin") built successfully"; \
        fi; \
    done

# Build main application
RUN bun run build:main

# Prod-deps stage: install only production dependencies
FROM base AS prod-deps

WORKDIR /app

COPY package.json bun.lock* bunfig.toml ./
COPY --from=builder /app/plugins ./plugins

# Install production dependencies (no devDeps) - allow lockfile updates for workspace deps
RUN bun install --production

# Production stage: final runtime image
FROM base AS production

# Install runtime dependencies
RUN apk add --no-cache ffmpeg python3 && \
    apk upgrade --no-cache

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs

WORKDIR /app

# Copy package files
COPY --chown=nodejs:nodejs package.json bunfig.toml ./

# Copy node_modules from prod-deps
COPY --from=prod-deps --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy built app and plugins
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/plugins ./plugins

# Create proper workspace symlinks in node_modules
RUN echo "Setting up workspace plugin symlinks..." && \
    for plugin_dir in plugins/*; do \
        if [ -d "$plugin_dir" ] && [ -f "$plugin_dir/package.json" ]; then \
            plugin_name=$(node -p "require('./plugins/$(basename "$plugin_dir")/package.json').name"); \
            echo "Creating symlink for $plugin_name"; \
            mkdir -p "node_modules/@elizaos"; \
            plugin_basename=$(basename "$plugin_name"); \
            ln -sf "../../../plugins/$(basename "$plugin_dir")" "node_modules/@elizaos/$plugin_basename"; \
            echo "✓ $plugin_name -> node_modules/@elizaos/$plugin_basename"; \
        fi; \
    done && \
    echo "Verifying workspace plugin resolution..." && \
    for plugin_dir in plugins/*; do \
        if [ -d "$plugin_dir" ] && [ -f "$plugin_dir/package.json" ]; then \
            plugin_name=$(node -p "require('./plugins/$(basename "$plugin_dir")/package.json').name"); \
            if [ -f "node_modules/@elizaos/$(basename "$plugin_name")/package.json" ]; then \
                echo "✓ $(basename "$plugin_name") workspace link verified"; \
            else \
                echo "✗ Failed to verify workspace link for $(basename "$plugin_name")" && exit 1; \
            fi; \
        fi; \
    done

# Create workspace configuration for runtime
RUN echo '{"type":"workspace","root":"/app","plugins":{"@elizaos/plugin-akash":"./plugins/plugin-akash","@elizaos/plugin-akash-chat":"./plugins/plugin-akash-chat","@elizaos/plugin-knowledge":"./plugins/plugin-knowledge","@elizaos/plugin-web-search":"./plugins/plugin-web-search"},"packages":["plugins/*"]}' > .elizaworkspace.json

# Create data/logs directories and set ownership
RUN mkdir -p data logs && \
    chown -R nodejs:nodejs .

# Environment variables
ENV NODE_ENV=production \
    ELIZA_DISABLE_AUTO_INSTALL=true \
    ELIZA_PLUGIN_AUTO_INSTALL=false \
    ELIZA_DISABLE_PLUGIN_DOWNLOAD=true \
    NODE_OPTIONS="--max-old-space-size=2048" \
    LOG_LEVEL=info \
    NODE_PATH="/app/node_modules:/app/plugins" \
    WORKSPACE_ROOT="/app"

USER nodejs

EXPOSE 3000
EXPOSE 50000-50100/udp

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["./node_modules/.bin/elizaos", "start"]