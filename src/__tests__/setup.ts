import { beforeAll, afterAll } from 'vitest';
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Set default test environment variables
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error';

// Mock external APIs for testing
beforeAll(() => {
  // Set up test environment
  console.log('🧪 Setting up test environment...');
  
  // Ensure required test variables
  if (!process.env.AKASH_CHAT_API_KEY) {
    process.env.AKASH_CHAT_API_KEY = 'test-key';
  }
  
  if (!process.env.DISCORD_API_TOKEN) {
    process.env.DISCORD_API_TOKEN = 'test-token';
  }
  
  if (!process.env.DISCORD_APPLICATION_ID) {
    process.env.DISCORD_APPLICATION_ID = 'test-id';
  }
  
  // Override database for testing
  process.env.POSTGRES_URL = ':memory:';
});

afterAll(() => {
  console.log('🧹 Cleaning up test environment...');
});
