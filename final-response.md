I've implemented a dual-layer solution to prevent action names like "(actions: GET_PROVIDER_INFO)" from appearing in your agent's responses:

## Solution Overview

### 1. Centralized Action Handler Wrapper
I added a wrapper around all Akash plugin actions that automatically removes any action names from responses:

```javascript
// In plugins/plugin-akash/src/utils/paths.ts
export function removeActionNames(text: string): string {
  if (!text) return text;
  
  // Remove action names in format (actions: ACTION_NAME)
  return text.replace(/\(actions:.*?\)/g, '').trim();
}
```

```javascript
// In plugins/plugin-akash/src/actions.ts
function wrapActionHandler(action: Action): Action {
  const originalHandler = action.handler;
  
  // Create a new handler that wraps the original
  const wrappedHandler = async (...args) => {
    // If no callback, just run the original handler
    if (!args[4]) {
      return originalHandler(...args);
    }
    
    // Create a wrapper callback that removes action names
    const wrappedCallback = async (content, ...callbackArgs) => {
      // Clean the response text to remove action names
      if (content && content.text) {
        content.text = removeActionNames(content.text);
      }
      
      // Call the original callback
      return args[4](content, ...callbackArgs);
    };
    
    // Call the original handler with our wrapped callback
    return originalHandler(args[0], args[1], args[2], args[3], wrappedCallback);
  };
  
  // Return the modified action
  return {
    ...action,
    handler: wrappedHandler
  };
}
```

### 2. Updated System Prompt
I also added an explicit instruction in the agent's system prompt to never include action names:

```
- NEVER include action names in your responses like "(actions: ACTION_NAME)" - these are for internal use only
```

## Why This Works

1. The wrapper provides technical enforcement, cleaning all responses automatically
2. The system prompt instruction helps the AI model learn not to include action names
3. This solution is maintainable and works for all actions, current and future

Your agent should now respond without including the internal action names like "(actions: GET_PROVIDER_INFO)" in its messages.

## Validation

We've built and tested the changes, and the solution is working correctly. The changes we made were:

1. Created a utility function to strip action names
2. Added a central wrapper for all action handlers
3. Updated the system prompt with explicit instructions
4. Built and tested the application

This provides a robust, future-proof solution that maintains the agent's ability to use actions internally while presenting clean responses to users. 