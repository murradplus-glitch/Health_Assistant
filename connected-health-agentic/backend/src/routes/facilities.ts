import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma.js';

const facilitiesRouter = Router();

const searchSchema = z.object({
  district: z.string().optional(),
  tehsil: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  requiredServices: z.array(z.string()).optional(),
});

facilitiesRouter.post('/search', async (req, res) => {
  const parsed = searchSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid facility search payload', details: parsed.error.flatten() });
  }
  const { district, tehsil, lat, lng, requiredServices } = parsed.data;
  const facilities = await prisma.facility.findMany({
    where: {
      district: district || undefined,
      tehsil: tehsil || undefined,
    },
    include: {
      inventory: true,
    },
    take: 10,
  });

  const results = facilities.map((facility) => {
    const services = Array.isArray(facility.services) ? facility.services : [];
    const hasRequired = requiredServices && requiredServices.length > 0
      ? requiredServices.some((reqService) => JSON.stringify(services).toLowerCase().includes(reqService.toLowerCase()))
      : true;
    const isOpen = true; // assume open for prototype
    const servicesSummary = services.slice(0, 4);
    let distanceKm: number | undefined;
    if (lat && lng && facility.lat && facility.lng) {
      const toRad = (deg: number) => deg * Math.PI / 180;
      const dLat = toRad(facility.lat - lat);
      const dLng = toRad(facility.lng - lng);
      const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat)) * Math.cos(toRad(facility.lat)) * Math.sin(dLng / 2) ** 2;
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      distanceKm = +(6371 * c).toFixed(2);
    }
    return {
      id: facility.id,
      name: facility.name,
      type: facility.type,
      distanceKm,
      isOpen,
      servicesSummary,
      stockAlerts: facility.inventory.filter((item) => item.stockLevel.toLowerCase() === 'low').map((item) => item.itemName),
      matchesRequired: hasRequired,
    };
  }).filter((facility) => !requiredServices || requiredServices.length === 0 || facility.matchesRequired);

  return res.json(results.slice(0, 3));
});

export default facilitiesRouter;
