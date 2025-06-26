#!/bin/bash

# Set colors for console output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Display banner
echo -e "${BLUE}"
echo "╔═════════════════════════════════════════════╗"
echo "║         𝗡𝗮𝘃𝗶 - 𝗔𝗸𝗮𝘀𝗵 𝗡𝗲𝘁𝘄𝗼𝗿𝗸 𝗔𝗴𝗲𝗻𝘁        ║"
echo "║       ElizaOS Environment Setup Utility      ║"
echo "╚═════════════════════════════════════════════╝"
echo -e "${NC}"

# Create database directory for PGLite
echo -e "${BLUE}🔧 Setting up database environment...${NC}"
ELIZADB_DIR=".elizadb"
if [ ! -d "$ELIZADB_DIR" ]; then
    mkdir -p "$ELIZADB_DIR"
    echo -e "${GREEN}✅ Created database directory: $ELIZADB_DIR${NC}"
else
    echo -e "${YELLOW}ℹ️ Database directory already exists: $ELIZADB_DIR${NC}"
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo -e "${BLUE}📄 Creating .env file with required environment variables...${NC}"
    cat > .env << EOL
# Akash Chat API Configuration
AKASH_CHAT_API_KEY=your_api_key_here
AKASH_CHAT_SMALL_MODEL=Meta-Llama-3-1-8B-Instruct-FP8
AKASH_CHAT_LARGE_MODEL=Meta-Llama-3-2-3B-Instruct
AKASH_CHAT_BASE_URL=https://chatapi.akash.network/api/v1

# Database Configuration - Defaults to PGLite for development
USE_PGLITE=true
PGLITE_DATA_DIR=$(pwd)/$ELIZADB_DIR
POSTGRES_URL=postgresql://navi:navi@localhost:5432/navi
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anonymous_key

# Discord Bot Configuration
DISCORD_API_TOKEN=your_discord_bot_token
DISCORD_APPLICATION_ID=your_discord_app_id

# Web Search Integration
TAVILY_API_KEY=your_tavily_api_key

# Akash Network Configuration
RPC_ENDPOINT=https://rpc.akash.forbole.com:443
AKASH_NODE=https://rpc.akashnet.net:443
AKASH_CHAIN_ID=akashnet-2
AKASH_ENV=mainnet
AKASH_PRICING_API_URL=https://console-api.akash.network/v1/pricing

# Development Settings
NODE_ENV=development
LOG_LEVEL=info

# ElizaOS Runtime Settings
ELIZAOS_SERVER_HOST=localhost
ELIZAOS_SERVER_PORT=3000
ELIZAOS_SERVER_AUTH_ENABLED=false

# Memory Management for Optimization
MAX_MESSAGES_PER_MEMORY=25
MEMORY_CUTOFF_TOKENS=1500
MEMORY_RECENCY_BIAS=1.0
EOL
    echo -e "${GREEN}✅ .env file created successfully!${NC}"
else
    echo -e "${YELLOW}⚠️ .env file already exists. Checking for missing variables...${NC}"
    
    # Basic validation of existing .env
    if ! grep -q "USE_PGLITE" .env; then
        echo -e "${YELLOW}ℹ️ Adding missing database configuration to .env...${NC}"
        echo "
# Database PGLite Configuration (Added by setup script)
USE_PGLITE=true
PGLITE_DATA_DIR=$(pwd)/$ELIZADB_DIR" >> .env
        echo -e "${GREEN}✅ Updated .env with database configuration${NC}"
    fi
fi

# Check for bun installation
echo -e "${BLUE}🔍 Checking if bun is installed...${NC}"
if ! command -v bun &> /dev/null; then
    echo -e "${YELLOW}⚠️ bun is not installed. Please install it to run this project:${NC}"
    echo -e "   curl -fsSL https://bun.sh/install | bash"
else
    echo -e "${GREEN}✅ bun is installed${NC}"
    
    # Install dependencies if node_modules doesn't exist
    if [ ! -d "node_modules" ]; then
        echo -e "${BLUE}📦 Installing dependencies...${NC}"
        bun install
    fi
fi

# Clean database directory if requested
if [ "$1" = "--clean" ]; then
    echo -e "${YELLOW}🧹 Cleaning database directory...${NC}"
    rm -rf "$ELIZADB_DIR"/*
    echo -e "${GREEN}✅ Database directory cleaned${NC}"
fi

echo -e "${BLUE}📋 Environment setup complete!${NC}"
echo -e "${YELLOW}🔒 Security reminder: Never commit API keys to version control${NC}"
echo -e "${GREEN}▶️ Next steps:${NC}"
echo -e "  1. Edit .env with your actual API keys"
echo -e "  2. Run ${BLUE}bun build${NC} to build the project"
echo -e "  3. Run ${BLUE}bun start${NC} to start the server"
echo -e ""
echo -e "To reset database: ${YELLOW}./setup-env.sh --clean${NC}"
