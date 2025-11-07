import { Router } from 'express';
import { prisma } from '../prisma.js';

const analyticsRouter = Router();

analyticsRouter.get('/summary', async (_req, res) => {
  const [totalInteractions, triageCounts, recentEvents] = await Promise.all([
    prisma.interaction.count(),
    prisma.interaction.groupBy({
      by: ['triageLevel'],
      _count: { triageLevel: true },
    }),
    prisma.analyticsEvent.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
  ]);

  const triageDistribution = triageCounts.reduce<Record<string, number>>((acc, row) => {
    const key = row.triageLevel || 'unknown';
    acc[key] = row._count.triageLevel;
    return acc;
  }, {});

  const hotspotFlags = recentEvents
    .filter((event) => event.eventType === 'hotspot-alert')
    .map((event) => ({
      id: event.id,
      ...event.payload,
      createdAt: event.createdAt,
    }));

  return res.json({
    totalInteractions,
    triageDistribution,
    hotspotFlags,
  });
});

export default analyticsRouter;
