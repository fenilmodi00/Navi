# 🚀 Navi-Akash

> A powerful Discord bot for Akash Network powered by elizaOS

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node/Bun](https://img.shields.io/badge/Node.js-Bun-green.svg)](https://bun.sh/)
[![Discord](https://img.shields.io/badge/Discord-Bot-blue.svg)](https://discord.js.org/)

Navi-Akash is an intelligent developer support agent for Akash Network that lives and breathes cloud deployment. It helps users navigate the Akash ecosystem, troubleshoot deployment issues, and get projects up and running on the decentralized cloud. The bot has deep knowledge of Akash docs, SDL files, deployment processes, and integrations.

---

## ✨ Features

- 🤖 **Discord Integration**: Responds to user queries in Discord channels and DMs
- 📚 **Knowledge Base**: Vector search across 533 Akash documentation files
- 🔍 **Web Search**: Can search the web for the latest Akash Network updates
- 🎵 **Voice Support**: Can join voice channels for assistance
- 📎 **Media Handling**: Can process attachments and transcribe media
- 🧠 **Akash Chat API**: Uses Akash's own AI infrastructure for responses
- 💾 **PostgreSQL + Supabase**: Production-ready database with vector search

---

## 🛠️ Tech Stack

- **Runtime**: [Bun.js](https://bun.sh/) / Node.js (18+)
- **Framework**: [elizaOS](https://github.com/elizaOS/eliza)
- **Database**: PostgreSQL with pgvector (Supabase) + PGLite fallback
- **Vector Search**: 1024-dimensional embeddings with semantic search
- **Plugins**:
  - **@elizaos/plugin-sql**: Database operations and vector storage
  - **plugin-akash-chat**: Handles Akash Network specific chat functionality
  - **plugin-discord**: Manages Discord integration
  - **plugin-knowledge**: Provides knowledge base functionality with vector search
  - **plugin-web-search**: Enables web search capabilities

---

## 🗄️ Database Configuration

### Production: Supabase PostgreSQL
- **Database**: PostgreSQL 15 with pgvector 0.8.0
- **Vector Search**: 1024-dimensional embeddings using BAAI-bge-large-en-v1.5
- **Connection**: IPv4-compatible Transaction Pooler
- **Knowledge Base**: 533 Akash Network documentation files automatically indexed

### Local Development: PGLite Fallback
- **Embedded PostgreSQL**: Runs locally without external dependencies
- **Same Schema**: Identical to production for seamless development
- **Automatic Fallback**: When no POSTGRES_URL is provided

### Environment Configuration
```bash
# Production Database (Supabase)
POSTGRES_URL=postgresql://username:password@hostname:port/database
VECTOR_SEARCH_ENABLED=true
EMBEDDING_DIMENSION=1024

# Knowledge Base Processing
LOAD_DOCS_ON_STARTUP=true
CTX_KNOWLEDGE_ENABLED=false

# Local Development Fallback
# PGLITE_DATA_DIR=./.elizadb
```

---

## 📋 Prerequisites

- [Bun.js](https://bun.sh/) (latest version)
- Node.js (v18+)
- Python 3 (for some dependencies)
- Git
- Discord bot token and application ID
- Akash Chat API key
- Tavily API key (for web search)
- **Optional**: Supabase account for production database

---

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/fenilmodi00/navi-akash.git
cd navi-akash
```

### 2. Install Dependencies

```bash
bun install
# or, if you prefer npm:
npm install
```

### 3. Environment Setup

Copy and configure environment variables:

```bash
cp .env.example .env
# Edit .env with your API keys (see configuration section below)
```

### 4. Build and Start

```bash
# Build all plugins and main project
bun run build

# Start the application
bun run start
```

For development mode with auto-reload:

```bash
bun run dev
```

This will:
- ✅ Connect to Supabase (if configured) or use local PGLite
- ✅ Load and index 533 Akash documentation files
- ✅ Enable vector search capabilities
- ✅ Start Discord bot and web interface

---

## 🔑 Required Environment Variables

### Discord Configuration (Required)
Get your Discord credentials from [Discord Developer Portal](https://discord.com/developers/applications):

```env
DISCORD_APPLICATION_ID=your_discord_application_id
DISCORD_API_TOKEN=your_discord_bot_token
```

### Akash Chat API (Required)
Get your API key from [Akash Chat API](https://chatapi.akash.network):

```env
AKASH_CHAT_API_KEY=your_akash_chat_api_key
AKASH_CHAT_BASE_URL=https://chatapi.akash.network/api/v1
OPENAI_API_KEY=your_akash_chat_api_key  # Same as above
OPENAI_BASE_URL=https://chatapi.akash.network/api/v1
```

### Tavily API (Required for Web Search)
Get your API key from [Tavily](https://tavily.com):

```env
TAVILY_API_KEY=your_tavily_api_key
```

### Database Configuration (Optional - uses PGLite if not provided)

For production with Supabase:
```env
# Supabase PostgreSQL with Transaction Pooler (recommended)
POSTGRES_URL=postgresql://username:password@project.pooler.supabase.com:6543/postgres
VECTOR_SEARCH_ENABLED=true
EMBEDDING_DIMENSION=1024
```

For local development only:
```env
# Optional: Custom PGLite directory
PGLITE_DATA_DIR=./.elizadb
```

### Knowledge Base Configuration
```env
LOAD_DOCS_ON_STARTUP=true
CTX_KNOWLEDGE_ENABLED=false
EMBEDDING_PROVIDER=akash
TEXT_EMBEDDING_MODEL=BAAI-bge-large-en-v1-5

# Akash Knowledge Base Repository
DOCS_REPO_1_URL=https://github.com/fenilmodi00/akash-knowledge-base.git
DOCS_REPO_1_PATH=./data/akash-knowledge-base
DOCS_REPO_1_BRANCH=main
DOCS_REPO_1_DOCS_PATH=docs-akash
```

---

## 🗄️ Database Setup Guide

### Option 1: Production with Supabase (Recommended)

1. **Create Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Note your project details

2. **Enable pgvector Extension**
   - Go to SQL Editor in Supabase dashboard
   - Run: `CREATE EXTENSION IF NOT EXISTS vector;`

3. **Get Connection String**
   - Go to Settings > Database
   - Copy the "Transaction Pooler" connection string (for IPv4 compatibility)
   - Add to your `.env` file as `POSTGRES_URL`

4. **Verify Setup**
   ```bash
   bun run dev
   # Look for: "✅ Successfully connected to Supabase via Transaction Pooler!"
   ```

### Option 2: Local Development Only

Simply start the application without `POSTGRES_URL` - it will automatically use PGLite:

```bash
# Remove or comment out POSTGRES_URL in .env
# POSTGRES_URL=...

bun run dev
# Look for: "Using PGLite for local development"
```

### Database Features

- **Automatic Schema Creation**: Tables created automatically on first run
- **Vector Search**: Semantic search across 533 Akash documents
- **Dual Database Support**: Supabase for production, PGLite for development
- **Migration Support**: Automatic database migrations via Drizzle ORM

---

## 🎯 Complete Setup Guide

### Step-by-Step Instructions

1. **Clone and Setup**
   ```bash
   git clone https://github.com/fenilmodi00/navi-akash.git
   cd navi-akash
   ```

2. **Install Dependencies**
   ```bash
   bun install
   ```

3. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys (see sections above)
   ```

4. **Build and Start**
   ```bash
   bun run build && bun run start
   ```

5. **Verify Setup**
   - Check console for successful database connection
   - Check knowledge base loading (533 documents)
   - Test Discord bot functionality
   - Visit http://localhost:3000 for web interface

---

## 🔧 Development

### Development Mode

```bash
bun run dev
# or
npm run dev
```

### Available Scripts

- `bun run build` - Build all plugins and main project
- `bun run start` - Start the application
- `bun run dev` - Start in development mode with auto-reload
- `bun run docker:build` - Build Docker image
- `bun run docker:run` - Run Docker container

### Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Navi Agent    │ ── │ @elizaos/plugin- │ ── │   PostgreSQL    │
│    (ElizaOS)    │    │      sql         │    │   (Supabase)    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │              ┌─────────────────┐
         └─── Vector Search ─────┼─────────────→│   pgvector      │
                                 │              │  (1024 dims)    │
                                 │              └─────────────────┘
                        ┌─────────────────┐
                        │  533 Akash      │
                        │  Documents      │
                        │  (Auto-indexed) │
                        └─────────────────┘
```

---

## 🐳 Docker Deployment

If you prefer Docker:

```bash
# Build and run with Docker
bun run docker:build
bun run docker:run

# Or using docker-compose
docker-compose up -d --build
```

---

## 📁 Project Structure

```
navi-akash/
├── plugins/                  # Plugin directories
│   ├── plugin-akash-chat/    # Akash Network functionality
│   ├── plugin-discord/       # Discord integration
│   ├── plugin-knowledge/     # Knowledge base & vector search
│   └── plugin-web-search/    # Web search capabilities
├── src/                      # Main application code
│   ├── index.ts              # Main entry point & character config
│   ├── plugin.ts             # Plugin configuration
│   ├── lib/                  # Shared libraries
│   ├── types/                # TypeScript types
│   └── utils/                # Utility functions
├── data/                     # Data storage
│   └── akash-knowledge-base/ # Knowledge base (533 docs)
├── dist/                     # Built output
├── .env.example              # Environment template
├── package.json              # Dependencies and scripts
├── deploy.yaml               # Akash Network deployment config
├── docker-compose.yml        # Docker Compose configuration
└── Dockerfile                # Docker image configuration
```

---

## 🌐 Akash Network Deployment

Deploy Navi-Akash directly on Akash Network using the provided SDL file:

```bash
# Deploy to Akash Network
akash tx deployment create deploy.yaml --from [your-wallet] --node [node-url] --chain-id akashnet-2
```

### SDL Configuration (`deploy.yaml`)

The project includes a production-ready SDL file with:
- **Resources**: 2 CPU, 2GB RAM, 20GB storage
- **Ports**: HTTP (3000) and UDP (50000-50004) for voice
- **Environment**: All necessary environment variables
- **Persistent Storage**: For data and logs
- **Database**: Configured for Supabase production database

Key environment variables in SDL:
```yaml
env:
  - POSTGRES_URL=your_supabase_connection_string
  - DISCORD_API_TOKEN=your_discord_token
  - AKASH_CHAT_API_KEY=your_akash_api_key
  - TAVILY_API_KEY=your_tavily_key
  # ... other configuration
```

---

## 🔗 API Key Sources

| Service | URL | Purpose | Required |
|---------|-----|---------|----------|
| Discord Developer Portal | [discord.com/developers/applications](https://discord.com/developers/applications) | Bot integration | ✅ Yes |
| Akash Chat API | [chatapi.akash.network](https://chatapi.akash.network) | AI chat functionality | ✅ Yes |
| Tavily | [tavily.com](https://tavily.com) | Web search | ✅ Yes |
| Supabase | [supabase.com](https://supabase.com) | Production database | ❌ Optional |

---

## 🚨 Troubleshooting

### Common Issues

1. **Database Connection Issues**
   ```bash
   # Check if using correct connection string
   # For Supabase, use Transaction Pooler URL
   # Format: postgresql://user:pass@project.pooler.supabase.com:6543/postgres
   ```

2. **Knowledge Base Not Loading**
   ```bash
   # Ensure these are set in .env:
   LOAD_DOCS_ON_STARTUP=true
   CTX_KNOWLEDGE_ENABLED=false
   ```

3. **Vector Search Not Working**
   ```bash
   # Verify pgvector extension in Supabase:
   # Run in SQL Editor: CREATE EXTENSION IF NOT EXISTS vector;
   ```

4. **Permission Error with Scripts**
   ```bash
   # Make sure you have the correct permissions
   bun run build
   ```

5. **Bot Not Responding**
   - Check Discord token and application ID
   - Ensure bot has proper permissions in Discord server
   - Check logs: `bun run dev` (development mode with logs)

### Logs and Debugging

```bash
# Check logs in development
bun run dev

# Check Docker logs (if using Docker)
docker logs navi-akash-bot

# Clean and rebuild everything
rm -rf dist node_modules/.cache && bun run build
```

### Database Troubleshooting

```bash
# Test database connection
bun run dev
# Look for: "✅ Successfully connected to Supabase" or "Using PGLite"

# Verify knowledge base loading
# Look for: "Found 533 files to process"
# Look for: "Successfully processed [filename]: X fragments created"
```

---

## 💰 Cost Breakdown

### Development: $0
- Local PGLite database (free)
- All other services have free tiers

### Production: ~$45-55/month
- **Supabase Pro**: $25/month (includes pgvector, 8GB storage)
- **Akash Deployment**: ~$20-30/month (2 CPU, 2GB RAM, 20GB storage)
- **APIs**: Akash Chat, Tavily (usage-based, typically low cost)

---

## 📝 Environment Variables Reference

See `.env.example` for a complete template with all available options.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 💡 Quick Commands Summary

```bash
# Complete setup (one command)
git clone https://github.com/fenilmodi00/navi-akash.git && cd navi-akash && bun install && bun run build && bun run start

# Development workflow
bun install          # Install dependencies
bun run build        # Build all plugins
bun run dev          # Development mode with auto-reload
bun run start        # Production mode

# Database setup
# 1. Create Supabase project (optional)
# 2. Enable pgvector: CREATE EXTENSION IF NOT EXISTS vector;
# 3. Add POSTGRES_URL to .env (or use PGLite locally)

# Docker deployment
bun run docker:build && bun run docker:run

# Akash Network deployment
akash tx deployment create deploy.yaml --from [wallet] --node [node] --chain-id akashnet-2

# Clean and rebuild
rm -rf dist node_modules/.cache && bun install && bun run build
```

---

## 🎉 Production Ready!

Your Navi AI assistant is now fully configured for:

- ✅ **Local Development**: PGLite fallback for easy testing
- ✅ **Production Database**: Supabase PostgreSQL with pgvector
- ✅ **Vector Search**: 533 Akash documents with semantic search
- ✅ **Discord Integration**: Real-time support and assistance
- ✅ **Akash Network**: Ready for decentralized deployment
- ✅ **Knowledge Base**: Automatically updated Akash documentation

**Total Setup Time**: ~10 minutes  
**Monthly Cost**: ~$50 for full production deployment  
**Knowledge Base**: 533 Akash Network documents indexed and searchable
