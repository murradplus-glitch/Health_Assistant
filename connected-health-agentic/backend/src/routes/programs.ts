import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma.js';

const programsRouter = Router();

const eligibilitySchema = z.object({
  patientId: z.number().optional(),
  age: z.number().int().nonnegative(),
  gender: z.string(),
  district: z.string().optional(),
  incomeBracket: z.string().optional(),
  hasMockSehatCard: z.boolean().optional(),
});

programsRouter.post('/eligibility', async (req, res) => {
  const parsed = eligibilitySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid eligibility payload', details: parsed.error.flatten() });
  }
  const { patientId, age, gender, district, incomeBracket, hasMockSehatCard } = parsed.data;

  const programs = await prisma.program.findMany();
  const evaluations = programs.map((program) => {
    const rules = program.eligibilityRules as Record<string, unknown>;
    const minAge = typeof rules.minAge === 'number' ? rules.minAge : 0;
    const targetGender = typeof rules.gender === 'string' ? rules.gender : undefined;
    const requiresCard = Boolean(rules.requiresSehatCard);

    const likelyEligible = age >= minAge && (!targetGender || targetGender === 'any' || targetGender.toLowerCase() === gender.toLowerCase()) && (!requiresCard || hasMockSehatCard);

    const reasonParts: string[] = [];
    reasonParts.push(`Age ${age} ${age >= minAge ? 'meets' : 'does not meet'} minimum ${minAge}`);
    if (targetGender && targetGender !== 'any') {
      reasonParts.push(`Target gender: ${targetGender}`);
    }
    if (requiresCard) {
      reasonParts.push(`Sehat Card required: ${hasMockSehatCard ? 'provided' : 'missing (placeholder CNIC allowed)'}`);
    }
    if (district) {
      reasonParts.push(`District provided: ${district}`);
    }

    return {
      programId: program.id,
      name: program.name,
      likelyEligible,
      reason: reasonParts.join('; '),
      mockApplication: {
        instructions: 'Provide placeholder CNIC 12345-xxxxxxx-x and basic household information to enroll.',
        contact: 'Visit nearest Sehat Sahulat facilitation center or apply via LHW tablet.',
      },
    };
  });

  if (patientId) {
    await prisma.patientProgramEligibility.deleteMany({ where: { patientId } });
    await prisma.patientProgramEligibility.createMany({
      data: evaluations.map((ev) => ({
        patientId,
        programId: ev.programId,
        status: ev.likelyEligible ? 'eligible' : 'ineligible',
        details: { reason: ev.reason, incomeBracket, hasMockSehatCard },
      })),
    });
  }

  return res.json(evaluations);
});

export default programsRouter;
