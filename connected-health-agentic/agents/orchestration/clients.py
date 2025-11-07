from __future__ import annotations

import json
import os
from functools import lru_cache
from typing import Any, Dict, List

import httpx
from chromadb import PersistentClient
from chromadb.utils import embedding_functions
try:  # pragma: no cover - optional dependency import guard
    from google import genai  # type: ignore
except ImportError:  # pragma: no cover
    genai = None  # type: ignore

BACKEND_URL = os.getenv('BACKEND_URL', 'http://backend:3001')
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY', '')
GEMINI_MODEL_FAST = os.getenv('GEMINI_MODEL_FAST', 'gemini-2.5-flash')
GEMINI_MODEL_SMART = os.getenv('GEMINI_MODEL_SMART', 'gemini-2.5-pro')
DATA_DIR = os.getenv('KNOWLEDGE_DATA_DIR', os.path.join(os.path.dirname(__file__), '..', 'data'))
CHROMA_PATH = os.getenv('CHROMA_PATH', os.path.join(os.path.dirname(__file__), '..', 'chroma_store'))


class BackendClient:
    def __init__(self) -> None:
        self._client = httpx.Client(base_url=BACKEND_URL, timeout=10.0)

    def health(self) -> Dict[str, Any]:
        response = self._client.get('/api/system/health')
        response.raise_for_status()
        return response.json()

    def search_facilities(self, payload: Dict[str, Any]) -> List[Dict[str, Any]]:
        response = self._client.post('/api/facilities/search', json=payload)
        response.raise_for_status()
        facilities = response.json()
        return facilities

    def program_eligibility(self, payload: Dict[str, Any]) -> List[Dict[str, Any]]:
        response = self._client.post('/api/programs/eligibility', json=payload)
        response.raise_for_status()
        return response.json()

    def create_reminder(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        response = self._client.post('/api/reminders', json=payload)
        response.raise_for_status()
        return response.json()

    def log_interaction(self, payload: Dict[str, Any]) -> None:
        try:
            self._client.post('/api/interactions', json=payload)
        except Exception as error:  # pragma: no cover
            print('interaction_log_error', error)

    def log_mcp_tool(self, payload: Dict[str, Any]) -> None:
        try:
            self._client.post('/api/mcp/logs', json=payload)
        except Exception as error:  # pragma: no cover
            print('mcp_log_error', error)

    def knowledge_triage_rules(self) -> Dict[str, Any]:
        response = self._client.get('/api/knowledge/triage')
        response.raise_for_status()
        return response.json()

    def knowledge_query(self, query: str, limit: int = 5) -> List[Dict[str, Any]]:
        response = self._client.post('/api/knowledge/query', json={'query': query, 'limit': limit})
        response.raise_for_status()
        return response.json()


class GeminiClient:
    def __init__(self) -> None:
        self.api_key = GEMINI_API_KEY
        self.client = None
        if self.api_key and genai:
            self.client = genai.Client(api_key=self.api_key)

    def available(self) -> bool:
        return self.client is not None

    def generate(self, prompt: str, model_variant: str = 'fast') -> str | None:
        if not self.client:
            return None
        model_name = GEMINI_MODEL_FAST if model_variant == 'fast' else GEMINI_MODEL_SMART
        response = self.client.models.generate_content(model=model_name, contents=prompt)
        if hasattr(response, 'text'):
            return response.text
        if isinstance(response, dict):
            return response.get('text')
        return None


class KnowledgeBase:
    def __init__(self) -> None:
        os.makedirs(CHROMA_PATH, exist_ok=True)
        self._client = PersistentClient(path=CHROMA_PATH)
        self._collection = self._client.get_or_create_collection(
            name='health_guidance',
            embedding_function=embedding_functions.SentenceTransformerEmbeddingFunction(model_name='all-MiniLM-L6-v2'),
        )
        self._seed_data()

    def _seed_data(self) -> None:
        existing_ids = set(self._collection.get()['ids']) if self._collection.count() else set()
        data_path = os.path.join(DATA_DIR, 'knowledge_base.json')
        with open(data_path, 'r', encoding='utf-8') as fp:
            records = json.load(fp)
        new_texts = []
        new_ids = []
        metadatas = []
        for record in records:
            if record['id'] in existing_ids:
                continue
            new_ids.append(record['id'])
            new_texts.append(record['title'] + '\n' + record['content'])
            metadatas.append({'language': record.get('language', 'en'), 'tags': record.get('tags', [])})
        if new_ids:
            self._collection.add(ids=new_ids, documents=new_texts, metadatas=metadatas)

    def query(self, text: str, top_k: int = 4) -> List[Dict[str, Any]]:
        if not text.strip():
            return []
        results = self._collection.query(query_texts=[text], n_results=top_k)
        matches = []
        for doc_id, doc, metadata in zip(results['ids'][0], results['documents'][0], results['metadatas'][0]):
            matches.append({'id': doc_id, 'document': doc, 'metadata': metadata})
        return matches


@lru_cache(maxsize=1)
def backend_client() -> BackendClient:
    return BackendClient()


@lru_cache(maxsize=1)
def gemini_client() -> GeminiClient:
    return GeminiClient()


@lru_cache(maxsize=1)
def knowledge_base() -> KnowledgeBase:
    return KnowledgeBase()
