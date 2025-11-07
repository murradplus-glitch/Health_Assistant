import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma.js';

const mcpLogsRouter = Router();

const createSchema = z.object({
  toolName: z.string(),
  input: z.any(),
  output: z.any().optional(),
  error: z.string().optional(),
});

mcpLogsRouter.post('/', async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid MCP log payload', details: parsed.error.flatten() });
  }
  const log = await prisma.mcpLog.create({
    data: {
      toolName: parsed.data.toolName,
      input: parsed.data.input,
      output: parsed.data.output,
      error: parsed.data.error,
    },
  });
  return res.status(201).json(log);
});

export default mcpLogsRouter;
