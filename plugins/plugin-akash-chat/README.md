# Enhanced Akash Chat Plugin for ElizaOS

This plugin provides comprehensive Akash Chat API integration with ElizaOS, offering feature parity with OpenAI plugins including advanced model abstraction, validation, enhanced error handling, and robust concurrency management.

## 🚀 Key Features

### Core Functionality
- **Model Abstraction**: Smart `small_model` and `large_model` selection with fallbacks
- **Enhanced Error Handling**: Comprehensive retry logic with exponential backoff
- **Concurrency Management**: Intelligent request queuing respecting Akash's 3-request limit
- **Model Validation**: Automatic validation of configured models against supported lists
- **Priority Queuing**: Foreground (user chat) and background (knowledge processing) prioritization

### Supported Capabilities
- Text generation (small and large models with automatic selection)
- Text embeddings using BAAI-bge-large-en-v1-5
- Tokenization and detokenization with model-specific handling
- JSON object generation with automatic repair
- Comprehensive usage tracking and analytics
- Cloudflare Gateway support (optional)

### Advanced Features
- **API Validation**: Automatic connectivity and model availability checking
- **Fallback Handling**: Graceful degradation when services are unavailable
- **Enhanced Logging**: Detailed debugging and performance metrics
- **Configuration Validation**: Comprehensive settings validation with warnings
- **Model Listing**: Query available models from Akash Chat API

## 📋 Setup

### 1. Install Dependencies
```bash
npm install @elizaos/plugin-akash-chat
```

### 2. Environment Configuration
```bash
# Required
AKASH_CHAT_API_KEY=your_api_key_here

# Model Configuration (Optional - smart defaults provided)
AKASH_CHAT_SMALL_MODEL=Meta-Llama-3-1-8B-Instruct-FP8
AKASH_CHAT_LARGE_MODEL=Meta-Llama-3-3-70B-Instruct
AKASH_CHAT_EMBEDDING_MODEL=BAAI-bge-large-en-v1-5

# Advanced Configuration (Optional)
AKASH_CHAT_BASE_URL=https://chatapi.akash.network/api/v1
AKASH_CHAT_EMBEDDING_DIMENSIONS=1024
AKASH_CHAT_MAX_CONCURRENT=2
AKASH_CHAT_TIMEOUT=30000
```

### 3. Agent Configuration
```json
{
  "name": "AkashNetworkAgent",
  "plugins": ["@elizaos/plugin-akash-chat"],
  "settings": {
    "secrets": {
      "AKASH_CHAT_API_KEY": "your_api_key_here"
    }
  }
}
```

## ⚙️ Configuration Options

| Setting | Description | Default | Validation |
|---------|-------------|---------|------------|
| `AKASH_CHAT_API_KEY` | Your Akash Chat API key | (Required) | ✅ Automatic validation |
| `AKASH_CHAT_SMALL_MODEL` | Model for quick responses | Meta-Llama-3-1-8B-Instruct-FP8 | ✅ Against supported list |
| `AKASH_CHAT_LARGE_MODEL` | Model for complex tasks | Meta-Llama-3-3-70B-Instruct | ✅ Against supported list |
| `AKASH_CHAT_EMBEDDING_MODEL` | Model for embeddings | BAAI-bge-large-en-v1-5 | ✅ Against supported list |
| `AKASH_CHAT_EMBEDDING_DIMENSIONS` | Embedding vector dimensions | 1024 | ✅ Against valid dimensions |
| `AKASH_CHAT_MAX_CONCURRENT` | Max concurrent requests | 2 | ✅ Enforced ≤ 3 (Akash limit) |
| `AKASH_CHAT_BASE_URL` | API base URL | https://chatapi.akash.network/api/v1 | ✅ URL format validation |

## 🎯 Available Models

### Text Generation Models (Validated)
- `Meta-Llama-3-1-8B-Instruct-FP8` ⭐ (Default Small)
- `Meta-Llama-3-2-3B-Instruct`
- `Meta-Llama-3-3-70B-Instruct` ⭐ (Default Large)
- `Meta-Llama-3-3-8B-Instruct`
- `DeepSeek-R1-Distill-Llama-70B`
- `DeepSeek-R1-Distill-Qwen-14B`
- `DeepSeek-R1-Distill-Qwen-32B`
- `Meta-Llama-3-8B-Instruct`
- `Meta-Llama-3-70B-Instruct`

### Embedding Models (Validated)
- `BAAI-bge-large-en-v1-5` ⭐ (Default, 1024 dimensions)

## 🔧 Advanced Usage

### Model Abstraction
The plugin automatically selects appropriate models based on task complexity:

```typescript
// Small model (quick responses, user chat)
const quickResponse = await runtime.useModel(ModelType.TEXT_SMALL, {
  prompt: "Brief explanation of Akash Network"
});

// Large model (complex analysis, background processing)
const detailedAnalysis = await runtime.useModel(ModelType.TEXT_LARGE, {
  prompt: "Comprehensive analysis of decentralized cloud benefits"
});
```

### Priority Queue System
- **Foreground Priority**: User chat requests get immediate processing
- **Background Priority**: Knowledge base processing queued after user requests
- **Concurrency Enforcement**: Automatically respects Akash's 3-request limit

### Error Handling & Retry Logic
- Automatic retry with exponential backoff for transient failures
- Graceful fallback for embedding generation
- Comprehensive error logging with actionable messages

### Model Validation
```typescript
// Automatic validation during initialization
// Warns about unsupported models and provides suggestions
// Falls back to known working defaults
```

## 🚨 Akash Network Constraints

This plugin is specifically designed to work within Akash Network's constraints:

- **Concurrency Limit**: Maximum 3 parallel requests (plugin uses 2 for safety)
- **Rate Limiting**: Built-in respect for API rate limits
- **Model Availability**: Real-time validation against available models
- **Error Handling**: Akash-specific error message parsing and handling

## 🧪 Testing & Validation

The plugin includes comprehensive test suites:

```bash
# Run all tests
npm test

# Test categories include:
# - API connectivity and validation
# - Model configuration and validation  
# - Text generation (small and large models)
# - Embedding generation with fallbacks
# - Tokenization and detokenization
# - Object generation with JSON repair
# - Concurrency and priority queue management
```

## 📊 Monitoring & Analytics

### Built-in Metrics
- Request queue status and processing times
- Token usage tracking and analytics
- Error rates and retry patterns
- Model selection and performance data

### Usage Events
The plugin emits detailed usage events for monitoring:

```typescript
{
  provider: 'akash-chat',
  type: 'TEXT_SMALL',
  tokens: {
    prompt: 150,
    completion: 75,
    total: 225
  }
}
```

## 🔄 Migration from OpenAI

The plugin provides seamless migration from OpenAI with compatible configuration:

```bash
# OpenAI compatibility mode
SMALL_MODEL=Meta-Llama-3-1-8B-Instruct-FP8
LARGE_MODEL=Meta-Llama-3-3-70B-Instruct

# Direct replacement in existing agents
# No code changes required - just switch the plugin
```

## 🛠️ Troubleshooting

### Common Issues

1. **API Key Not Working**
   ```bash
   [AkashChat] API validation failed: 401 Unauthorized
   ```
   - Verify `AKASH_CHAT_API_KEY` is set correctly
   - Check API key permissions on Akash Chat dashboard

2. **Concurrency Errors**
   ```bash
   [AkashChat] Request failed: Too many concurrent requests
   ```
   - Plugin automatically manages this with retry logic
   - Reduce `AKASH_CHAT_MAX_CONCURRENT` if needed

3. **Model Not Found**
   ```bash
   [AkashChat] Configured model 'custom-model' not in supported list
   ```
   - Use supported models from the list above
   - Plugin automatically falls back to working defaults

4. **Embedding Fallbacks**
   ```bash
   [AkashChat] Using fallback embedding generation
   ```
   - Check API connectivity
   - Verify embedding model configuration
   - Fallback embeddings prevent system crashes

### Debug Mode
Enable detailed logging:
```bash
DEBUG=akash-chat:* npm start
```

## 📈 Performance Optimization

- **Request Queuing**: Efficient management of concurrent requests
- **Priority Scheduling**: User requests prioritized over background tasks
- **Intelligent Retries**: Exponential backoff prevents API flooding
- **Model Caching**: Reuse of validated client connections
- **Fallback Systems**: Graceful degradation when services unavailable

## 🔐 Security

- Secure API key handling with validation
- No logging of sensitive content
- Rate limiting respect to prevent abuse
- Input validation and sanitization
- Comprehensive error handling without exposure

---

## 📝 License

This plugin is part of the ElizaOS ecosystem and follows the same licensing terms.

## 🤝 Support

For support and issues:
- GitHub Issues: [Report bugs and feature requests]
- Discord: [Akash Network community]
- Documentation: [ElizaOS Plugin Development Guide]