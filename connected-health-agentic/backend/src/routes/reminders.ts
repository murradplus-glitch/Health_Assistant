import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma.js';

const remindersRouter = Router();

const createSchema = z.object({
  patientId: z.number(),
  type: z.enum(['medication', 'vaccine', 'followup']),
  message: z.string(),
  scheduledAt: z.string(),
});

remindersRouter.post('/', async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid reminder payload', details: parsed.error.flatten() });
  }
  const reminder = await prisma.reminder.create({
    data: {
      patientId: parsed.data.patientId,
      type: parsed.data.type,
      message: parsed.data.message,
      scheduledAt: new Date(parsed.data.scheduledAt),
      status: 'scheduled',
    },
  });
  return res.status(201).json(reminder);
});

remindersRouter.get('/', async (req, res) => {
  const patientId = req.query.patientId ? Number(req.query.patientId) : undefined;
  const reminders = await prisma.reminder.findMany({
    where: { patientId: patientId || undefined },
    orderBy: { scheduledAt: 'asc' },
  });
  return res.json(reminders);
});

const updateSchema = z.object({
  status: z.enum(['scheduled', 'done', 'missed'])
});

remindersRouter.patch('/:id', async (req, res) => {
  const reminderId = Number(req.params.id);
  if (Number.isNaN(reminderId)) {
    return res.status(400).json({ error: 'Invalid reminder id' });
  }
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid reminder update payload', details: parsed.error.flatten() });
  }
  const reminder = await prisma.reminder.update({
    where: { id: reminderId },
    data: { status: parsed.data.status },
  });
  return res.json(reminder);
});

export default remindersRouter;
