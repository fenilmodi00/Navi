# @navi/plugin-sdl-builder

Advanced SDL template generation and validation plugin for Akash Network deployments in ElizaOS.

## Features

🚀 **Smart SDL Generation**
- Automatic template selection based on deployment type
- Resource optimization suggestions
- Cost estimation and comparisons

🔍 **Advanced Validation**
- Structure validation with detailed error reporting
- Performance optimization suggestions
- Security best practices recommendations

📋 **Template Library**
- Web applications (basic, intermediate, advanced)
- AI/ML deployments with GPU support
- Blockchain nodes and ElizaOS agents
- Database deployments

💰 **Cost Optimization**
- Real-time pricing estimates
- Provider comparison
- Resource allocation optimization

## Usage

### Actions

#### GENERATE_SDL
Automatically generates SDL templates based on natural language requests.

**Triggers:**
- "create sdl for web app"
- "generate ai deployment with gpu"
- "make blockchain node sdl"

**Example:**
```
User: "Create an advanced AI deployment with GPU"
Navi: [Generates complete SDL with GPU configuration]
```

#### VALIDATE_SDL
Validates SDL templates and provides optimization suggestions.

**Triggers:**
- "validate this sdl"
- "check deployment template"
- Automatic detection of YAML content

**Example:**
```
User: "Please validate this SDL: [yaml content]"
Navi: [Provides validation results and suggestions]
```

### Providers

#### SDL Knowledge Provider
Provides contextual information about SDL structure, resources, and best practices based on the conversation context.

## Integration

```typescript
import { sdlBuilderPlugin } from "@navi/plugin-sdl-builder";

export const character: Character = {
  // ... other config
  plugins: [
    // ... other plugins
    sdlBuilderPlugin
  ]
};
```

## Template Categories

### Web Applications
- **Basic**: Static sites, simple web servers
- **Intermediate**: Node.js apps with Redis
- **Advanced**: Full-stack with database and load balancing

### AI/ML Deployments
- **Basic**: Single GPU inference
- **Intermediate**: Multi-GPU with caching
- **Advanced**: Distributed training setups

### Blockchain
- **Basic**: Simple blockchain nodes
- **Intermediate**: ElizaOS agents with GPU
- **Advanced**: Multi-service blockchain infrastructure

## Cost Estimates

- **Web Basic**: $5-20/month (60-80% cheaper than cloud providers)
- **AI/ML**: $50-500/month (70-85% cheaper than cloud providers)
- **Blockchain**: $20-200/month (65-75% cheaper than cloud providers)

All pricing uses current Akash Network rates (100,000-175,000 uAKT range).

## Development

```bash
# Install dependencies
npm install

# Build plugin
npm run build

# Run tests
npm test

# Development mode
npm run dev
```

## License

MIT
