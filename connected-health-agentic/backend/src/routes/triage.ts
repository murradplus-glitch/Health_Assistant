import { Router } from 'express';
import { z } from 'zod';
import { runLangGraph } from '../services/langGraphClient.js';

const triageRouter = Router();

const triageRequestSchema = z.object({
  sessionId: z.string(),
  userRole: z.enum(['citizen', 'lhw', 'doctor', 'admin']),
  language: z.enum(['en', 'ur', 'roman-ur']).default('en'),
  message: z.string().min(1),
  patientContext: z.record(z.any()).default({}),
});

triageRouter.post('/', async (req, res) => {
  const parsed = triageRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid triage request', details: parsed.error.flatten() });
  }
  try {
    const { sessionId, userRole, language, message, patientContext } = parsed.data;
    const response = await runLangGraph({ sessionId, userRole, language, message, patientContext });
    const { state, reply } = response;
    return res.json({
      reply,
      triageResult: state.triage_result,
      facilities: state.facility_recommendations,
      programs: state.program_eligibility,
      remindersPreview: state.reminders,
      analyticsFlags: state.analytics_flags,
      degradedMode: state.degraded_mode,
      disclaimer: 'This is a decision-support tool, not a doctor. In case of severe symptoms or doubt, go to the nearest emergency facility immediately.'
    });
  } catch (error) {
    console.error('triage_error', error);
    return res.status(502).json({
      error: 'Unable to complete triage at this time',
      degradedFallback: true,
    });
  }
});

export default triageRouter;
