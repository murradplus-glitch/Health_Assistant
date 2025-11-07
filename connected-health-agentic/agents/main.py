from __future__ import annotations

from datetime import datetime
from typing import Dict, Literal

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from orchestration.graph import build_graph
from orchestration.state import ConversationState

app = FastAPI(title='Connected Health LangGraph Orchestrator')
workflow = build_graph().compile()
MAX_STEPS = 8


class RunRequest(BaseModel):
    session_id: str = Field(..., alias='session_id')
    user_role: Literal['citizen', 'lhw', 'doctor', 'admin']
    language: Literal['en', 'ur', 'roman-ur'] = 'en'
    message: str
    patient_context: Dict[str, object] = Field(default_factory=dict, alias='patient_context')


@app.post('/run')
def run_workflow(payload: RunRequest):
    initial_state: ConversationState = {
        'session_id': payload.session_id,
        'user_role': payload.user_role,
        'language': payload.language,
        'messages': [],
        'patient_context': payload.patient_context,
        'triage_result': None,
        'program_eligibility': [],
        'facility_recommendations': [],
        'reminders': [],
        'analytics_flags': [],
        'degraded_mode': False,
        'done': False,
        'incoming_message': {
            'sender': 'user',
            'content': payload.message,
            'timestamp': datetime.utcnow().isoformat() + 'Z',
        },
    }

    try:
        result = workflow.invoke(initial_state, config={'recursion_limit': MAX_STEPS})
    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error)) from error

    reply = result.get('reply')
    if not reply and result.get('messages'):
        reply = result['messages'][-1]['content']
    return {
        'reply': reply,
        'state': result,
    }


@app.get('/healthz')
def healthcheck():
    return {'status': 'ok'}
