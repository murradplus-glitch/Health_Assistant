import { Router } from 'express';
import env from '../env.js';
import { computeDegradedMode } from '../utils/degradedMode.js';

const systemRouter = Router();

systemRouter.get('/health', async (_req, res) => {
  const degraded = await computeDegradedMode();
  return res.json({
    gemini_ok: Boolean(env.geminiApiKey) && !degraded,
    db_ok: !degraded,
    degraded_mode: degraded,
  });
});

export default systemRouter;
