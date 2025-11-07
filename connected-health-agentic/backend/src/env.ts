import dotenv from 'dotenv';

dotenv.config();

const env = {
  port: parseInt(process.env.PORT || '3001', 10),
  databaseUrl: process.env.DATABASE_URL || '',
  langGraphUrl: process.env.LANGGRAPH_URL || 'http://localhost:8000/run',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  degradedMode: (process.env.FORCE_DEGRADED_MODE || 'false').toLowerCase() === 'true'
};

export default env;
