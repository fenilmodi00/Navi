import { clsx, type ClassValue } from "clsx";

/**
 * A utility function for conditionally joining class names together
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}
