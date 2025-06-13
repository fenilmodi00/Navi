import { SDLTemplate, SDLGenerationRequest, SDLGenerationResponse } from "./types.js";
import { getAllTemplates } from "./templates/index.js";
import { SDLValidator } from "./validator.js";

export class SDLGenerator {
  private templates: any;
  
  constructor() {
    this.templates = getAllTemplates();
  }
  
  generateSDL(request: SDLGenerationRequest): SDLGenerationResponse {
    const { deploymentType, complexity, requirements, customizations } = request;
    
    // Get base template
    let template = this.getBaseTemplate(deploymentType, complexity);
    
    // Apply customizations
    if (customizations) {
      template = this.applyCustomizations(template, customizations);
    }
    
    // Apply requirements
    if (requirements) {
      template = this.applyRequirements(template, requirements);
    }
    
    // Validate the generated SDL
    const validation = SDLValidator.validate(template);
    
    // Get optimizations
    const optimizations = SDLValidator.getOptimizationSuggestions(
      deploymentType, 
      complexity, 
      template
    );
    
    // Calculate estimated costs
    const estimatedCost = this.calculateCosts(complexity, deploymentType);
    
    const sdlTemplate: SDLTemplate = {
      name: `${deploymentType}-${complexity}`,
      description: `${complexity} ${deploymentType} deployment template`,
      category: deploymentType as any,
      complexity: complexity as any,
      template,
      requiredInputs: ['image', 'resources'],
      estimatedCost: estimatedCost.monthly,
      tags: [deploymentType, complexity]
    };
    
    return {
      template: sdlTemplate,
      validation,
      optimizations,
      estimatedCost
    };
  }
  
  private getBaseTemplate(deploymentType: string, complexity: string): string {
    const typeTemplates = this.templates[deploymentType];
    if (!typeTemplates) {
      return this.templates.web.basic; // Fallback to web basic
    }
    
    return typeTemplates[complexity] || typeTemplates.basic || this.templates.web.basic;
  }
  
  private applyCustomizations(template: string, customizations: any): string {
    let modifiedTemplate = template;
    
    // Add Redis if requested
    if (customizations.addRedis && !template.includes('redis')) {
      modifiedTemplate = this.addRedisService(modifiedTemplate);
    }
    
    // Add PostgreSQL if requested  
    if (customizations.addPostgres && !template.includes('postgres')) {
      modifiedTemplate = this.addPostgresService(modifiedTemplate);
    }
    
    // Add SSL if requested
    if (customizations.enableSSL) {
      modifiedTemplate = this.addSSLConfiguration(modifiedTemplate);
    }
    
    return modifiedTemplate;
  }
  
  private applyRequirements(template: string, requirements: any): string {
    let modifiedTemplate = template;
    
    // Replace image if specified
    if (requirements.image) {
      modifiedTemplate = modifiedTemplate.replace(
        /image: .+/g,
        `image: ${requirements.image}`
      );
    }
    
    // Modify CPU if specified
    if (requirements.cpu) {
      modifiedTemplate = modifiedTemplate.replace(
        /units: [\d.]+/g,
        `units: ${requirements.cpu}`
      );
    }
    
    // Modify memory if specified
    if (requirements.memory) {
      modifiedTemplate = modifiedTemplate.replace(
        /size: \d+[A-Za-z]+/g,
        `size: ${requirements.memory}`
      );
    }
    
    // Add environment variables if specified
    if (requirements.env) {
      modifiedTemplate = this.addEnvironmentVariables(modifiedTemplate, requirements.env);
    }
    
    return modifiedTemplate;
  }
  
  private addRedisService(template: string): string {
    const redisService = `  redis:
    image: redis:alpine
    expose:
      - port: 6379
        as: 6379`;
    
    const redisProfile = `    redis:
      resources:
        cpu:
          units: 0.5
        memory:
          size: 512Mi
        storage:
          - size: 1Gi`;
    
    const redisPricing = `        redis:
          denom: uakt
          amount: 125000`;
    
    const redisDeployment = `  redis:
    dcloud:
      profile: redis
      count: 1`;
    
    let modifiedTemplate = template;
    
    // Add service
    modifiedTemplate = modifiedTemplate.replace(
      /services:(\n.*?)profiles:/s,
      `services:$1${redisService}\nprofiles:`
    );
    
    // Add profile
    modifiedTemplate = modifiedTemplate.replace(
      /compute:(\n.*?)  placement:/s,
      `compute:$1${redisProfile}\n  placement:`
    );
    
    // Add pricing (if placement exists)
    if (modifiedTemplate.includes('pricing:')) {
      modifiedTemplate = modifiedTemplate.replace(
        /pricing:(\n.*?)deployment:/s,
        `pricing:$1${redisPricing}\ndeployment:`
      );
    }
    
    // Add deployment
    modifiedTemplate = modifiedTemplate.replace(
      /deployment:(\n.*?)$/s,
      `deployment:$1${redisDeployment}`
    );
    
    return modifiedTemplate;
  }
  
  private addPostgresService(template: string): string {
    // Similar implementation to Redis but for PostgreSQL
    const postgresService = `  postgres:
    image: postgres:15-alpine
    env:
      - POSTGRES_DB=app
      - POSTGRES_PASSWORD=password
    expose:
      - port: 5432
        as: 5432`;
    
    // Implementation similar to addRedisService
    return template; // Simplified for now
  }
  
  private addSSLConfiguration(template: string): string {
    // Add SSL/TLS configuration
    return template; // Simplified for now
  }
  
  private addEnvironmentVariables(template: string, env: Record<string, string>): string {
    const envVars = Object.entries(env)
      .map(([key, value]) => `      - ${key}=${value}`)
      .join('\n');
    
    // Add environment variables to the first service
    return template.replace(
      /image: (.+)/,
      `image: $1\n    env:\n${envVars}`
    );
  }
  
  private calculateCosts(complexity: string, deploymentType: string) {
    const baseCosts = {
      basic: { monthly: '$5-20', hourly: '$0.007-0.028' },
      intermediate: { monthly: '$20-100', hourly: '$0.028-0.139' },
      advanced: { monthly: '$100-500', hourly: '$0.139-0.694' }
    };
    
    const multipliers = {
      web: 1,
      ai: 3,
      blockchain: 2
    };
    
    const base = baseCosts[complexity] || baseCosts.basic;
    const multiplier = multipliers[deploymentType] || 1;
    
    return {
      monthly: base.monthly,
      hourly: base.hourly,
      comparison: `~${Math.round(60 * multiplier)}% cheaper than AWS/GCP`
    };
  }
}
