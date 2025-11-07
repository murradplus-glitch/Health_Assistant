import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import env from './env.js';
import triageRouter from './routes/triage.js';
import facilitiesRouter from './routes/facilities.js';
import programsRouter from './routes/programs.js';
import remindersRouter from './routes/reminders.js';
import analyticsRouter from './routes/analytics.js';
import systemRouter from './routes/system.js';
import knowledgeRouter from './routes/knowledge.js';
import interactionsRouter from './routes/interactions.js';
import patientsRouter from './routes/patients.js';
import mcpLogsRouter from './routes/mcpLogs.js';

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/', (_req, res) => {
  res.json({ status: 'ok', message: 'Connected Health Agentic backend ready' });
});

app.use('/api/triage', triageRouter);
app.use('/api/facilities', facilitiesRouter);
app.use('/api/programs', programsRouter);
app.use('/api/reminders', remindersRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/system', systemRouter);
app.use('/api/knowledge', knowledgeRouter);
app.use('/api/interactions', interactionsRouter);
app.use('/api/patients', patientsRouter);
app.use('/api/mcp/logs', mcpLogsRouter);

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('unexpected_error', err);
  res.status(500).json({ error: 'Unexpected server error' });
});

app.listen(env.port, () => {
  console.log(`Backend listening on port ${env.port}`);
});
