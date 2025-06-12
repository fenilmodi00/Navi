import { Plugin } from "@elizaos/core";
import { sdlActions } from "./actions/index.js";
import { sdlProviders } from "./providers/index.js";

export const sdlBuilderPlugin: Plugin = {
  name: "@navi/plugin-sdl-builder",
  description: "Advanced SDL template generation and validation for Akash Network deployments",
  actions: sdlActions,
  providers: sdlProviders,
  evaluators: [],
  services: []
};

export default sdlBuilderPlugin;

// Re-export all components for external use
export * from "./types.js";
export * from "./generator.js";
export * from "./validator.js";
export * from "./templates/index.js";
export * from "./actions/index.js";
export * from "./providers/index.js";
