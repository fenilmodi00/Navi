# 🚀 Navi-Akash

> A powrdbot for Ah Nrk ---

## 🎯 Complete Action Reference

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node/Bun](https://img.shields.io/badge/Node.js-Bun-green.svg)](https://bun.sh/)
[![Discord](https://img.shields.io/badge/Discord-Bot-blue.svg)](https://discord.js.org/)

Navi-Akash is an intelligent developer support agent for Akash Network that lives and breathes cloud deployment. It helps users navigate the Akash ecosystem, troubleshoot deployment issues, and get projects up and running on the decentralized cloud. The bot has deep knowledge of Akash docs, SDL files, deployment processes, and integrations.

---

## ✨ Features

- 🤖 **Discord Integration**: Responds to user queries in Discord channels and DMs
- 📚 **Knowledge Base**: Provides information from Akash documentation and resources
- 🔍 **Web Search**: Can search the web for the latest Akash Network updates
- 🎵 **Voice Support**: Can join voice channels for assistance
- 📎 **Media Handling**: Can process attachments and transcribe media
- 🧠 **Akash Chat API**: Uses Akash's own AI infrastructure for responses
- 🌐 **Akash Network Integration**: Provider information, network stats, and pricing data

---

## 🎯 Complete Action Reference

Navi supports a comprehensive set of actions for Akash Network operations:

### 📋 Provider Actions
| Action | Trigger Examples | Description |
|--------|------------------|-------------|
| `GET_PROVIDERS_LIST` | "show providers", "list A100 providers", "RTX4090 providers" | Lists and filters providers by GPU model, region, or status |
| `GET_PROVIDER_INFO` | "provider info akash1...", "check provider details" | Gets detailed information about a specific provider |

### 💰 Pricing Actions
| Action | Trigger Examples | Description |
|--------|------------------|-------------|
| `GET_GPU_PRICING` | "GPU pricing", "A100 costs", "pricing for 2 CPU 4GB" | Real-time GPU and resource pricing |
| `COMPARE_COSTS` | "Akash vs AWS costs", "compare pricing", "how much savings" | Cost comparison with traditional cloud providers |

### 📊 Network Actions
| Action | Trigger Examples | Description |
|--------|------------------|-------------|
| `GET_NETWORK_STATS` | "network stats", "Akash statistics", "network overview" | Current network statistics and health metrics |

### 🏗️ SDL Actions
| Action | Trigger Examples | Description |
|--------|------------------|-------------|
| `GET_SDL_TEMPLATE` | "create SDL", "generate web app SDL", "AI deployment" | Generates custom SDL templates for various use cases |
| `VALIDATE_SDL` | "validate SDL", "check my manifest", "validate this YAML" | Validates and optimizes SDL configurations |

### 📚 Educational Actions
| Action | Trigger Examples | Description |
|--------|------------------|-------------|
| `GET_TUTORIAL` | "how to deploy", "deployment tutorial", "getting started" | Step-by-step tutorials and guides |

### 🎯 Smart Action Detection

Navi automatically detects the right action based on your natural language queries:

**GPU Model Detection:**
- Automatically identifies GPU models (A100, H100, RTX4090, etc.) in your queries
- Filters providers and pricing based on detected models
- Prioritizes active providers for specific GPU requests

**Resource Specification:**
- Parses CPU, memory, and storage requirements from natural language
- Generates appropriate SDL configurations based on your specs
- Provides cost estimates for specified resources

**Intent Recognition:**
- Distinguishes between provider lookup, pricing queries, and deployment requests
- Handles follow-up questions and context-aware responses
- Escalates complex queries to @Akash Vanguards when needed

---

## 🛠️ Tech Stack

- **Runtime**: [Bun.js](https://bun.sh/) / Node.js (18+)
- **Framework**: [elizaOS](https://github.com/elizaOS/eliza)
- **Plugins**:
  - **plugin-akash**: Complete Akash Network functionality and provider information
  - **plugin-akash-chat**: Handles Akash Network specific chat functionality with Akash Chat API
  - **plugin-discord**: Manages Discord integration and bot interactions
  - **plugin-knowledge**: Provides knowledge base functionality and semantic search
  - **plugin-web-search**: Enables web search capabilities via Tavily API


---

## 📋 Prerequisites

- [Bun.js](https://bun.sh/) (latest version)
- Node.js (v18+)
- Python 3 (for some dependencies)
- Git
- Discord bot token and application ID
- Akash Chat API key
- Tavily API key (for web search)

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

### 3. Build and Start the Application

```bash
bun run build
bun run start
```

This will:
- ✅ Build all plugins and main project
- ✅ Start the application

For development mode with auto-reload:

```bash
bun run dev
```

### 4. Configure Environment Variables

Edit the `.env` file and add your API keys:

```env
DISCORD_APPLICATION_ID=your_discord_application_id
DISCORD_API_TOKEN=your_discord_bot_token
AKASH_CHAT_API_KEY=your_akash_chat_api_key
TAVILY_API_KEY=your_tavily_api_key
```

---

## 🔑 Required Environment Variables

See `.env.example` for a full template.

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
OPENAI_API_KEY=your_akash_chat_api_key  # Same as above
```

### Tavily API (Required for Web Search)
Get your API key from [Tavily](https://tavily.com):

```env
TAVILY_API_KEY=your_tavily_api_key
```

### Optional Configuration

```env
GITHUB_TOKEN=your_github_token
CTX_KNOWLEDGE_ENABLED=false
LOAD_DOCS_ON_STARTUP=true
```

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
   # or
   npm install
   ```

3. **Build and Start**
   ```bash
   bun run build && bun run start
   ```

4. **Configure Environment**
   - Copy `.env.example` to `.env` if it doesn't exist: `cp .env.example .env`
   - Edit the `.env` file with your API keys (see sections above)
   - Required keys: `DISCORD_API_TOKEN`, `DISCORD_APPLICATION_ID`, `AKASH_CHAT_API_KEY`, `TAVILY_API_KEY`

5. **Restart with Configuration**
   ```bash
   bun run start
   ```

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

---

## � Extensibility & Future Development

### 🔌 Plugin Architecture

Navi is built on the ElizaOS plugin system, making it highly extensible:

**Current Plugin Ecosystem:**
- **Core Plugins**: Akash, Discord, Knowledge Base, Web Search
- **Modular Design**: Each plugin provides specific functionality independently
- **Hot-Pluggable**: Plugins can be enabled/disabled without core changes
- **Standardized APIs**: All plugins follow ElizaOS action/provider patterns

### 🛣️ Future Capabilities

**Planned Enhancements:**
- **Advanced Deployment Monitoring**: Real-time deployment status tracking
- **Multi-Network Support**: Testnet/mainnet switching capabilities  
- **Enhanced Analytics**: Historical pricing trends and provider performance metrics
- **Community Features**: Provider reviews, deployment templates sharing
- **Advanced SDL Features**: Complex multi-service deployments, service mesh configurations

**Potential Plugin Extensions:**
- **Wallet Integration**: Secure deployment transaction support (for advanced users)
- **Deployment Automation**: Automated SDL deployment pipelines
- **Monitoring Dashboards**: Real-time deployment health and metrics
- **Cost Optimization**: AI-powered resource allocation recommendations
- **Provider Analytics**: Deep provider performance and reliability analysis

### 👥 Contributing to Navi

**Plugin Development:**
- Follow ElizaOS plugin patterns and interfaces
- Maintain public-safe, read-only operations for core bot functionality
- Implement comprehensive error handling and user feedback
- Include thorough testing and documentation

**Code Standards:**
- TypeScript with strict mode for type safety
- Comprehensive error handling with user-friendly messages
- Rate limiting and API quota management
- Security-first approach for all external integrations

**Testing Requirements:**
- Unit tests for all action handlers and validation logic
- Integration tests with real Akash Network data
- End-to-end testing in Discord environment
- Performance testing for high-volume usage scenarios

---

## �🐳 Docker Deployment (Alternative)

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
├── plugins/                       # Plugin directories
│   ├── plugin-akash/             # Complete Akash Network functionality
│   │   ├── src/actions/          # Provider info, pricing, SDL validation
│   │   ├── src/providers/        # Network data providers
│   │   └── src/utils/            # Akash-specific utilities
│   ├── plugin-akash-chat/        # Akash Chat API integration
│   ├── plugin-discord/           # Discord bot integration
│   ├── plugin-knowledge/         # Knowledge base and semantic search
│   ├── plugin-web-search/        # Web search capabilities

├── src/                          # Main application code
│   ├── index.ts                  # Main entry point and character configuration
│   ├── plugin.ts                 # Plugin configuration and initialization
│   ├── lib/                      # Shared libraries and utilities
│   ├── types/                    # TypeScript type definitions
│   └── utils/                    # Application utility functions
├── data/                         # Data storage and knowledge base
│   └── akash-knowledge-base/     # Comprehensive Akash documentation
├── dist/                         # Built output files
├── .env.example                  # Environment variables template
├── package.json                  # Dependencies and build scripts
├── tsconfig.json                 # TypeScript configuration
├── docker-compose.yml            # Docker Compose configuration
├── Dockerfile                    # Docker image configuration
├── deploy.yaml                   # Akash Network SDL deployment manifest
└── README.md                     # This documentation file
```

---

## 🔗 API Key Sources

| Service | URL | Purpose | Required |
|---------|-----|---------|----------|
| Discord Developer Portal | [discord.com/developers/applications](https://discord.com/developers/applications) | Bot integration | ✅ Yes |
| Akash Chat API | [chatapi.akash.network](https://chatapi.akash.network) | AI chat functionality | ✅ Yes |
| Tavily | [tavily.com](https://tavily.com) | Web search | ✅ Yes |
| GitHub | [github.com/settings/tokens](https://github.com/settings/tokens) | Enhanced search | ❌ Optional |

---

## 🚨 Troubleshooting

### Common Issues

1. **Permission Error with Scripts**
   ```bash
   # Make sure you have the correct permissions
   bun run build
   ```

2. **Missing .env File**
   ```bash
   cp .env.example .env
   ```

3. **Build Errors**
   ```bash
   bun install
   rm -rf dist node_modules/.cache
   bun run build
   ```

4. **Bot Not Responding**
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

---

## 📝 Environment Variables Reference

See `.env.example` for a complete template.

---

## 📄 Akash SDL Deployment Example

To deploy Navi-Akash on Akash Network, you can either:

1. **Use the pre-built SDL template** (`deploy.yaml`) provided in this repository
2. **Ask Navi to generate a custom SDL** via natural language

### 🏗️ Generate SDL with Navi

Simply ask Navi to create an SDL for your specific needs:

```
"Create an SDL for a Discord bot with 2GB RAM and web search capabilities"
"Generate a deployment for an AI agent with GPU support"
"Make an optimized SDL for a chat bot with minimal resources"
```

Navi will generate a complete SDL file with proper resource allocation, security settings, and cost optimization.

### 📋 Pre-built SDL Template

Use the provided SDL file (`deploy.yaml`):

```yaml
---
version: "2.0"

services:
  navi:
    image: registry.gitlab.com/fenil00/navi:v1.0
    expose:
      - port: 3000
        as: 3000
        to:
          - global: true
        http_options:
          max_body_size: 10485760  # 10MB
      - port: 50000
        as: 50000
        proto: udp
        to:
          - global: true
      - port: 50001
        as: 50001
        proto: udp
        to:
          - global: true
      - port: 50002
        as: 50002
        proto: udp
        to:
          - global: true
      - port: 50003
        as: 50003
        proto: udp
        to:
          - global: true
      - port: 50004
        as: 50004
        proto: udp
        to:
          - global: true
    env:
      - AKASH_CHAT_API_KEY=
      - AKASH_CHAT_SMALL_MODEL=DeepSeek-R1-0528
      - AKASH_CHAT_LARGE_MODEL=Meta-Llama-3-2-3B-Instruct
      - AKASH_CHAT_BASE_URL=https://chatapi.akash.network/api/v1
      - OPENAI_BASE_URL=https://chatapi.akash.network/api/v1
      - OPENAI_API_KEY=
      - TAVILY_API_KEY=
      - DISCORD_APPLICATION_ID=
      - DISCORD_API_TOKEN=
      - DISCORD_INTENTS=Guilds,GuildMessages,MessageContent,GuildMembers
      - DISCORD_ALLOWED_DMS=true
      - DISCORD_ENABLE_WEB_SEARCH=true
      - CTX_KNOWLEDGE_ENABLED=false
      - LOAD_DOCS_ON_STARTUP=true
      - EMBEDDING_PROVIDER=akash-chat
      - TEXT_EMBEDDING_MODEL=BAAI-bge-large-en-v1-5
      - EMBEDDING_DIMENSION=1024
      - MAX_CONCURRENT_REQUESTS=50
      - REQUESTS_PER_MINUTE=300
      - TOKENS_PER_MINUTE=200000
      - DOCS_REPO_1_URL=https://github.com/fenilmodi00/akash-knowledge-base.git
      - DOCS_REPO_1_PATH=./data/akash-knowledge-base
      - DOCS_REPO_1_BRANCH=main
      - NODE_ENV=production
      - LOG_LEVEL=debug
    params:
      storage:
        data:
          mount: /app/data
          readOnly: false
        logs:
          mount: /app/logs
          readOnly: false

profiles:
  compute:
    navi:
      resources:
        cpu:
          units: 2
        memory:
          size: 2Gi
        storage:
          - size: 8Gi
          - name: data
            size: 10Gi
            attributes:
              persistent: true
              class: beta3
          - name: logs
            size: 2Gi
            attributes:
              persistent: true
              class: beta3
  placement:
    dcloud:
      pricing:
        navi:
          denom: uakt
          amount: 100000

deployment:
  navi:
    dcloud:
      profile: navi
      count: 1
```

---

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

# Just build
bun run build

# Just start  
bun run start

# Development mode
bun run dev

# Clean and rebuild
rm -rf dist node_modules/.cache && bun run build

# Docker deployment
bun run docker:build && bun run docker:run
```
