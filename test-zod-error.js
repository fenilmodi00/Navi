const z = require('zod');

const ModelConfigSchema = z.object({
  EMBEDDING_PROVIDER: z.enum(['akash-chat']).optional(),
  TEXT_PROVIDER: z.enum(['akash-chat']).optional(),
});

try {
  ModelConfigSchema.parse({
    EMBEDDING_PROVIDER: 'unsupported-provider'
  });
} catch (error) {
  console.log('Embedding provider error:', error.issues[0].message);
}

try {
  ModelConfigSchema.parse({
    TEXT_PROVIDER: 'unsupported-provider'
  });
} catch (error) {
  console.log('Text provider error:', error.issues[0].message);
}
