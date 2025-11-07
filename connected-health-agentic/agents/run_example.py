from __future__ import annotations

import json
import os
from datetime import datetime

import httpx

LANGGRAPH_URL = os.getenv('LANGGRAPH_URL', 'http://localhost:8000/run')


def main() -> None:
    payload = {
        'session_id': f"demo-{datetime.utcnow().timestamp()}",
        'user_role': 'citizen',
        'language': 'ur',
        'message': 'Bachay ko bukhar hai, Sehat Card hai, kahan jaun?',
        'patient_context': {
            'age': 4,
            'gender': 'male',
            'district': 'Rawalpindi',
            'tehsil': 'Rawalpindi',
            'hasMockSehatCard': True,
        },
    }
    response = httpx.post(LANGGRAPH_URL, json=payload, timeout=30.0)
    response.raise_for_status()
    data = response.json()
    print(json.dumps(data, indent=2))


if __name__ == '__main__':
    main()
