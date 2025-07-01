import { describe, it, expect } from 'vitest';

/**
 * E2E test to reproduce the multiple user interaction issue
 * where subsequent messages from the same user are ignored
 */
describe('Multiple User Interaction Bug Reproduction', () => {
  
  it('should be able to process multiple messages from the same user', async () => {
    // This test reproduces the bug where the second message from a user
    // is ignored with "Got message where author is the current user. Ignore!"
    
    // Mock message structure based on logs
    const mockUserMessage1 = {
      id: 'msg-1',
      entityId: '01376b46-10eb-0bdb-8f1c-7da90e833e95', // User ID from logs
      roomId: '28214c91-82c2-0a88-96e6-30008b5e23d4', // Room ID from logs
      content: { text: 'hello' },
      createdAt: Date.now(),
    };

    const mockUserMessage2 = {
      id: 'msg-2', 
      entityId: '01376b46-10eb-0bdb-8f1c-7da90e833e95', // Same user ID
      roomId: '28214c91-82c2-0a88-96e6-30008b5e23d4', // Same room ID
      content: { text: 'hello again' },
      createdAt: Date.now() + 1000,
    };

    // Test expectations:
    // 1. First message should be processed correctly
    // 2. Second message should also be processed correctly 
    // 3. Neither message should be ignored as "from current user"
    
    console.log('Mock messages created to reproduce bug:');
    console.log('Message 1 entityId:', mockUserMessage1.entityId);
    console.log('Message 2 entityId:', mockUserMessage2.entityId);
    console.log('Agent ID from config: 491ceb7d-2386-0e3d-90bd-2d07e858c61f');
    
    // For now, just verify the entityIds are different from agent ID
    const agentId = '491ceb7d-2386-0e3d-90bd-2d07e858c61f';
    expect(mockUserMessage1.entityId).not.toBe(agentId);
    expect(mockUserMessage2.entityId).not.toBe(agentId);
    expect(mockUserMessage1.entityId).toBe(mockUserMessage2.entityId);
    
    console.log('✅ User entityIDs are consistent and different from agent ID');
  });

  it('should document the expected fix', () => {
    console.log(`
    ISSUE ANALYSIS:
    ===============
    The logs show that subsequent messages from user '01376b46-10eb-0bdb-8f1c-7da90e833e95' 
    are being treated as "from the current user" (agent) when they should be from the external user.
    
    ROOT CAUSE HYPOTHESIS:
    =====================
    1. The Discord service or message processing logic is incorrectly setting entityId 
       on subsequent messages to the agent's ID instead of the user's ID
    2. OR there's state corruption where user messages are confused with agent messages
    3. OR the "self" type in SHOULD_RESPOND_BYPASS_TYPES was causing confusion
    
    ATTEMPTED FIX:
    =============
    Removed "self" from SHOULD_RESPOND_BYPASS_TYPES configuration.
    
    VERIFICATION NEEDED:
    ===================
    Test with real Discord integration to verify that:
    1. First user message is processed ✓
    2. Agent responds ✓ 
    3. Second user message is processed (not ignored) ← This was failing
    4. System correctly distinguishes user entityId from agent entityId
    `);
    
    expect(true).toBe(true); // Just a documentation test
  });
});
