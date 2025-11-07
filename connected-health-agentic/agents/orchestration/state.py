from __future__ import annotations

from typing import Literal, TypedDict, List, Dict, Any


class ConversationState(TypedDict, total=False):
    session_id: str
    user_role: Literal["citizen", "lhw", "doctor", "admin"]
    language: Literal["en", "ur", "roman-ur"]
    messages: List[Dict[str, Any]]
    patient_context: Dict[str, Any]
    triage_result: Dict[str, Any] | None
    program_eligibility: List[Dict[str, Any]]
    facility_recommendations: List[Dict[str, Any]]
    reminders: List[Dict[str, Any]]
    analytics_flags: List[Dict[str, Any]]
    degraded_mode: bool
    done: bool
    needs_facility: bool
    needs_programs: bool
    needs_follow_up: bool
