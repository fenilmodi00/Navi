import {
  Provider,
  IAgentRuntime,
  Memory,
  State,
  ProviderResult,
} from "@elizaos/core";
import { getAllTemplates } from "../templates/index.js";

export const sdlKnowledgeProvider: Provider = {
  name: "sdlKnowledge",
  description: "Provides SDL and Akash deployment knowledge based on user queries",
  get: async (runtime: IAgentRuntime, message: Memory, state: State) => {
    const text = message.content?.text?.toLowerCase() || "";
    
    // Provide SDL-related knowledge based on the query
    let knowledge = "";
    
    if (text.includes("sdl") || text.includes("deployment")) {
      knowledge += getSDLBasics();
    }
    
    if (text.includes("web") || text.includes("nginx") || text.includes("node")) {
      knowledge += getWebDeploymentInfo();
    }
    
    if (text.includes("ai") || text.includes("gpu") || text.includes("ml")) {
      knowledge += getAIDeploymentInfo();
    }
    
    if (text.includes("blockchain") || text.includes("eliza")) {
      knowledge += getBlockchainDeploymentInfo();
    }
    
    if (text.includes("cost") || text.includes("price") || text.includes("pricing")) {
      knowledge += getPricingInfo();
    }
    
    if (text.includes("resource") || text.includes("cpu") || text.includes("memory")) {
      knowledge += getResourceInfo();
    }
    
    // Return proper ProviderResult format
    return {
      text: knowledge,
      values: {
        sdlKnowledge: knowledge,
        hasSDLQuery: knowledge.length > 0
      }
    };
  }
};

function getSDLBasics(): string {
  return `
**Akash SDL (Stack Definition Language) Basics:**

SDL is Akash's declarative configuration format for defining deployments. Every SDL must include:

1. **version**: Specifies SDL version (currently "2.0")
2. **services**: Defines your application containers
3. **profiles**: Specifies resource requirements and compute profiles
4. **deployment**: Maps services to profiles and providers

**Required Structure:**
\`\`\`yaml
---
version: "2.0"
services:
  # Your application services
profiles:
  compute:
    # Resource specifications
  placement:
    # Pricing and provider selection
deployment:
  # Service deployment mapping
\`\`\`

`;
}

function getWebDeploymentInfo(): string {
  return `
**Web Application Deployments:**

- **Basic**: Static sites, simple web servers (~$5-20/month)
- **Intermediate**: Node.js apps with Redis caching (~$20-100/month)  
- **Advanced**: Full-stack with database, load balancing (~$100-500/month)

**Common Images**: nginx:latest, node:18-alpine, apache:latest
**Typical Resources**: 0.5-2 CPU units, 512Mi-2Gi memory

`;
}

function getAIDeploymentInfo(): string {
  return `
**AI/ML Deployments:**

- **GPU Required**: Most AI workloads need GPU acceleration
- **Popular GPUs**: RTX4090 (24Gi VRAM), A6000 (48Gi), A100/H100 (80Gi)
- **Memory**: AI models typically need 4-16Gi+ system RAM
- **Storage**: 20-100Gi for model caching and data

**Optimization Tips**:
- Use HuggingFace cache env variables
- Enable persistent storage for models
- Consider multi-GPU for large models

`;
}

function getBlockchainDeploymentInfo(): string {
  return `
**Blockchain Node Deployments:**

- **Ethereum**: geth, lighthouse, prysm clients
- **Storage**: 100Gi+ for blockchain data
- **Network**: Multiple ports (8545, 30303, etc.)
- **ElizaOS**: AI agent deployments with GPU support

**Common Requirements**:
- 2-4 CPU cores minimum  
- 8-16Gi memory
- Fast SSD storage
- Reliable network connectivity

`;
}

function getPricingInfo(): string {
  return `
**Akash Pricing (uAKT):**

Current pricing ranges (100,000-175,000 uAKT):
- **Basic Web**: ~125,000 uAKT 
- **AI/GPU**: ~155,000-175,000 uAKT
- **Blockchain**: ~140,000-160,000 uAKT

**Cost Savings**: 60-80% cheaper than AWS/GCP/Azure
**Payment**: Uses AKT tokens, bid-based marketplace

`;
}

function getResourceInfo(): string {
  return `
**Resource Specifications:**

**CPU**: Measured in units (1 unit = 1 vCPU)
- Basic: 0.5-1 units
- Intermediate: 1-4 units  
- Advanced: 4-8+ units

**Memory**: Specified in Mi/Gi
- Basic: 512Mi-1Gi
- Intermediate: 1-4Gi
- Advanced: 4-16Gi+

**Storage**: Persistent volumes in Gi
- Basic: 1-10Gi
- Advanced: 100Gi+

**GPU**: Specify vendor, model, RAM, interface for best matching

`;
}
