import { Router } from 'express';
import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.resolve(__dirname, '../../data');

const knowledgeRouter = Router();

knowledgeRouter.get('/triage', async (_req, res) => {
  const file = await readFile(path.join(dataDir, 'triage_rules.json'), 'utf-8');
  const json = JSON.parse(file);
  return res.json(json);
});

const querySchema = z.object({
  query: z.string(),
  limit: z.number().min(1).max(10).optional(),
});

knowledgeRouter.post('/query', async (req, res) => {
  const parsed = querySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid knowledge query', details: parsed.error.flatten() });
  }
  const limit = parsed.data.limit || 5;
  const file = await readFile(path.join(dataDir, 'knowledge_base.json'), 'utf-8');
  const entries: Array<{ id: string; title: string; content: string; category: string }> = JSON.parse(file);
  const results = entries
    .map((entry) => ({
      entry,
      score: relevanceScore(parsed.data.query, entry.content + ' ' + entry.title),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ entry, score }) => ({ ...entry, score }));

  return res.json(results);
});

const relevanceScore = (query: string, text: string) => {
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  let score = 0;
  q.split(/\s+/).forEach((term) => {
    if (t.includes(term)) {
      score += 1;
    }
  });
  return score;
};

export default knowledgeRouter;
