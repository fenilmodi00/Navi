import { SDLTemplate } from "../types.js";

// Template data - using escaped strings to avoid YAML parsing issues
const TEMPLATES_DATA = {
  web: {
    basic: {
      name: 'web-basic',
      category: 'web',
      description: 'Basic web application deployment',
      complexity: 'basic',
      template: [
        '---',
        'version: "2.0"',
        'services:',
        '  {{serviceName}}:',
        '    image: nginx:latest',
        '    expose:',
        '      - port: 80',
        '        as: 80',
        '        to:',
        '          - global: true',
        'profiles:',
        '  compute:',
        '    {{serviceName}}:',
        '      resources:',
        '        cpu:',
        '          units: 0.5',
        '        memory:',
        '          size: 512Mi',
        '        storage:',
        '          - size: 1Gi',
        '  placement:',
        '    dcloud:',
        '      pricing:',
        '        {{serviceName}}:',
        '          denom: uakt',
        '          amount: 125000',
        'deployment:',
        '  {{serviceName}}:',
        '    dcloud:',
        '      profile: {{serviceName}}',
        '      count: 1'
      ].join('\n')
    },
    
    intermediate: {
      name: 'web-intermediate',
      category: 'web',
      description: 'Intermediate web application with database',
      complexity: 'intermediate',
      template: [
        '---',
        'version: "2.0"',
        'services:',
        '  {{serviceName}}:',
        '    image: node:18-alpine',
        '    env:',
        '      - NODE_ENV=production',
        '      - PORT=3000',
        '    expose:',
        '      - port: 3000',
        '        as: 3000',
        '        to:',
        '          - global: true',
        '  redis:',
        '    image: redis:alpine',
        '    expose:',
        '      - port: 6379',
        '        as: 6379',
        'profiles:',
        '  compute:',
        '    {{serviceName}}:',
        '      resources:',
        '        cpu:',
        '          units: 1',
        '        memory:',
        '          size: 1Gi',
        '        storage:',
        '          - size: 2Gi',
        '    redis:',
        '      resources:',
        '        cpu:',
        '          units: 0.5',
        '        memory:',
        '          size: 512Mi',
        '        storage:',
        '          - size: 1Gi',
        '  placement:',
        '    dcloud:',
        '      pricing:',
        '        {{serviceName}}:',
        '          denom: uakt',
        '          amount: 135000',
        '        redis:',
        '          denom: uakt',
        '          amount: 125000',
        'deployment:',
        '  {{serviceName}}:',
        '    dcloud:',
        '      profile: {{serviceName}}',
        '      count: 1',
        '  redis:',
        '    dcloud:',
        '      profile: redis',
        '      count: 1'
      ].join('\n')
    }
  },
  
  ai: {
    basic: {
      name: 'ai-basic',
      category: 'ai',
      description: 'Basic AI model deployment',
      complexity: 'basic',
      template: [
        '---',
        'version: "2.0"',
        'services:',
        '  {{serviceName}}:',
        '    image: {{image}}',
        '    env:',
        '      - MODEL_NAME={{modelName}}',
        '      - MAX_CONCURRENT_REQUESTS=10',
        '    expose:',
        '      - port: 8000',
        '        as: 8000',
        '        to:',
        '          - global: true',
        'profiles:',
        '  compute:',
        '    {{serviceName}}:',
        '      resources:',
        '        cpu:',
        '          units: 2',
        '        memory:',
        '          size: 4Gi',
        '        storage:',
        '          - size: 10Gi',
        '  placement:',
        '    dcloud:',
        '      pricing:',
        '        {{serviceName}}:',
        '          denom: uakt',
        '          amount: 150000',
        'deployment:',
        '  {{serviceName}}:',
        '    dcloud:',
        '      profile: {{serviceName}}',
        '      count: 1'
      ].join('\n')
    },
    
    gpu: {
      name: 'ai-gpu',
      category: 'ai',
      description: 'GPU-accelerated AI model deployment',
      complexity: 'advanced',
      template: [
        '---',
        'version: "2.0"',
        'services:',
        '  {{serviceName}}:',
        '    image: {{image}}',
        '    env:',
        '      - MODEL_NAME={{modelName}}',
        '      - CUDA_VISIBLE_DEVICES=0',
        '      - HUGGINGFACE_HUB_CACHE=/cache',
        '    expose:',
        '      - port: 8000',
        '        as: 8000',
        '        to:',
        '          - global: true',
        'profiles:',
        '  compute:',
        '    {{serviceName}}:',
        '      resources:',
        '        cpu:',
        '          units: 4',
        '        memory:',
        '          size: 16Gi',
        '        gpu:',
        '          units: 1',
        '          attributes:',
        '            vendor:',
        '              nvidia:',
        '                - model: rtx4090',
        '        storage:',
        '          - size: 50Gi',
        '  placement:',
        '    dcloud:',
        '      attributes:',
        '        datacenter: us-west',
        '      pricing:',
        '        {{serviceName}}:',
        '          denom: uakt',
        '          amount: 500000',
        'deployment:',
        '  {{serviceName}}:',
        '    dcloud:',
        '      profile: {{serviceName}}',
        '      count: 1'
      ].join('\n')
    }
  },
  
  blockchain: {
    agent: {
      name: 'eliza-agent',
      category: 'blockchain',
      description: 'Eliza AI agent deployment for blockchain interactions',
      complexity: 'advanced',
      template: [
        '---',
        'version: "2.0"',
        'services:',
        '  {{serviceName}}:',
        '    image: elizaos/eliza:latest',
        '    env:',
        '      - NODE_ENV=production',
        '      - ELIZA_LOG_LEVEL=info',
        '      - TWITTER_USERNAME={{twitterUsername}}',
        '      - OPENAI_API_KEY={{openaiApiKey}}',
        '    expose:',
        '      - port: 3000',
        '        as: 3000',
        '        to:',
        '          - global: true',
        'profiles:',
        '  compute:',
        '    {{serviceName}}:',
        '      resources:',
        '        cpu:',
        '          units: 2',
        '        memory:',
        '          size: 4Gi',
        '        storage:',
        '          - size: 20Gi',
        '  placement:',
        '    dcloud:',
        '      pricing:',
        '        {{serviceName}}:',
        '          denom: uakt',
        '          amount: 200000',
        'deployment:',
        '  {{serviceName}}:',
        '    dcloud:',
        '      profile: {{serviceName}}',
        '      count: 1'
      ].join('\n')
    }
  }
};

// Export functions for template access
export function getAllTemplates(): SDLTemplate[] {
  const templates: SDLTemplate[] = [];
  
  Object.values(TEMPLATES_DATA).forEach(category => {
    Object.values(category).forEach(template => {
      templates.push(template as SDLTemplate);
    });
  });
  
  return templates;
}

export function getTemplateByName(name: string): SDLTemplate | undefined {
  const allTemplates = getAllTemplates();
  return allTemplates.find(template => template.name === name);
}

export function getTemplatesByCategory(category: string): SDLTemplate[] {
  const allTemplates = getAllTemplates();
  return allTemplates.filter(template => template.category === category);
}

export function generateSDLFromTemplate(templateName: string, customValues: Record<string, any> = {}): string | null {
  const template = getTemplateByName(templateName);
  
  if (!template) {
    return null;
  }
  
  let sdl = template.template;
  
  // Default values
  const defaults = {
    serviceName: 'app',
    image: 'nginx:latest',
    modelName: 'default-model',
    twitterUsername: 'eliza_agent',
    openaiApiKey: 'your-openai-key'
  };
  
  // Merge custom values with defaults
  const values = { ...defaults, ...(customValues || {}) };
  
  // Replace placeholders
  Object.entries(values).forEach(([key, value]) => {
    const placeholder = `{{${key}}}`;
    sdl = sdl.replace(new RegExp(placeholder, 'g'), value);
  });
  
  return sdl;
}

// Legacy exports for backward compatibility
export const WEB_TEMPLATES = TEMPLATES_DATA.web;
export const AI_TEMPLATES = TEMPLATES_DATA.ai;
export const BLOCKCHAIN_TEMPLATES = TEMPLATES_DATA.blockchain;

export default {
  getAllTemplates,
  getTemplateByName,
  getTemplatesByCategory,
  generateSDLFromTemplate,
  WEB_TEMPLATES,
  AI_TEMPLATES,
  BLOCKCHAIN_TEMPLATES
};
