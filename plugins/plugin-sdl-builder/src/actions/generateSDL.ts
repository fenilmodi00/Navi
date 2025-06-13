import {
  Action,
  IAgentRuntime,
  Memory,
  State,
  HandlerCallback,
  Plugin,
  Provider,
  Evaluator,
} from "@elizaos/core";
import { SDLGenerator } from "../generator.js";
import { SDLGenerationRequest } from "../types.js";

export const generateSDLAction: Action = {
  name: "GENERATE_SDL",
  similes: [
    "CREATE_SDL",
    "BUILD_SDL", 
    "MAKE_SDL",
    "SDL_TEMPLATE",
    "AKASH_SDL",
    "DEPLOYMENT_TEMPLATE"
  ],
  description: "Generate Akash Network SDL templates for deployments",
  validate: async (runtime: IAgentRuntime, message: Memory) => {
    const text = message.content?.text?.toLowerCase() || "";
    
    // Check for SDL generation triggers
    const sdlTriggers = [
      "create sdl",
      "generate sdl", 
      "sdl template",
      "deployment template",
      "akash sdl",
      "yaml template",
      "make deployment",
      "create deployment",
      "how to deploy",
      "deployment file",
      "manifest file"
    ];
    
    return sdlTriggers.some(trigger => text.includes(trigger));
  },
  
  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state?: State,
    options?: any,
    callback?: HandlerCallback
  ) => {
    try {
      const text = message.content?.text || "";
      
      // Parse the request from the message
      const request = parseSDLRequest(text);
      
      // Generate SDL using the generator
      const generator = new SDLGenerator();
      const response = generator.generateSDL(request);
      
      // Format the response
      const formattedResponse = formatSDLResponse(response);
      
      if (callback) {
        callback({
          text: formattedResponse,
          action: "GENERATE_SDL"
        });
      }
      
      return true;
    } catch (error) {
      console.error("Error generating SDL:", error);
      
      if (callback) {
        callback({
          text: "I encountered an error generating the SDL template. Please try again with more specific requirements.",
          action: "GENERATE_SDL"
        });
      }
      
      return false;
    }
  },
  
  examples: [
    [
      {
        name: "user",
        content: { text: "Create an SDL for a web application" }
      },
      {
        name: "navi",
        content: { 
          text: "Here's a basic web application SDL template:\n\n```yaml\n---\nversion: \"2.0\"\nservices:\n  web:\n    image: nginx:latest\n    expose:\n      - port: 80\n        as: 80\n        to:\n          - global: true\n```\n\nThis template includes all required sections and is optimized for cost efficiency.",
          actions: ["GENERATE_SDL"]
        }
      }
    ],
    [
      {
        name: "user",
        content: { text: "I need an advanced AI deployment with GPU" }
      },
      {
        name: "navi",
        content: { 
          text: "Here's an advanced AI deployment SDL with GPU support:\n\n```yaml\n---\nversion: \"2.0\"\nservices:\n  ai-model:\n    image: pytorch/pytorch:latest\n    expose:\n      - port: 8000\n        as: 8000\n        to:\n          - global: true\nprofiles:\n  compute:\n    ai-model:\n      resources:\n        gpu:\n          units: 1\n          attributes:\n            vendor:\n              nvidia:\n                - model: rtx4090\n```\n\nThis includes GPU configuration for AI workloads.",
          actions: ["GENERATE_SDL"]
        }
      }
    ]
  ]
};

function parseSDLRequest(text: string): SDLGenerationRequest {
  const textLower = text.toLowerCase();
  
  // Determine deployment type
  let deploymentType = "web"; // default
  if (textLower.includes("ai") || textLower.includes("ml") || textLower.includes("gpu")) {
    deploymentType = "ai";
  } else if (textLower.includes("blockchain") || textLower.includes("eliza") || textLower.includes("node")) {
    deploymentType = "blockchain";
  } else if (textLower.includes("database") || textLower.includes("postgres") || textLower.includes("mysql")) {
    deploymentType = "database";
  }
  
  // Determine complexity
  let complexity: "basic" | "intermediate" | "advanced" = "basic";
  if (textLower.includes("advanced") || textLower.includes("enterprise") || textLower.includes("production")) {
    complexity = "advanced";
  } else if (textLower.includes("intermediate") || textLower.includes("medium") || textLower.includes("redis")) {
    complexity = "intermediate";
  }
  
  // Parse requirements
  const requirements: any = {};
  
  // Check for image
  const imageMatch = text.match(/image[:\s]+([^\s]+)/i);
  if (imageMatch) {
    requirements.image = imageMatch[1];
  }
  
  // Check for GPU requirement
  if (textLower.includes("gpu") || textLower.includes("graphics")) {
    requirements.gpu = true;
  }
  
  // Check for specific resources
  const cpuMatch = text.match(/(\d+)\s*cpu/i);
  if (cpuMatch) {
    requirements.cpu = cpuMatch[1];
  }
  
  const memoryMatch = text.match(/(\d+[GM]i?)\s*memory/i);
  if (memoryMatch) {
    requirements.memory = memoryMatch[1];
  }
  
  return {
    deploymentType,
    complexity,
    requirements
  };
}

function formatSDLResponse(response: any): string {
  const { template, validation, optimizations, estimatedCost } = response;
  
  let output = `Here's your ${template.complexity} ${template.category} SDL template:\n\n`;
  output += "```yaml\n" + template.template + "\n```\n\n";
  
  // Add validation info
  if (validation.score) {
    output += `**Validation Score:** ${validation.score}/100\n\n`;
  }
  
  if (validation.warnings.length > 0) {
    output += "**Warnings:**\n" + validation.warnings.map(w => `⚠️ ${w}`).join("\n") + "\n\n";
  }
  
  // Add optimizations
  if (optimizations.length > 0) {
    output += "**Optimization Suggestions:**\n" + optimizations.map(o => `💡 ${o}`).join("\n") + "\n\n";
  }
  
  // Add cost estimate
  output += `**Estimated Cost:** ${estimatedCost.monthly}/month\n`;
  if (estimatedCost.comparison) {
    output += `**Savings:** ${estimatedCost.comparison}\n`;
  }
  
  output += "\nNeed customizations? Just ask! I can modify resources, add services, or optimize for your specific needs.";
  
  return output;
}
