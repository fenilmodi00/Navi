# Copilot Instructions - Navi Project

## Language Policy

All instructions and prompts in this repository must be written in **English**. This applies to:
- All rule and instruction files in `.github/*.instructions.md`
- All prompt files and documentation
- All code comments intended for contributors

## Instructions Reference

This repository contains multiple specialized instruction files for different development contexts:

### Core ElizaOS Instructions
- **Actions**: [`.github/elizaos-actions.instructions.md`](.github/elizaos-actions.instructions.md) - Applied to `**/actions/**/*` files
- **Plugin Core**: [`.github/elizaos_api_plugins_core.instructions.md`](.github/elizaos_api_plugins_core.instructions.md) - Applied to `plugins/**/*` files
- **Providers**: [`.github/elizaos-providers.instructions.md`](.github/elizaos-providers.instructions.md) - Provider development patterns
- **Services**: [`.github/elizaos-services.instructions.md`](.github/elizaos-services.instructions.md) - Service architecture

### Testing Instructions
- **E2E Testing**: [`.github/elizaos-e2e-testing.instructions.md`](.github/elizaos-e2e-testing.instructions.md) - End-to-end testing patterns
- **Unit Testing**: [`.github/elizaos-unit-testing.instructions.md`](.github/elizaos-unit-testing.instructions.md) - Unit testing standards
- **Cypress Testing**: [`.github/elizaos-cypress-testing.instructions.md`](.github/elizaos-cypress-testing.instructions.md) - UI testing

### Development Guidelines
- **API/Server**: [`.github/elizaos-api-server.instructions.md`](.github/elizaos-api-server.instructions.md) - Server development patterns
- **Database**: [`.github/elizaos-database.instructions.md`](.github/elizaos-database.instructions.md) - Database operations
- **CLI**: [`.github/elizaos_cli_*.instructions.md`](.github/) - CLI development and configuration

**IMPORTANT**: These specialized instructions work alongside this main file and are automatically applied based on file patterns or can be manually attached for specific contexts.

## Development Code Generation

When working with **ElizaOS** and **Akash Network** code, follow these instructions very carefully.

It is **EXTREMELY important** that you follow the instructions in the rule files very carefully.

### Workflow Implementation

**IMPORTANT**: Always follow these steps when implementing new features:

1. **Consult Relevant Instructions**: Start by listing which instruction files have been used to guide the implementation (e.g., `Instructions used: [elizaos-actions.instructions.md, elizaos_api_plugins_core.instructions.md]`).

2. **Follow ElizaOS Standards**: Always follow the 6-step ElizaOS development workflow:
   - Research existing codebase
   - Write detailed PRD
   - Create implementation plan (evaluate 3+ approaches)
   - Implement production-ready code
   - Fix tests until all pass
   - Critical review

3. **Test Everything**: Always run `bun test` or `elizaos test` to verify that all tests pass before committing changes. Don't ask to run the tests, just do it. Use `bun run test:watch` for continuous testing during development.

4. **Production-Ready Only**: Write complete, production-ready implementations with comprehensive error handling, proper logging, and monitoring. NO stubs or placeholder code.

5. **Follow File Patterns**: When you see paths like `plugins/[plugin]/` or `actions/[action]/` in rules, replace `[plugin]` with the actual plugin name (e.g., `plugin-akash`) and `[action]` with the feature name (e.g., `getProviderInfo`).

6. **Akash Network Compliance**: For Akash-related code, ensure SDL templates are production-ready, cost analysis uses real-time data, and all network information is factually correct.

## Project Overview

**Navi** is an ElizaOS-based AI assistant specialized for Akash Network support on Discord. This agent provides network information, SDL template generation, cost analysis, and educational guidance about the Akash decentralized cloud ecosystem.

### Core Architecture

- **Framework**: ElizaOS (TypeScript-based AI agent framework)
- **Platform**: Discord bot with multi-channel support  
- **Specialization**: Akash Network expertise and SDL generation
- **Database**: PostgreSQL with vector embeddings for semantic search
- **AI Models**: Akash Chat API (Llama models) + Tavily web search
- **Plugins**: Akash Network, Knowledge Base, Web Search, Discord integration

## ElizaOS Development Guidelines

You are an expert developer on the ElizaOS project. Follow these structured guidelines to ensure high-quality contributions.

## Core Development Principles

- **Write production-ready code only** - No stubs, examples, or placeholder implementations
- **Test everything thoroughly** - All tests must pass before considering work complete
- **Keep it simple** - Prefer revising existing files over creating new ones
- **Follow established patterns** - Study the codebase before implementing new features

## Standard Development Workflow

```mermaid
graph TD
    A[1. Research Existing Codebase] --> B[2. Write Detailed PRD];
    B --> C[3. Create Implementation Plan];
    C --> D{Evaluate 3+ Approaches};
    D --> E[Select Optimal Solution];
    E --> F[4. Implement Production Code];
    F --> G[5. Fix Tests Until All Pass];
    G --> H[6. Critical Review];
    H --> I{Code Meets Standards?};
    I -->|No| J[Design New Implementation];
    J --> F;
    I -->|Yes| K[Complete];
```

### Step 1: Research Existing Codebase
- Map dependencies and related files
- Identify existing services, actions, providers, and plugins
- Study similar implementations
- Document current architecture and data flow

### Step 2: Write Detailed PRD
- Document all usage paths with edge cases
- Include UX considerations for automation and user experience
- Define technical requirements (performance, security, scalability)
- Establish measurable success criteria

### Step 3: Create Implementation Plan
- Design multiple approaches (minimum 3)
- List all files to be added, modified, or removed
- Evaluate each approach (strengths, weaknesses, risks)
- Select optimal solution with justification

### Step 4: Implement Production Code
- Write complete, production-ready implementations
- Include comprehensive error handling
- Add proper logging and monitoring
- Follow established code patterns

### Step 5: Fix Tests Until All Pass
- Use real runtime testing environments
- Test with actual data and scenarios
- Focus on meaningful tests that verify behavior
- Iterate until all tests pass consistently

### Step 6: Critical Review
- Assume implementation has issues and find them
- Document all potential problems
- Create improvement plan for identified issues
- Validate against comprehensive checklist

## ElizaOS Architecture

### Plugin System
ElizaOS uses a plugin-based architecture where each plugin can provide:

- **Actions**: Functions that the agent can perform
- **Providers**: Sources of information for agents
- **Evaluators**: Post-processing cognitive components
- **Services**: Long-running stateful components

### Core Component Types

#### Character & Agent
```typescript
interface Character {
  id?: UUID;
  name: string;
  username?: string;
  system?: string; // System prompt
  templates?: { [key: string]: TemplateType }; // Prompt templates
  bio: string | string[];
  messageExamples?: MessageExample[][];
  postExamples?: string[];
  topics?: string[];
  adjectives?: string[];
  knowledge?: (string | { path: string; shared?: boolean } | DirectoryItem)[];
  plugins?: string[];
  settings?: { [key: string]: any };
  secrets?: { [key: string]: string | boolean | number };
  style?: {
    all?: string[];
    chat?: string[];
    post?: string[];
  };
}

interface Agent extends Character {
  enabled?: boolean;
  status?: AgentStatus;
  createdAt: number;
  updatedAt: number;
}
```

#### Action
```typescript
interface Action {
  name: string;
  similes?: string[];
  description: string;
  examples?: ActionExample[][];
  handler: Handler;
  validate: Validator;
  effects?: {
    provides: string[];
    requires: string[];
    modifies: string[];
  };
  estimateCost?: (params: any) => number;
}
```

#### Provider
```typescript
interface Provider {
  name: string;
  description?: string;
  dynamic?: boolean; // Only used when requested
  position?: number; // Execution order
  private?: boolean; // Must be explicitly included
  get: (runtime: IAgentRuntime, message: Memory, state: State) => Promise<ProviderResult>;
}
```

#### Service
```typescript
abstract class Service {
  static serviceName: string;
  static serviceType?: ServiceTypeName;
  serviceName: string;
  abstract capabilityDescription: string;
  config?: Metadata;

  abstract stop(): Promise<void>;
  static async start(runtime: IAgentRuntime): Promise<Service>;
}
```

### Environment Types

#### Entity & Component
```typescript
interface Entity {
  id?: UUID;
  names: string[];
  metadata?: Metadata;
  agentId: UUID;
  components?: Component[];
}

interface Component {
  id: UUID;
  entityId: UUID;
  agentId: UUID;
  roomId: UUID;
  worldId: UUID;
  sourceEntityId: UUID;
  type: string;
  createdAt: number;
  data: Metadata;
}
```

#### World & Room
```typescript
type World = {
  id: UUID;
  name?: string;
  agentId: UUID;
  serverId: string;
  metadata?: {
    ownership?: { ownerId: string };
    roles?: { [entityId: UUID]: Role };
    [key: string]: unknown;
  };
};

type Room = {
  id: UUID;
  name?: string;
  agentId?: UUID;
  source: string;
  type: ChannelType;
  channelId?: string;
  serverId?: string;
  worldId?: UUID;
  metadata?: Metadata;
};
```

## Testing Requirements

### E2E Testing
- Execute against actual ElizaOS runtime instances
- Use real database (in-memory PGLite for testing)
- Create real messages, memories, and interactions
- Verify actual agent behaviors and responses

```typescript
// Example E2E test
{
  name: 'Agent responds to hello world',
  fn: async (runtime: any) => {
    // Create unique identifiers
    const roomId = `test-room-${Date.now()}`;
    const userId = 'test-user';

    // Create message
    const message = {
      id: `msg-${Date.now()}`,
      userId: userId,
      agentId: runtime.agentId,
      roomId: roomId,
      content: {
        text: 'hello world',
        type: 'text',
      },
      createdAt: Date.now(),
    };

    // Process message
    await runtime.processMessage(message);

    // Verify response
    const messages = await runtime.messageManager.getMessages({
      roomId,
      limit: 10,
    });

    const agentResponse = messages.find(
      m => m.userId === runtime.agentId && m.id !== message.id
    );

    if (!agentResponse) {
      throw new Error('Agent did not respond');
    }
  },
}
```

### Unit Testing
- Test individual components in isolation
- Mock all dependencies (especially `IAgentRuntime`)
- Run via `elizaos test` command (wraps Vitest)
- Aim for >75% code coverage on testable components

```typescript
// Example unit test
describe('MyAction', () => {
  describe('validate', () => {
    it('should return true when all requirements are met', async () => {
      const mockRuntime = createMockRuntime({
        getService: vi.fn().mockReturnValue({ isReady: true }),
      });
      const mockMessage = createMockMemory();

      const isValid = await myAction.validate(mockRuntime, mockMessage);

      expect(isValid).toBe(true);
    });
  });
});
```

## Code Quality Standards

### Do This
```typescript
// ✅ DO: Write complete implementations
export async function processTransaction(
  runtime: IAgentRuntime,
  params: TransactionParams
): Promise<TransactionResult> {
  // Full validation logic
  if (!params.amount || params.amount <= 0) {
    throw new Error('Invalid transaction amount');
  }

  // Complete implementation with error handling
  try {
    const service = runtime.getService('transaction-service');
    const result = await service.process(params);

    // Full logging and monitoring
    runtime.logger.info('Transaction processed', {
      transactionId: result.id,
      amount: params.amount,
    });

    return result;
  } catch (error) {
    runtime.logger.error('Transaction failed', { error, params });
    throw new TransactionError('Failed to process transaction', error);
  }
}
```

### Don't Do This
```typescript
// ❌ DON'T: Write stubs or incomplete code
export async function processTransaction(params: any): Promise<any> {
  // TODO: Implement this
  throw new Error('Not implemented');
}
```

## File Organization Conventions
- Store documentation in the `/docs` folder
- Store logs in the `/logs` folder
- Follow test directory structure:
  - `src/__tests__/e2e/` for E2E tests
  - `src/__tests__/unit/` for unit tests
- Prefer modifying existing files over creating new ones
- Follow established naming conventions

## Supported AI Models

### Anthropic Models:
- Claude Opus 4 claude-opus-4-20250514
- Claude Sonnet 4 claude-sonnet-4-20250514

### OpenAI Models:
- gpt-4o
- gpt-4o-mini
- o1-2024-12-17

## Akash Network Development Guidelines

### Akash Network Expertise

#### Core Concepts

- **SDL (Stack Definition Language)**: YAML-based deployment configuration for Akash Network
- **Providers**: Decentralized compute resource providers offering CPU, GPU, and storage
- **Deployments**: Containerized applications running on Akash Network
- **Bidding**: Competitive pricing mechanism between providers
- **AKT Token**: Native token for payments, staking, and network governance

#### SDL Generation Standards

Always generate complete, production-ready SDL templates with proper structure:

```yaml
# Complete SDL template structure
version: "2.0"
services:
  web:
    image: nginx:latest
    expose:
      - port: 80
        as: 80
        to:
          - global: true
    env:
      - NODE_ENV=production
profiles:
  compute:
    web:
      resources:
        cpu:
          units: 1.0
        memory:
          size: 512Mi
        storage:
          size: 1Gi
  placement:
    dcloud:
      attributes:
        host: akash
      signedBy:
        anyOf:
          - "akash1365yvmc4s7awdyj3n2sav7xfx76adc6dnmlx63"
      pricing:
        web:
          denom: uakt
          amount: 1000
deployment:
  web:
    dcloud:
      profile: web
      count: 1
```

#### Navi's Core Responsibilities

1. **Network Information**: Provide current stats, provider listings, cost comparisons
2. **SDL Templates**: Generate validated, production-ready deployment configurations
3. **Educational Content**: Explain Akash concepts clearly for all skill levels
4. **Troubleshooting**: Help debug deployment issues and optimization
5. **Cost Analysis**: Compare Akash vs traditional cloud providers (AWS, GCP, Azure)

### Plugin Architecture Specifics

#### Akash Plugin (`@elizaos/plugin-akash`)

Handles core Akash Network functionality:
- Provider information retrieval and analysis
- Network statistics and metrics
- SDL template generation and validation
- Cost comparisons with traditional cloud
- Gas estimation for transactions
- Deployment manifest management

```typescript
// Example Akash plugin action structure
interface AkashAction extends Action {
  name: string;
  description: string;
  handler: async (runtime: IAgentRuntime, message: Memory, state: State) => Promise<ActionResult>;
  validate: async (runtime: IAgentRuntime, message: Memory) => Promise<boolean>;
  examples: ActionExample[][];
}
```

#### Knowledge Plugin (`@elizaos/plugin-knowledge`)

Manages Akash documentation and learning resources:
- Semantic search across comprehensive Akash docs
- Repository management for official documentation
- Vector embeddings for contextual responses
- Dynamic content loading from GitHub repositories

#### Web Search Plugin (`@elizaos/plugin-web-search`)

Provides real-time Akash ecosystem information:
- Current AKT token pricing and market data
- Network status and health checks
- Latest Akash news, updates, and announcements
- Live provider status and availability

### Response Behavior Guidelines

#### Information Prioritization Strategy

1. **Knowledge Base First** (95% of queries): Use comprehensive built-in Akash documentation
2. **Web Search Sparingly**: Only when user explicitly requests current prices or live status
3. **Honest Limitations**: Never fabricate URLs, tools, or resources - admit uncertainty
4. **Escalation Path**: Direct complex issues to @Akash Vanguards for expert assistance

#### Response Patterns

- **Greetings**: ALWAYS respond to hi, hello, hey - NEVER ignore user greetings
- **Akash Questions**: ALWAYS respond with comprehensive network information and SDL examples
- **Help Requests**: Provide SDL templates and step-by-step deployment guidance
- **Technical Issues**: Focus on single, complete answers without unnecessary action triggers

#### Strictly Prohibited Content

- **Zero Tolerance Policy**: NO fake URLs, placeholder links, or fictional resources
- **No Speculation**: Never make up features, capabilities, or technical specifications
- **No Financial Advice**: Avoid price predictions, investment recommendations, or trading advice
- **No Fake Tools**: Don't suggest non-existent calculators, dashboards, or monitoring tools

### Akash Network Technical Standards

#### SDL Validation Requirements

```typescript
// SDL validation function example
async function validateSDL(sdlContent: string): Promise<ValidationResult> {
  const validation = {
    isValid: true,
    errors: [] as string[],
    warnings: [] as string[],
    suggestions: [] as string[]
  };

  // Validate YAML structure
  try {
    const parsed = yaml.parse(sdlContent);
    
    // Check required fields
    if (!parsed.version) validation.errors.push('Missing version field');
    if (!parsed.services) validation.errors.push('Missing services section');
    if (!parsed.profiles) validation.errors.push('Missing profiles section');
    if (!parsed.deployment) validation.errors.push('Missing deployment section');
    
    // Validate resource specifications
    validateResourceSpecs(parsed, validation);
    
    // Check security best practices
    validateSecurity(parsed, validation);
    
  } catch (error) {
    validation.isValid = false;
    validation.errors.push(`Invalid YAML: ${error.message}`);
  }

  return validation;
}
```

#### Cost Analysis Implementation

```typescript
interface CostComparison {
  akash: {
    monthly: number;
    provider: string;
    region: string;
  };
  aws: {
    monthly: number;
    instanceType: string;
    region: string;
  };
  savings: {
    amount: number;
    percentage: number;
  };
}

async function calculateCostComparison(resources: ResourceSpec): Promise<CostComparison> {
  // Implementation for real-time cost analysis
  const akashProviders = await getAkashProviders(resources);
  const awsPricing = await getAWSPricing(resources);
  
  return {
    akash: findBestAkashOffer(akashProviders),
    aws: calculateAWSCost(awsPricing),
    savings: calculateSavings(akashCost, awsCost)
  };
}
```

### Testing Requirements for Akash Features

#### Unit Testing for Akash Components

```typescript
// Test Akash SDL generation
describe('SDL Generation', () => {
  it('should generate valid SDL for web applications', async () => {
    const mockRuntime = createMockRuntime();
    const requirements = {
      appType: 'web',
      framework: 'nginx',
      resources: { cpu: 1, memory: '512Mi', storage: '1Gi' }
    };

    const sdl = await generateSDL(mockRuntime, requirements);
    
    expect(sdl).toContain('version: "2.0"');
    expect(sdl).toContain('services:');
    expect(sdl).toContain('profiles:');
    expect(sdl).toContain('deployment:');
    
    const validation = await validateSDL(sdl);
    expect(validation.isValid).toBe(true);
  });
});

// Test provider information retrieval
describe('Provider Information', () => {
  it('should fetch real provider data', async () => {
    const mockRuntime = createMockRuntime({
      getService: vi.fn().mockReturnValue({
        getProviders: vi.fn().mockResolvedValue(mockProviders)
      })
    });

    const providers = await getProviderInfo(mockRuntime, 'gpu');
    
    expect(providers).toBeInstanceOf(Array);
    expect(providers.length).toBeGreaterThan(0);
    expect(providers[0]).toHaveProperty('address');
    expect(providers[0]).toHaveProperty('attributes');
  });
});
```

#### E2E Testing for Akash Workflows

```typescript
// Test complete SDL generation and validation workflow
{
  name: 'Complete SDL workflow for web application',
  fn: async (runtime: any) => {
    const roomId = `akash-test-${Date.now()}`;
    const userId = 'test-user';

    // Request SDL generation
    const message = {
      id: `msg-${Date.now()}`,
      userId: userId,
      agentId: runtime.agentId,
      roomId: roomId,
      content: {
        text: 'generate nginx web server SDL',
        type: 'text',
      },
      createdAt: Date.now(),
    };

    await runtime.processMessage(message);
    await new Promise(resolve => setTimeout(resolve, 2000));

    const messages = await runtime.messageManager.getMessages({
      roomId,
      limit: 10,
    });

    const response = messages.find(
      m => m.userId === runtime.agentId && m.id !== message.id
    );

    if (!response || !response.content.text.includes('version: "2.0"')) {
      throw new Error('SDL generation failed');
    }
  },
}
```

### Performance Optimization for Akash Deployment

#### Resource Optimization Settings

```bash
# Akash deployment optimizations
MAX_CONCURRENT_REQUESTS=10
REQUESTS_PER_MINUTE=60
RESPONSE_TIMEOUT=15000
MAX_RESPONSE_TIME=15000

# Token limits for efficient processing
MAX_INPUT_TOKENS=1000
MAX_OUTPUT_TOKENS=800
TOKENS_PER_MINUTE=50000

# Caching configuration
KNOWLEDGE_CACHE_ENABLED=true
KNOWLEDGE_CACHE_TTL=3600
RESPONSE_CACHE_ENABLED=true
KNOWLEDGE_SEARCH_LIMIT=10
```

#### Memory Management

- **Vector Search Optimization**: Limit knowledge search results to 10 most relevant
- **Conversation History**: Implement efficient memory pagination for long conversations
- **Database Connections**: Use PostgreSQL connection pooling with proper cleanup
- **Embedding Cache**: Cache frequently accessed embeddings with TTL management

### Security Considerations

#### API Security for Akash Integration

- Store all sensitive credentials (API keys, RPC endpoints) in environment variables
- Use secure database connections with SSL/TLS encryption
- Implement rate limiting and request validation for all external API calls
- Log security events and monitor for suspicious activity patterns

#### SDL Security Validation

```typescript
function validateSDLSecurity(sdl: any): SecurityValidation {
  const issues: string[] = [];
  
  // Check for dangerous image sources
  if (sdl.services) {
    Object.values(sdl.services).forEach((service: any) => {
      if (service.image && !isValidImageSource(service.image)) {
        issues.push(`Potentially unsafe image: ${service.image}`);
      }
    });
  }
  
  // Validate environment variables
  checkEnvironmentVariables(sdl, issues);
  
  // Ensure resource limits are reasonable
  validateResourceLimits(sdl, issues);
  
  return { isSecure: issues.length === 0, issues };
}
```

### Akash Network Development Environment

#### Required Environment Variables

```bash
# Akash Chat API Configuration
AKASH_CHAT_API_KEY=your_akash_chat_api_key
AKASH_CHAT_BASE_URL=https://chatapi.akash.network/api/v1
AKASH_CHAT_SMALL_MODEL=Meta-Llama-3-1-8B-Instruct-FP8
AKASH_CHAT_LARGE_MODEL=Meta-Llama-3-2-3B-Instruct

# Database Configuration
POSTGRES_URL=postgresql://user:pass@localhost:5432/navi
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
```

#### Development Tools

- **Node.js**: v18+ with Bun package manager for optimal performance
- **PostgreSQL**: v14+ for persistent memory and vector embeddings
- **Docker**: For containerized testing and SDL validation
- **TypeScript**: v5+ with strict mode enabled for type safety
- **ElizaOS CLI**: Latest version for agent testing and development

### Contribution Guidelines for Navi

#### Code Review Checklist

- [ ] **Akash Knowledge Accuracy**: All Akash Network information is factually correct
- [ ] **SDL Validation**: Generated SDL templates are production-ready and validated
- [ ] **Cost Analysis**: Price comparisons use real-time data and accurate calculations
- [ ] **Security Review**: No security vulnerabilities in SDL generation or API calls
- [ ] **Performance**: Response times meet Akash deployment constraints (<15s)
- [ ] **Testing Coverage**: All Akash-specific features have comprehensive tests
- [ ] **Documentation**: Clear documentation for new Akash features or modifications

#### Pull Request Requirements

1. **Follow ElizaOS Workflow**: Complete all 6 steps of the development process
2. **Akash Network Testing**: Test all features against real Akash Network (mainnet)
3. **SDL Validation**: Ensure all generated SDL templates deploy successfully
4. **Performance Benchmarks**: Verify response times and resource usage meet targets
5. **Security Audit**: Review all code for potential security vulnerabilities
6. **Documentation Updates**: Update relevant documentation for API or feature changes

#### Issue Reporting for Akash Features

When reporting issues related to Akash Network functionality:

- **Network Environment**: Specify testnet vs mainnet, RPC endpoints used
- **SDL Content**: Include full SDL template that caused issues (sanitized)
- **Provider Details**: Mention specific providers if issue is provider-related
- **Error Messages**: Include complete error messages and stack traces
- **Expected Behavior**: Describe expected vs actual Akash Network behavior
- **Reproduction Steps**: Provide clear steps to reproduce the issue

### Akash Network Resource Links

#### Official Documentation
- Akash Network Docs: https://docs.akash.network/
- SDL Reference: https://docs.akash.network/deployments/stack-definition-language/
- Provider Guide: https://docs.akash.network/providers/

#### Development Resources
- Akash Console: https://console.akash.network/
- Cloudmos Deploy: https://deploy.cloudmos.io/
- Akash Stats: https://stats.akash.network/

#### Community Support
- Discord: https://discord.akash.network/
- GitHub: https://github.com/akash-network/
- Twitter: https://twitter.com/akashnet_

This comprehensive guide ensures that all development work on Navi maintains the highest standards for both ElizaOS architecture and Akash Network expertise, delivering accurate, helpful, and production-ready code for the decentralized cloud ecosystem.