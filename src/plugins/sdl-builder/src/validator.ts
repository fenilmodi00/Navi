import { SDLValidationResult } from "./types.js";

export class SDLValidator {
  static validate(sdl: string): SDLValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];
    
    // Check for required sections
    if (!sdl.includes('version:')) {
      errors.push('Missing version field');
    }
    
    if (!sdl.includes('services:')) {
      errors.push('Missing services section');
    }
    
    if (!sdl.includes('profiles:')) {
      errors.push('Missing profiles section');
    }
    
    if (!sdl.includes('deployment:')) {
      errors.push('Missing deployment section');
    }
    
    // Check for proper format indicators
    if (!sdl.includes('compute:')) {
      errors.push('Missing compute profile');
    }
    
    if (!sdl.includes('placement:')) {
      warnings.push('Missing placement section - consider adding for pricing control');
    }
    
    if (!sdl.includes('denom: uakt')) {
      suggestions.push('Add pricing with uakt denomination for cost control');
    }
    
    // Check storage format
    if (sdl.includes('storage:') && !sdl.includes('- size:')) {
      errors.push('Storage should be in array format: "- size: 1Gi"');
    }
    
    // Check GPU format
    if (sdl.includes('gpu:') && !sdl.includes('attributes:')) {
      suggestions.push('Add GPU attributes for better provider matching');
    }
    
    // Check for common issues
    if (sdl.includes('postgres') && !sdl.includes('POSTGRES_PASSWORD')) {
      warnings.push('Database detected without password configuration');
    }
    
    if (sdl.includes('expose:') && !sdl.includes('global: true')) {
      warnings.push('Services exposed but not globally accessible');
    }
    
    // Calculate validation score
    const totalChecks = 10;
    const issueCount = errors.length + warnings.length * 0.5;
    const score = Math.max(0, Math.round(((totalChecks - issueCount) / totalChecks) * 100));
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions,
      score
    };
  }
  
  static validateStructure(sdl: string): boolean {
    try {
      // Basic YAML structure check
      const requiredSections = ['version:', 'services:', 'profiles:', 'deployment:'];
      return requiredSections.every(section => sdl.includes(section));
    } catch (error) {
      return false;
    }
  }
  
  static getOptimizationSuggestions(deploymentType: string, complexity: string, sdl: string): string[] {
    const optimizations: string[] = [];
    
    // Deployment type specific optimizations
    if (deploymentType === 'ai' && !sdl.includes('HUGGINGFACE_HUB_CACHE')) {
      optimizations.push('Add HuggingFace cache environment variables for faster model loading');
    }
    
    if (deploymentType === 'web' && complexity === 'advanced' && !sdl.includes('redis')) {
      optimizations.push('Consider adding Redis for session management and caching');
    }
    
    if (sdl.includes('postgres') && !sdl.includes('POSTGRES_PASSWORD')) {
      optimizations.push('Ensure database passwords are properly configured');
    }
    
    // Resource optimization
    if (sdl.includes('cpu:\n          units: 8') && !sdl.includes('gpu:')) {
      optimizations.push('Consider GPU acceleration for CPU-intensive workloads');
    }
    
    // Security optimizations
    if (sdl.includes('global: true') && !sdl.includes('ssl')) {
      optimizations.push('Consider SSL/TLS termination for production deployments');
    }
    
    // Cost optimizations
    if (sdl.includes('amount: 20000') || sdl.includes('amount: 30000')) {
      optimizations.push('Review pricing - consider regional providers for cost optimization');
    }
    
    return optimizations;
  }
}
