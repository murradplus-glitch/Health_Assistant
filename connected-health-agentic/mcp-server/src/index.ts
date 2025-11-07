import 'dotenv/config';
import { Server } from '@modelcontextprotocol/sdk/server';
import { ToolResponse } from '@modelcontextprotocol/sdk/types';
import { z } from 'zod';
import { fetch, RequestInit } from 'undici';

const backendUrl = process.env.BACKEND_URL ?? 'http://backend:3001';
const port = Number(process.env.MCP_PORT ?? 7000);

const server = new Server({
  name: 'connected-health-mcp',
  version: '0.1.0',
});

const jsonResponse = (data: unknown): ToolResponse => ({
  content: [{ type: 'json', json: data }],
});

async function callBackend(path: string, options: RequestInit = {}): Promise<any> {
  const response = await fetch(`${backendUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Backend error ${response.status}: ${text}`);
  }
  if (response.status === 204) {
    return null;
  }
  return await response.json();
}

async function logToolInvocation(toolName: string, input: unknown, output?: unknown, error?: string) {
  try {
    await callBackend('/api/mcp/logs', {
      method: 'POST',
      body: JSON.stringify({ toolName, input, output, error }),
    });
  } catch (loggingError) {
    console.error('Failed to log MCP tool invocation', loggingError);
  }
}

server.tool({
  name: 'get_patient_profile',
  description: 'Retrieve a patient profile by ID from the health backend.',
  schema: z.object({ patientId: z.number() }),
  async execute({ patientId }) {
    try {
      const data = await callBackend(`/api/patients/${patientId}`);
      await logToolInvocation('get_patient_profile', { patientId }, data);
      return jsonResponse(data);
    } catch (error: any) {
      await logToolInvocation('get_patient_profile', { patientId }, undefined, error.message);
      return jsonResponse({ error: error.message });
    }
  },
});

server.tool({
  name: 'save_interaction_log',
  description: 'Persist an interaction summary to the backend.',
  schema: z.object({
    agentName: z.string(),
    inputSummary: z.string(),
    outputSummary: z.string(),
    triageLevel: z.string().optional(),
    userId: z.number().optional(),
    patientId: z.number().optional(),
  }),
  async execute(payload) {
    try {
      const data = await callBackend('/api/interactions', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      await logToolInvocation('save_interaction_log', payload, data);
      return jsonResponse(data);
    } catch (error: any) {
      await logToolInvocation('save_interaction_log', payload, undefined, error.message);
      return jsonResponse({ error: error.message });
    }
  },
});

server.tool({
  name: 'check_program_eligibility',
  description: 'Evaluate program eligibility for a patient context.',
  schema: z.object({
    age: z.number(),
    gender: z.string(),
    district: z.string().optional(),
    incomeBracket: z.string().optional(),
    hasMockSehatCard: z.boolean().optional(),
    patientId: z.number().optional(),
  }),
  async execute(payload) {
    try {
      const data = await callBackend('/api/programs/eligibility', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      await logToolInvocation('check_program_eligibility', payload, data);
      return jsonResponse(data);
    } catch (error: any) {
      await logToolInvocation('check_program_eligibility', payload, undefined, error.message);
      return jsonResponse({ error: error.message });
    }
  },
});

server.tool({
  name: 'get_facility_recommendations',
  description: 'Find nearby facilities that match required services.',
  schema: z.object({
    district: z.string().optional(),
    tehsil: z.string().optional(),
    lat: z.number().optional(),
    lng: z.number().optional(),
    requiredServices: z.array(z.string()).optional(),
  }),
  async execute(payload) {
    try {
      const data = await callBackend('/api/facilities/search', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      await logToolInvocation('get_facility_recommendations', payload, data);
      return jsonResponse(data);
    } catch (error: any) {
      await logToolInvocation('get_facility_recommendations', payload, undefined, error.message);
      return jsonResponse({ error: error.message });
    }
  },
});

server.tool({
  name: 'create_reminder',
  description: 'Schedule a reminder for a patient.',
  schema: z.object({
    patientId: z.number(),
    type: z.enum(['medication', 'vaccine', 'followup']),
    message: z.string(),
    scheduledAt: z.string(),
  }),
  async execute(payload) {
    try {
      const data = await callBackend('/api/reminders', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      await logToolInvocation('create_reminder', payload, data);
      return jsonResponse(data);
    } catch (error: any) {
      await logToolInvocation('create_reminder', payload, undefined, error.message);
      return jsonResponse({ error: error.message });
    }
  },
});

server.tool({
  name: 'get_triage_rules_cached',
  description: 'Retrieve cached triage rules for degraded mode reasoning.',
  schema: z.object({}),
  async execute() {
    try {
      const data = await callBackend('/api/knowledge/triage');
      await logToolInvocation('get_triage_rules_cached', {}, data);
      return jsonResponse(data);
    } catch (error: any) {
      await logToolInvocation('get_triage_rules_cached', {}, undefined, error.message);
      return jsonResponse({ error: error.message });
    }
  },
});

server.tool({
  name: 'query_knowledge_base',
  description: 'Query the knowledge base for relevant guidance snippets.',
  schema: z.object({ query: z.string(), limit: z.number().min(1).max(10).optional() }),
  async execute(payload) {
    try {
      const data = await callBackend('/api/knowledge/query', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      await logToolInvocation('query_knowledge_base', payload, data);
      return jsonResponse(data);
    } catch (error: any) {
      await logToolInvocation('query_knowledge_base', payload, undefined, error.message);
      return jsonResponse({ error: error.message });
    }
  },
});

server.listen({ port });
console.log(`MCP server listening on port ${port}`);
