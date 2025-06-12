/**
 * This module provides fallback functionality for embedding service when
 * the main API is unreachable.
 */
import { logger } from '@elizaos/core';

/**
 * Creates a deterministic fallback embedding vector for text
 * This is used when the API is unreachable to prevent the application from crashing
 * Note: This is NOT a real embedding, just a fallback to allow the application to continue
 * 
 * @param text The text to create a fallback embedding for
 * @param dimension The dimension of the embedding vector
 * @returns A deterministic vector based on the text
 */
export function createFallbackEmbedding(text: string, dimension: number): number[] {
  logger.warn('Using fallback embedding generation - this is NOT a real embedding!');
  
  // Create a deterministic vector based on the text
  const vector = new Array(dimension).fill(0);
  
  // Use a simple hash of the text to create some values
  const simpleHash = hashString(text);
  
  // Set a few values in the vector using the hash
  for (let i = 0; i < 10; i++) {
    const position = Math.abs(simpleHash + i * 7919) % dimension;
    vector[position] = ((simpleHash + i) % 1000) / 1000;
  }
  
  // Set the first element to a special value to mark this as a fallback
  vector[0] = 0.99999;
  
  return vector;
}

/**
 * Simple string hashing function
 * @param str Input string
 * @returns A numeric hash of the string
 */
function hashString(str: string): number {
  let hash = 0;
  if (str.length === 0) return hash;
  
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  return Math.abs(hash);
}

/**
 * Checks if an embedding vector was generated using the fallback method
 * @param vector The embedding vector to check
 * @returns True if the vector was created by the fallback method
 */
export function isFallbackEmbedding(vector: number[]): boolean {
  return vector[0] > 0.99;
}
