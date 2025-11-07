import { Router } from 'express';
import { prisma } from '../prisma.js';

const patientsRouter = Router();

patientsRouter.get('/', async (_req, res) => {
  const patients = await prisma.patient.findMany({
    include: {
      reminders: true,
    },
    take: 25,
  });
  const sanitized = patients.map((patient) => ({
    id: patient.id,
    fullName: patient.fullName,
    age: patient.age,
    gender: patient.gender,
    pregnancyStatus: patient.pregnancyStatus,
    address: patient.address,
    lat: patient.lat,
    lng: patient.lng,
  }));
  return res.json(sanitized);
});

patientsRouter.get('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: 'Invalid patient id' });
  }
  const patient = await prisma.patient.findUnique({
    where: { id },
    include: {
      reminders: true,
      programs: {
        include: { program: true },
      },
    },
  });
  if (!patient) {
    return res.status(404).json({ error: 'Patient not found' });
  }
  return res.json(patient);
});

export default patientsRouter;
