import {
  Action,
  IAgentRuntime,
  Memory,
  State,
  HandlerCallback,
} from "@elizaos/core";
import { SDLValidator } from "../validator.js";

export const validateSDLAction: Action = {
  name: "VALIDATE_SDL",
  similes: [
    "CHECK_SDL",
    "VERIFY_SDL", 
    "VALIDATE_DEPLOYMENT",
    "CHECK_DEPLOYMENT",
    "SDL_CHECK",
    "YAML_CHECK"
  ],
  description: "Validate Akash Network SDL templates for correctness and optimization",
  validate: async (runtime: IAgentRuntime, message: Memory) => {
    const text = message.content?.text?.toLowerCase() || "";
    
    // Check for validation triggers
    const validationTriggers = [
      "validate sdl",
      "check sdl", 
      "verify sdl",
      "validate deployment",
      "check deployment",
      "is this sdl correct",
      "sdl errors",
      "yaml errors",
      "deployment errors"
    ];
    
    // Also check if message contains YAML-like content
    const hasYamlContent = text.includes("version:") && 
                          text.includes("services:") && 
                          text.includes("profiles:");
    
    return validationTriggers.some(trigger => text.includes(trigger)) || hasYamlContent;
  },
  
  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    options: any,
    callback?: HandlerCallback
  ) => {
    try {
      const text = message.content?.text || "";
      
      // Extract SDL content from the message
      const sdlContent = extractSDLContent(text);
      
      if (!sdlContent) {
        if (callback) {
          callback({
            text: "I couldn't find any SDL content to validate. Please provide an SDL template in YAML format.",
            action: "VALIDATE_SDL"
          });
        }
        return false;
      }
      
      // Validate the SDL
      const validation = SDLValidator.validate(sdlContent);
      
      // Format the response
      const formattedResponse = formatValidationResponse(validation);
      
      if (callback) {
        callback({
          text: formattedResponse,
          action: "VALIDATE_SDL"
        });
      }
      
      return true;
    } catch (error) {
      console.error("Error validating SDL:", error);
      
      if (callback) {
        callback({
          text: "I encountered an error validating the SDL template. Please check the format and try again.",
          action: "VALIDATE_SDL"
        });
      }
      
      return false;
    }
  },
  
  examples: [
    [
      {
        user: "{{user1}}",
        content: { text: "Please validate this SDL:\n```yaml\nversion: \"2.0\"\nservices:\n  web:\n    image: nginx:latest\n```" }
      },
      {
        user: "{{user2}}",
        content: { 
          text: "**SDL Validation Results:**\n\n❌ **Issues Found:**\n• Missing profiles section\n• Missing deployment section\n\n**Score:** 60/100\n\nYour SDL needs the required profiles and deployment sections to be complete.",
          action: "VALIDATE_SDL"
        }
      }
    ]
  ]
};

function extractSDLContent(text: string): string | null {
  // Try to extract content from code blocks first
  const codeBlockMatch = text.match(/```(?:yaml|yml)?\n?([\s\S]*?)\n?```/);
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim();
  }
  
  // If no code block, check if the text itself looks like SDL
  if (text.includes("version:") && text.includes("services:")) {
    return text.trim();
  }
  
  return null;
}

function formatValidationResponse(validation: any): string {
  let output = "**SDL Validation Results:**\n\n";
  
  if (validation.isValid) {
    output += "✅ **Valid SDL Template**\n\n";
  } else {
    output += "❌ **Issues Found:**\n";
    validation.errors.forEach((error: string) => {
      output += `• ${error}\n`;
    });
    output += "\n";
  }
  
  if (validation.warnings && validation.warnings.length > 0) {
    output += "⚠️ **Warnings:**\n";
    validation.warnings.forEach((warning: string) => {
      output += `• ${warning}\n`;
    });
    output += "\n";
  }
  
  if (validation.suggestions && validation.suggestions.length > 0) {
    output += "💡 **Suggestions:**\n";
    validation.suggestions.forEach((suggestion: string) => {
      output += `• ${suggestion}\n`;
    });
    output += "\n";
  }
  
  if (validation.score !== undefined) {
    output += `**Validation Score:** ${validation.score}/100\n\n`;
  }
  
  if (validation.isValid) {
    output += "Your SDL template is ready for deployment! 🚀";
  } else {
    output += "Please fix the issues above and I'll validate it again.";
  }
  
  return output;
}
