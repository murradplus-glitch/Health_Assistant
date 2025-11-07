export type UserRole = 'citizen' | 'lhw' | 'doctor' | 'admin';
export type ConversationLanguage = 'en' | 'ur' | 'roman-ur';

export interface ConversationMessage {
  sender: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

export interface TriageResult {
  level: 'self-care' | 'clinic' | 'emergency';
  reason: string;
  recommendedUrgency: string;
  disclaimer?: string;
}

export interface ConversationState {
  session_id: string;
  user_role: UserRole;
  language: ConversationLanguage;
  messages: ConversationMessage[];
  patient_context: Record<string, unknown>;
  triage_result: TriageResult | null;
  program_eligibility: Array<Record<string, unknown>>;
  facility_recommendations: Array<Record<string, unknown>>;
  reminders: Array<Record<string, unknown>>;
  analytics_flags: Array<Record<string, unknown>>;
  degraded_mode: boolean;
  done: boolean;
}
