import axios from 'axios';
import env from '../env.js';
import { ConversationState } from '../types/conversation.js';

interface RunPayload {
  sessionId: string;
  userRole: string;
  language: string;
  message: string;
  patientContext: Record<string, unknown>;
}

export interface LangGraphResponse {
  reply: string;
  state: ConversationState;
}

export const runLangGraph = async (payload: RunPayload): Promise<LangGraphResponse> => {
  const response = await axios.post(env.langGraphUrl, {
    session_id: payload.sessionId,
    user_role: payload.userRole,
    language: payload.language,
    message: payload.message,
    patient_context: payload.patientContext,
  });
  return response.data;
};
