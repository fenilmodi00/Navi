import { generateSDLAction } from "./generateSDL.js";
import { validateSDLAction } from "./validateSDL.js";

export const sdlActions = [
  generateSDLAction,
  validateSDLAction
];

export { generateSDLAction, validateSDLAction };
