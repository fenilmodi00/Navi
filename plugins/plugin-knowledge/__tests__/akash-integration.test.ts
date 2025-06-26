import { describe, it, expect } from "bun:test";
import { validateModelConfig } from "../src/config";
import { generateText, generateTextEmbedding } from "../src/llm";

describe("Knowledge Plugin - Akash Chat Integration", () => {
  it("should validate config for akash-chat provider", () => {
    process.env.EMBEDDING_PROVIDER = "akash-chat";
    process.env.TEXT_PROVIDER = "akash-chat";
    process.env.AKASH_CHAT_API_KEY = "sk-test-key";
    process.env.AKASH_CHAT_BASE_URL = "https://chatapi.akash.network/api/v1";
    process.env.TEXT_MODEL = "Meta-Llama-3-1-8B-Instruct-FP8";
    process.env.TEXT_EMBEDDING_MODEL = "BAAI-bge-large-en-v1-5";

    const config = validateModelConfig();

    expect(config.EMBEDDING_PROVIDER).toBe("akash-chat");
    expect(config.TEXT_PROVIDER).toBe("akash-chat");
    expect(config.AKASH_CHAT_API_KEY).toBe("sk-test-key");
    expect(config.AKASH_CHAT_BASE_URL).toBe("https://chatapi.akash.network/api/v1");
    expect(config.TEXT_MODEL).toBe("Meta-Llama-3-1-8B-Instruct-FP8");
    expect(config.TEXT_EMBEDDING_MODEL).toBe("BAAI-bge-large-en-v1-5");
  });

  it("should throw error for unsupported embedding provider", async () => {
    process.env.EMBEDDING_PROVIDER = "unsupported-provider";
    process.env.AKASH_CHAT_API_KEY = "sk-test-key";

    await expect(async () => {
      await generateTextEmbedding("test text");
    }).toThrow("Invalid enum value. Expected 'akash-chat', received 'unsupported-provider'");
  });

  it("should throw error for unsupported text provider", async () => {
    process.env.TEXT_PROVIDER = "unsupported-provider";
    process.env.AKASH_CHAT_API_KEY = "sk-test-key";

    await expect(async () => {
      await generateText("test prompt");
    }).toThrow("Invalid enum value. Expected 'akash-chat', received 'unsupported-provider'");
  });

  it("should require AKASH_CHAT_API_KEY for akash-chat provider", () => {
    process.env.EMBEDDING_PROVIDER = "akash-chat";
    process.env.TEXT_PROVIDER = "akash-chat";
    delete process.env.AKASH_CHAT_API_KEY;

    expect(() => {
      validateModelConfig();
    }).toThrow("AKASH_CHAT_API_KEY is required");
  });

  it("should use correct default models", () => {
    process.env.EMBEDDING_PROVIDER = "akash-chat";
    process.env.TEXT_PROVIDER = "akash-chat";
    process.env.AKASH_CHAT_API_KEY = "sk-test-key";
    // Clear any existing model env vars to test defaults
    delete process.env.TEXT_MODEL;
    delete process.env.TEXT_EMBEDDING_MODEL;

    const config = validateModelConfig();

    expect(config.TEXT_EMBEDDING_MODEL).toBe("BAAI-bge-large-en-v1-5");
    expect(config.TEXT_MODEL).toBe("Meta-Llama-3-1-8B-Instruct-FP8");
  });
});
