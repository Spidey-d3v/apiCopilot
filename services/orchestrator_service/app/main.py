from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import httpx
import json as json_module
import os

from .config import RAG_SERVICE_URL, INGESTION_SERVICE_URL, OLLAMA_URL, DEFAULT_MODEL

app = FastAPI(
    title="Enterprise API Copilot Orchestrator Gateway",
    version="1.0.0",
    description="Smart multi-model routing, prompt synthesis, and SSE stream gateway"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class QueryRequest(BaseModel):
    query: str
    model: str = DEFAULT_MODEL
    top_k: Optional[int] = 3

@app.get("/health")
async def health():
    """Checks health across all connected microservices."""
    async with httpx.AsyncClient(timeout=3.0) as client:
        rag_healthy = False
        ingestion_healthy = False
        ollama_healthy = False

        try:
            r = await client.get(f"{RAG_SERVICE_URL}/health")
            rag_healthy = r.status_code == 200
        except Exception:
            pass

        try:
            r = await client.get(f"{INGESTION_SERVICE_URL}/health")
            ingestion_healthy = r.status_code == 200
        except Exception:
            pass

        try:
            r = await client.get(f"{OLLAMA_URL}/api/tags")
            ollama_healthy = r.status_code == 200
        except Exception:
            pass

    return {
        "status": "healthy" if rag_healthy and ingestion_healthy else "degraded",
        "services": {
            "orchestrator": True,
            "rag_service": rag_healthy,
            "ingestion_service": ingestion_healthy,
            "ollama_gpu": ollama_healthy
        }
    }

@app.get("/api/models")
async def get_models():
    """Proxies available models from Ollama."""
    async with httpx.AsyncClient(timeout=5.0) as client:
        try:
            response = await client.get(f"{OLLAMA_URL}/api/tags")
            if response.status_code == 200:
                models = [m["name"] for m in response.json().get("models", [])]
                return {"models": models}
        except Exception:
            pass
        return {"models": ["gemma3:4b", "gemma3:12b", "codellama:7b-instruct"]}

@app.get("/api/database")
async def get_database():
    """Proxies database chunks and collection info from RAG Service."""
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            response = await client.get(f"{RAG_SERVICE_URL}/api/database")
            return response.json()
        except Exception as e:
            return {"error": f"Failed to reach RAG service: {e}", "fixed_chunks": [], "semantic_chunks": []}

@app.post("/api/search")
async def search(req: QueryRequest):
    """Proxies hybrid search directly to RAG Service."""
    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            response = await client.post(
                f"{RAG_SERVICE_URL}/api/search",
                json={"query": req.query, "top_k": req.top_k or 5}
            )
            return response.json()
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Search service error: {e}")

@app.post("/api/upload")
async def upload_document(file: UploadFile = File(...)):
    """Orchestrates upload: passes file to Ingestion Service, then forwards chunks to RAG Service."""
    file_bytes = await file.read()
    
    async with httpx.AsyncClient(timeout=60.0) as client:
        # Step 1: Send to Ingestion Service for parsing
        try:
            parse_resp = await client.post(
                f"{INGESTION_SERVICE_URL}/api/parse-file",
                files={"file": (file.filename, file_bytes, file.content_type)}
            )
            if parse_resp.status_code != 200:
                raise HTTPException(status_code=500, detail=f"Ingestion failed: {parse_resp.text}")
            parse_data = parse_resp.json()
            chunks = parse_data.get("chunks", [])
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error communicating with Ingestion Service: {e}")

        if not chunks:
            return {"message": "No endpoints or sections found in file.", "chunks": []}

        # Step 2: Send parsed chunks to RAG Service for vector embedding and indexing
        try:
            ingest_resp = await client.post(
                f"{RAG_SERVICE_URL}/api/ingest",
                json={"chunks": chunks}
            )
            if ingest_resp.status_code != 200:
                raise HTTPException(status_code=500, detail=f"RAG indexing failed: {ingest_resp.text}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error communicating with RAG Service: {e}")

    return {
        "message": f"Successfully parsed and ingested {len(chunks)} API segments.",
        "chunks": [c["text"] for c in chunks]
    }

@app.post("/api/generate")
async def generate(req: QueryRequest):
    """Smart Orchestrator generation: retrieves re-ranked context, synthesizes prompt, and streams tokens."""
    # Step 1: Retrieve top cross-encoder re-ranked context from RAG Service
    context_text = ""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            search_resp = await client.post(
                f"{RAG_SERVICE_URL}/api/search",
                json={"query": req.query, "top_k": req.top_k or 3}
            )
            if search_resp.status_code == 200:
                search_data = search_resp.json()
                cross_results = search_data.get("cross_encoder", [])
                valid_chunks = [c["text"] for c in cross_results if "text" in c and c.get("score") != "N/A"]
                if valid_chunks:
                    context_text = "\n\n---\n\n".join(valid_chunks)
    except Exception as e:
        print(f"Warning: RAG context retrieval failed: {e}")

    # Step 2: Synthesize structured system prompt
    prompt = f"""You are an Enterprise API Copilot, an expert AI assistant specializing in API integrations, endpoint specifications, and developer code synthesis.
Answer the developer's question accurately, completely, and concisely based on the provided API documentation context below.
Provide production-ready code examples (e.g. cURL, Python, TypeScript) with correct endpoints, parameters, and headers where applicable.

### API Documentation Context:
{context_text if context_text else 'No specific API documentation found.'}

### Developer Query:
{req.query}
"""

    # Step 3: Stream SSE tokens from Ollama
    async def token_stream():
        async with httpx.AsyncClient() as client:
            try:
                async with client.stream(
                    "POST",
                    f"{OLLAMA_URL}/api/generate",
                    json={"model": req.model, "prompt": prompt, "stream": True},
                    timeout=None
                ) as response:
                    async for line in response.aiter_lines():
                        if line.strip():
                            try:
                                chunk = json_module.loads(line)
                                token = chunk.get("response", "")
                                if token:
                                    yield f"data: {json_module.dumps({'token': token})}\n\n"
                                if chunk.get("done", False):
                                    yield f"data: {json_module.dumps({'done': True})}\n\n"
                                    break
                            except json_module.JSONDecodeError:
                                continue
            except Exception as e:
                err_msg = str(e) if str(e) else repr(e)
                yield f"data: {json_module.dumps({'error': f'Ollama Connection Error: {err_msg}'})}\n\n"

    return StreamingResponse(token_stream(), media_type="text/event-stream")
