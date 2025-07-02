import { beforeAll, afterAll, vi } from "vitest";
import dotenv from "dotenv";

// Load test environment variables
dotenv.config({ path: ".env.test" });

// Set default test environment variables
process.env.NODE_ENV = "test";
process.env.LOG_LEVEL = "error";

// Mock @elizaos/core module for unit tests
vi.mock("@elizaos/core", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
  elizaLogger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
  generateId: vi.fn(() => "test-id"),
  validateCharacterConfig: vi.fn(() => true),
  createMockRuntime: vi.fn(() => ({
    agentId: "test-agent-id",
    character: { name: "Test Agent", plugins: [] },
    getService: vi.fn(),
    getSetting: vi.fn(),
    actions: [],
    providers: [],
    evaluators: [],
  })),
}));

// Mock external APIs for testing
beforeAll(() => {
  // Set up test environment
  console.log("🧪 Setting up test environment...");

  // Ensure required test variables
  if (!process.env.AKASH_CHAT_API_KEY) {
    process.env.AKASH_CHAT_API_KEY = "test-key";
  }

  if (!process.env.DISCORD_API_TOKEN) {
    process.env.DISCORD_API_TOKEN = "test-token";
  }

  if (!process.env.DISCORD_APPLICATION_ID) {
    process.env.DISCORD_APPLICATION_ID = "test-id";
  }

  // Override database for testing
  process.env.POSTGRES_URL = ":memory:";
});

afterAll(() => {
  console.log("🧹 Cleaning up test environment...");
});
