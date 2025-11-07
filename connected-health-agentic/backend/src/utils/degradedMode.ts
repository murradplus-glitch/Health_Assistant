import env from '../env.js';
import { prisma } from '../prisma.js';

let cachedDegradedMode = env.degradedMode;

export const setCachedDegradedMode = (value: boolean) => {
  cachedDegradedMode = value;
};

export const getCachedDegradedMode = () => cachedDegradedMode;

export const computeDegradedMode = async () => {
  if (env.degradedMode) {
    cachedDegradedMode = true;
    return true;
  }
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    cachedDegradedMode = true;
    return true;
  }
  if (!env.geminiApiKey) {
    cachedDegradedMode = true;
    return true;
  }
  cachedDegradedMode = false;
  return false;
};
