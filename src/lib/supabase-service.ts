import { Pool } from 'pg';

interface DatabaseConfig {
  connectionString: string;
}

export class SupabaseService {
  private pool: Pool;

  constructor(config: DatabaseConfig) {
    this.pool = new Pool({
      connectionString: config.connectionString,
      ssl: {
        rejectUnauthorized: false
      },
      max: 10,
      min: 2,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 30000,
    });
  }

  async initialize() {
    try {
      // Test the connection
      const client = await this.pool.connect();
      
      // Create basic tables needed for the agent
      await client.query(`
        CREATE TABLE IF NOT EXISTS agent_messages (
          id SERIAL PRIMARY KEY,
          user_id VARCHAR(255),
          message TEXT,
          response TEXT,
          timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          metadata JSONB
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS agent_knowledge (
          id SERIAL PRIMARY KEY,
          content TEXT,
          embedding VECTOR(1024),
          metadata JSONB,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS agent_sessions (
          id SERIAL PRIMARY KEY,
          session_id VARCHAR(255) UNIQUE,
          user_id VARCHAR(255),
          data JSONB,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      client.release();
      console.log('✅ Supabase database initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Supabase database:', error);
      return false;
    }
  }

  async query(text: string, params?: any[]) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(text, params);
      return result;
    } finally {
      client.release();
    }
  }

  async close() {
    await this.pool.end();
  }

  // Store message interaction
  async storeMessage(userId: string, message: string, response: string, metadata?: any) {
    return this.query(
      'INSERT INTO agent_messages (user_id, message, response, metadata) VALUES ($1, $2, $3, $4) RETURNING id',
      [userId, message, response, metadata]
    );
  }

  // Get conversation history
  async getConversationHistory(userId: string, limit: number = 10) {
    return this.query(
      'SELECT * FROM agent_messages WHERE user_id = $1 ORDER BY timestamp DESC LIMIT $2',
      [userId, limit]
    );
  }

  // Store session data
  async storeSession(sessionId: string, userId: string, data: any) {
    return this.query(
      `INSERT INTO agent_sessions (session_id, user_id, data) 
       VALUES ($1, $2, $3) 
       ON CONFLICT (session_id) 
       DO UPDATE SET data = $3, updated_at = CURRENT_TIMESTAMP`,
      [sessionId, userId, JSON.stringify(data)]
    );
  }

  // Get session data
  async getSession(sessionId: string) {
    const result = await this.query(
      'SELECT * FROM agent_sessions WHERE session_id = $1',
      [sessionId]
    );
    return result.rows[0];
  }
}

export const createSupabaseService = (connectionString: string) => {
  return new SupabaseService({ connectionString });
};
