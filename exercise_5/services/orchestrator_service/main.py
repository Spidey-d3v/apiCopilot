from fastapi import FastAPI
from pydantic import BaseModel
import requests
import os

app = FastAPI(title="Orchestrator Service")

RAG_SERVICE_URL = os.getenv("RAG_SERVICE_URL", "http://localhost:8002")
OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")
LLM_MODEL = os.getenv("LLM_MODEL", "codellama:7b-instruct")

class GenerateRequest(BaseModel):
    prompt: str

@app.get("/health")
def health():
    return {"status": "healthy"}

@app.post("/api/v1/generate-sdk")
def generate_sdk(req: GenerateRequest):
    # 1. Get Context from RAG Service
    try:
        rag_resp = requests.get(f"{RAG_SERVICE_URL}/retrieve", params={"query": req.prompt})
        rag_resp.raise_for_status()
        context = rag_resp.json().get("context", "")
    except Exception as e:
        context = ""
    
    # 2. Build Augmented Prompt
    augmented_prompt = f"""Use the following API documentation snippets to answer the request accurately.

CONTEXT:
{context}

USER REQUEST:
{req.prompt}

REQUIREMENT: Generate exact code using the endpoints, headers, and payload schemas specified in the CONTEXT."""

    # 3. Call Ollama
    payload = {
        "model": LLM_MODEL,
        "messages": [
            {"role": "system", "content": "You are an expert SDK Code Generator."},
            {"role": "user", "content": augmented_prompt}
        ],
        "stream": False
    }
    ollama_resp = requests.post(f"{OLLAMA_HOST}/api/chat", json=payload, timeout=120)
    ollama_resp.raise_for_status()
    code = ollama_resp.json()["message"]["content"]
    
    return {"code": code}
