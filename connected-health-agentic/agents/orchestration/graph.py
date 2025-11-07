from __future__ import annotations

import json
import os
from datetime import datetime, timedelta
from typing import Any, Dict, List

from langgraph.graph import END, StateGraph

from .clients import backend_client, gemini_client, knowledge_base
from .state import ConversationState

TRIAGE_RULES_PATH = os.path.join(os.path.dirname(__file__), '..', 'data', 'triage_rules.json')
SAFETY_DISCLAIMER = (
    "This is a decision-support tool, not a doctor. In case of severe symptoms or doubt, go to the nearest emergency facility immediately."
)


def load_local_rules() -> Dict[str, Any]:
    with open(TRIAGE_RULES_PATH, 'r', encoding='utf-8') as fp:
        return json.load(fp)


def ingest_message(state: ConversationState) -> ConversationState:
    messages = state.get('messages', []) or []
    incoming = state.get('incoming_message')
    if incoming:
        messages.append(incoming)
    state['messages'] = messages
    state['program_eligibility'] = state.get('program_eligibility', []) or []
    state['facility_recommendations'] = state.get('facility_recommendations', []) or []
    state['reminders'] = state.get('reminders', []) or []
    state['analytics_flags'] = state.get('analytics_flags', []) or []
    degraded = state.get('degraded_mode', False)
    try:
        health = backend_client().health()
        degraded = bool(health.get('degraded_mode'))
    except Exception:
        degraded = True
    state['degraded_mode'] = degraded
    state['needs_facility'] = False
    state['needs_programs'] = False
    state['needs_follow_up'] = False
    state.pop('incoming_message', None)
    return state


def triage_agent(state: ConversationState) -> ConversationState:
    latest_message = state['messages'][-1]['content'] if state.get('messages') else ''
    rag_matches = knowledge_base().query(latest_message, top_k=4)
    rag_context = '\n'.join(match['document'] for match in rag_matches)

    rules = load_local_rules()
    degraded = state.get('degraded_mode', False)
    gemini = gemini_client()
    triage_result: Dict[str, Any] | None = None

    if not degraded and gemini.available():
        prompt = (
            "You are a clinical triage assistant for Pakistan."
            "Use the context below to classify the triage level as self-care, clinic, or emergency."
            "Respond with a JSON object containing level, reason, recommendedUrgency, and disclaimer."
            f"\nContext:\n{rag_context}\nUser message:\n{latest_message}"
        )
        try:
            response_text = gemini.generate(prompt, model_variant='smart')
            if response_text:
                triage_result = json.loads(response_text)
        except Exception:
            triage_result = None
    if triage_result is None:
        triage_result = rule_based_triage(latest_message, rules)
        state['degraded_mode'] = True

    triage_result.setdefault('disclaimer', SAFETY_DISCLAIMER)
    state['triage_result'] = triage_result
    level = str(triage_result.get('level', 'self-care')).lower()
    state['needs_facility'] = level in {'clinic', 'emergency'}
    state['needs_programs'] = True
    state['needs_follow_up'] = level in {'clinic', 'emergency'}

    backend_client().log_interaction({
        'agentName': 'triage',
        'inputSummary': latest_message[:200],
        'outputSummary': triage_result.get('reason', '')[:200],
        'triageLevel': level,
    })

    return state


def rule_based_triage(message: str, rules: Dict[str, Any]) -> Dict[str, Any]:
    text = message.lower()
    red_flags = ['difficulty breathing', 'unconscious', 'pregnancy bleeding', 'convulsion']
    for flag in red_flags:
        if flag in text:
            return {
                'level': 'emergency',
                'reason': f'Red flag detected: {flag}',
                'recommendedUrgency': 'Immediate emergency evaluation',
                'disclaimer': SAFETY_DISCLAIMER,
            }
    for keyword, result in rules.items():
        if keyword in text and isinstance(result, dict):
            return {
                'level': result.get('level', 'self-care'),
                'reason': result.get('reason', 'Monitor at home'),
                'recommendedUrgency': result.get('recommendedUrgency', 'Monitor'),
                'disclaimer': result.get('disclaimer', SAFETY_DISCLAIMER),
            }
    default_rule = rules.get('default', {})
    return {
        'level': default_rule.get('level', 'self-care'),
        'reason': default_rule.get('reason', 'Monitor at home'),
        'recommendedUrgency': default_rule.get('recommendedUrgency', 'Monitor'),
        'disclaimer': default_rule.get('disclaimer', SAFETY_DISCLAIMER),
    }


def facility_finder_agent(state: ConversationState) -> ConversationState:
    if not state.get('needs_facility'):
        return state
    patient_context = state.get('patient_context', {})
    search_payload: Dict[str, Any] = {
        'district': patient_context.get('district'),
        'tehsil': patient_context.get('tehsil'),
        'lat': patient_context.get('lat'),
        'lng': patient_context.get('lng'),
        'requiredServices': derive_services_from_triage(state.get('triage_result')),
    }
    facilities: List[Dict[str, Any]] = []
    try:
        facilities = backend_client().search_facilities({k: v for k, v in search_payload.items() if v is not None})
    except Exception as error:
        facilities = [{
            'name': 'Local clinic (offline suggestion)',
            'type': 'clinic',
            'distanceKm': None,
            'isOpen': True,
            'servicesSummary': ['basic care'],
            'stockAlerts': [],
            'error': str(error),
        }]
        state['degraded_mode'] = True
    state['facility_recommendations'] = facilities[:3]
    return state


def derive_services_from_triage(result: Dict[str, Any] | None) -> List[str] | None:
    if not result:
        return None
    level = str(result.get('level', '')).lower()
    if level == 'emergency':
        return ['emergency']
    if level == 'clinic':
        return ['maternal', 'pediatrics', 'clinic']
    return None


def program_eligibility_agent(state: ConversationState) -> ConversationState:
    if not state.get('needs_programs'):
        return state
    patient_context = state.get('patient_context', {})
    payload = {
        'patientId': patient_context.get('id'),
        'age': patient_context.get('age', 25),
        'gender': patient_context.get('gender', 'female'),
        'district': patient_context.get('district', 'Islamabad'),
        'incomeBracket': patient_context.get('incomeBracket', 'low'),
        'hasMockSehatCard': patient_context.get('hasMockSehatCard', True),
    }
    try:
        programs = backend_client().program_eligibility(payload)
    except Exception as error:
        programs = [{
            'programId': 0,
            'name': 'Offline maternal voucher',
            'likelyEligible': True,
            'reason': f'Offline fallback due to {error}',
            'mockApplication': {
                'instructions': 'Visit nearest LHW office with placeholder CNIC 12345-xxxxxxx-x.',
                'contact': 'LHW supervisor',
            },
        }]
        state['degraded_mode'] = True
    state['program_eligibility'] = programs
    return state


def follow_up_agent(state: ConversationState) -> ConversationState:
    if not state.get('needs_follow_up'):
        return state
    patient_context = state.get('patient_context', {})
    patient_id = patient_context.get('id', 1)
    triage = state.get('triage_result', {})
    reminder_type = 'followup' if triage.get('level') == 'clinic' else 'medication'
    schedule_in_days = 1 if triage.get('level') == 'emergency' else 3
    payload = {
        'patientId': patient_id,
        'type': reminder_type,
        'message': f"Follow-up after triage result: {triage.get('level', 'self-care')}",
        'scheduledAt': (datetime.utcnow() + timedelta(days=schedule_in_days)).isoformat() + 'Z',
    }
    reminders = state.get('reminders', [])
    try:
        reminder = backend_client().create_reminder(payload)
        reminders.append(reminder)
    except Exception as error:
        reminders.append({
            'patientId': patient_id,
            'type': reminder_type,
            'message': payload['message'],
            'scheduledAt': payload['scheduledAt'],
            'status': 'scheduled',
            'note': f'Offline reminder due to {error}',
        })
        state['degraded_mode'] = True
    state['reminders'] = reminders
    return state


def analytics_agent(state: ConversationState) -> ConversationState:
    triage = state.get('triage_result', {})
    level = str(triage.get('level', '')).lower()
    if level == 'emergency':
        state['analytics_flags'].append({
            'type': 'potential-hotspot',
            'message': 'Emergency case detected; monitor for clustering.',
            'timestamp': datetime.utcnow().isoformat() + 'Z',
        })
    return state


def finalize_agent(state: ConversationState) -> ConversationState:
    triage = state.get('triage_result', {})
    facilities = state.get('facility_recommendations', [])
    programs = state.get('program_eligibility', [])
    reminders = state.get('reminders', [])

    facility_lines = []
    for fac in facilities:
        facility_lines.append(
            f"• {fac.get('name')} ({fac.get('type')}) - {'Open' if fac.get('isOpen', True) else 'Closed'}"
        )
    program_lines = []
    for program in programs[:3]:
        status = 'Eligible' if program.get('likelyEligible') else 'Review'
        program_lines.append(f"• {program.get('name')}: {status} - {program.get('reason')}")
    reminder_lines = [
        f"• {rem.get('message')} on {rem.get('scheduledAt')}"
        for rem in reminders[-2:]
    ]

    reply_parts = [
        f"Triage level: {triage.get('level', 'self-care')}.",
        triage.get('reason', ''),
        f"Urgency: {triage.get('recommendedUrgency', 'Monitor')}.",
    ]
    if facility_lines:
        reply_parts.append('Suggested facilities:\n' + '\n'.join(facility_lines))
    if program_lines:
        reply_parts.append('Program matches:\n' + '\n'.join(program_lines))
    if reminder_lines:
        reply_parts.append('Reminders set:\n' + '\n'.join(reminder_lines))
    reply_parts.append(SAFETY_DISCLAIMER)

    reply_text = '\n\n'.join([part for part in reply_parts if part])

    state.setdefault('messages', []).append({
        'sender': 'assistant',
        'content': reply_text,
        'timestamp': datetime.utcnow().isoformat() + 'Z',
    })
    state['done'] = True
    state['reply'] = reply_text
    return state


def build_graph() -> StateGraph:
    graph = StateGraph(ConversationState)
    graph.add_node('ingest', ingest_message)
    graph.add_node('triage_agent', triage_agent)
    graph.add_node('facility_finder', facility_finder_agent)
    graph.add_node('program_eligibility', program_eligibility_agent)
    graph.add_node('follow_up', follow_up_agent)
    graph.add_node('analytics', analytics_agent)
    graph.add_node('finalize', finalize_agent)

    graph.set_entry_point('ingest')
    graph.add_edge('ingest', 'triage_agent')
    graph.add_edge('triage_agent', 'facility_finder')
    graph.add_edge('facility_finder', 'program_eligibility')
    graph.add_edge('program_eligibility', 'follow_up')
    graph.add_edge('follow_up', 'analytics')
    graph.add_edge('analytics', 'finalize')
    graph.add_edge('finalize', END)

    return graph
