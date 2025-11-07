import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma.js';

const interactionsRouter = Router();

const createSchema = z.object({
  userId: z.number().optional(),
  patientId: z.number().optional(),
  agentName: z.string(),
  inputSummary: z.string(),
  outputSummary: z.string(),
  triageLevel: z.string().optional(),
});

interactionsRouter.post('/', async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid interaction payload', details: parsed.error.flatten() });
  }
  const interaction = await prisma.interaction.create({ data: parsed.data });
  return res.status(201).json(interaction);
});

export default interactionsRouter;
