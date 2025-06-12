import { Evaluator, IAgentRuntime, Memory, State } from "@elizaos/core";
import { SDLValidator } from "../validator.js";

export interface SDLEvaluationResult {
  overall: number;
  technical: number;
  cost: number;
  security: number;
  performance: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

export const sdlEvaluator: Evaluator = {
    name: "SDL_QUALITY_EVALUATOR",
    similes: [
        "EVALUATE_SDL_QUALITY",
        "ASSESS_SDL_CONFIGURATION", 
        "SCORE_SDL_DEPLOYMENT",
        "ANALYZE_SDL_EFFECTIVENESS"
    ],
    description: "Evaluates SDL configurations after generation to assess quality, efficiency, and best practices for future improvements",
    
    validate: async (runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
        // Only evaluate when SDL content has been generated or discussed
        const content = message.content.text ? message.content.text.toLowerCase() : "";
        const hasSDLContent = content.includes("sdl") || 
                             content.includes("deployment") || 
                             content.includes("akash") ||
                             content.includes("yaml") ||
                             content.includes("```yaml") ||
                             content.includes("```yml");
        
        // Simple validation - run occasionally when SDL content is present
        return hasSDLContent && Math.random() < 0.3; // 30% chance to evaluate SDL content
    },

    handler: async (runtime: IAgentRuntime, message: Memory, state?: State) => {
        const content = message.content.text || "";
        
        // Extract SDL from recent conversation
        let sdlContent = "";
        const yamlMatch = content.match(/```ya?ml\n([\s\S]*?)\n```/);
        if (yamlMatch) {
            sdlContent = yamlMatch[1];
        }
        
        if (sdlContent) {
            const evaluation = evaluateSDLQuality(sdlContent);
            
            // Simple return of evaluation results
            return evaluation;
        }
        
        return null;
    },

    examples: [
        {
            prompt: "Evaluate SDL configuration quality after generation",
            messages: [
                { 
                    name: "User", 
                    content: { text: "Generate an SDL for a web application" } 
                },
                { 
                    name: "Agent", 
                    content: { 
                        text: "```yaml\nversion: '2.0'\nservices:\n  web:\n    image: nginx:latest\n    expose:\n      - port: 80\n        as: 80\n        to:\n          - global: true\nprofiles:\n  compute:\n    web:\n      resources:\n        cpu:\n          units: 1\n        memory:\n          size: 512Mi\n        storage:\n          size: 1Gi\n  placement:\n    westcoast:\n      pricing:\n        web:\n          denom: uakt\n          amount: 100\ndeployment:\n  web:\n    westcoast:\n      profile: web\n      count: 1\n```" 
                    } 
                }
            ],
            outcome: `{
                "overall": 75,
                "technical": 80,
                "cost": 70,
                "security": 65,
                "performance": 75,
                "strengths": ["Valid SDL structure", "Proper resource allocation"],
                "weaknesses": ["Missing placement attributes"],
                "recommendations": ["Add provider selection criteria", "Consider SSL configuration"]
            }`
        }
    ]
};

export function evaluateSDLQuality(sdl: string): SDLEvaluationResult {
  const validation = SDLValidator.validate(sdl);
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const recommendations: string[] = [];
  
  // Technical Quality Assessment
  let technicalScore = typeof validation.score === "number" ? validation.score : 0;
  
  if (validation.isValid) {
    strengths.push("SDL has valid structure and required sections");
  } else {
    weaknesses.push("SDL has structural issues that need fixing");
    validation.errors.forEach(error => weaknesses.push(error));
  }
  
  // Cost Efficiency Assessment
  let costScore = 50; // baseline
  
  if (sdl.includes('denom: uakt')) {
    costScore += 20;
    strengths.push("Uses proper Akash token denomination");
  } else {
    recommendations.push("Add pricing with uakt denomination");
  }
  
  if (sdl.includes('placement:')) {
    costScore += 15;
    strengths.push("Includes placement configuration for provider selection");
  } else {
    recommendations.push("Add placement section for better cost control");
  }
  
  // Check for reasonable resource allocation
  const cpuMatch = sdl.match(/cpu:\s*\n\s*units:\s*(\d+)/);
  const memoryMatch = sdl.match(/memory:\s*\n\s*size:\s*(\d+)Gi/);
  
  if (cpuMatch && memoryMatch) {
    const cpu = parseInt(cpuMatch[1]);
    const memory = parseInt(memoryMatch[1]);
    const ratio = memory / cpu;
    
    if (ratio >= 2 && ratio <= 8) {
      costScore += 15;
      strengths.push("Good CPU to memory ratio for cost efficiency");
    } else if (ratio < 2) {
      recommendations.push("Consider increasing memory allocation for better balance");
    } else {
      recommendations.push("High memory to CPU ratio - ensure this is necessary");
    }
  }
  
  // Security Assessment
  let securityScore = 60; // baseline
  
  if (sdl.includes('POSTGRES_PASSWORD') || sdl.includes('DATABASE_PASSWORD')) {
    securityScore += 20;
    strengths.push("Database password configuration detected");
  } else if (sdl.includes('postgres') || sdl.includes('mysql')) {
    weaknesses.push("Database without password configuration");
    securityScore -= 20;
  }
  
  if (sdl.includes('global: true') && sdl.includes('ssl')) {
    securityScore += 15;
    strengths.push("SSL/TLS configuration for global exposure");
  } else if (sdl.includes('global: true')) {
    recommendations.push("Consider SSL/TLS for globally exposed services");
  }
  
  if (sdl.includes('env:') && !sdl.includes('SECRET')) {
    recommendations.push("Consider using secrets for sensitive environment variables");
  }
  
  // Performance Assessment
  let performanceScore = 50; // baseline
  
  if (sdl.includes('gpu:')) {
    performanceScore += 25;
    strengths.push("GPU acceleration configured");
    
    if (sdl.includes('attributes:')) {
      performanceScore += 10;
      strengths.push("GPU attributes specified for optimal matching");
    }
  }
  
  if (sdl.includes('storage:')) {
    performanceScore += 15;
    strengths.push("Persistent storage configured");
    
    if (sdl.includes('- size:')) {
      performanceScore += 5;
      strengths.push("Proper storage array format");
    }
  }
  
  if (sdl.includes('redis') || sdl.includes('cache')) {
    performanceScore += 15;
    strengths.push("Caching solution included");
  }
  
  // Check for performance anti-patterns
  if (sdl.includes('cpu:\n          units: 0.1')) {
    weaknesses.push("Very low CPU allocation may cause performance issues");
    performanceScore -= 15;
  }
  
  // Overall Score Calculation
  const overall = Math.round((technicalScore + costScore + securityScore + performanceScore) / 4);
  
  // Add validation warnings and suggestions
  validation.warnings.forEach(warning => recommendations.push(warning));
  validation.suggestions.forEach(suggestion => recommendations.push(suggestion));
  
  return {
    overall: Math.min(100, Math.max(0, overall)),
    technical: Math.min(100, Math.max(0, technicalScore)),
    cost: Math.min(100, Math.max(0, costScore)),
    security: Math.min(100, Math.max(0, securityScore)),
    performance: Math.min(100, Math.max(0, performanceScore)),
    strengths: [...new Set(strengths)], // Remove duplicates
    weaknesses: [...new Set(weaknesses)],
    recommendations: [...new Set(recommendations)]
  };
}
