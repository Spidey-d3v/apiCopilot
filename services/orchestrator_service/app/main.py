from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from pathlib import Path
import httpx
import json as json_module
import os
import asyncio

from .config import RAG_SERVICE_URL, INGESTION_SERVICE_URL, OLLAMA_URL, DEFAULT_MODEL

app = FastAPI(
    title="Archon Copilot Orchestrator Gateway",
    version="1.0.0",
    description="Smart multi-model routing, prompt synthesis, workspace explorer, and IDE Archon Copilot Agent"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

WORKSPACE_ROOT = Path(os.getenv("WORKSPACE_ROOT", str(Path(__file__).resolve().parent.parent.parent.parent)))
IGNORED_DIRS = {".git", "venv", ".venv", "node_modules", ".next", "__pycache__", ".idea", ".vscode", "data", "chroma_db"}

class QueryRequest(BaseModel):
    query: str
    model: str = DEFAULT_MODEL
    top_k: Optional[int] = 3

class Message(BaseModel):
    role: str  # "user" | "assistant" | "system"
    content: str

class AgentChatRequest(BaseModel):
    messages: List[Message]
    active_file_path: Optional[str] = None
    active_file_content: Optional[str] = None
    model: str = DEFAULT_MODEL
    temperature: Optional[float] = 0.2

class FileContentRequest(BaseModel):
    path: str
    content: Optional[str] = None

class CreateFileRequest(BaseModel):
    path: str
    is_directory: bool = False

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

    prompt = f"""You are an Enterprise API Copilot, an expert AI assistant specializing in API integrations, endpoint specifications, and developer code synthesis.
Answer the developer's question accurately, completely, and concisely based on the provided API documentation context below.
Provide production-ready code examples (e.g. cURL, Python, TypeScript) with correct endpoints, parameters, and headers where applicable.

### API Documentation Context:
{context_text if context_text else 'No specific API documentation found.'}

### Developer Query:
{req.query}
"""

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

# ── Workspace File Explorer & IDE Endpoints ───────────────────────────────

ACTIVE_WORKSPACE_ROOT = WORKSPACE_ROOT
RECENT_PROJECTS: List[str] = [
    str(WORKSPACE_ROOT).replace("\\", "/"),
    "C:/Users/gaura",
    "D:/AIDeV"
]

class OpenProjectRequest(BaseModel):
    path: str
    create_if_missing: Optional[bool] = False

class TerminalExecRequest(BaseModel):
    command: str
    cwd: Optional[str] = None
    terminal_id: Optional[str] = "term-1"

def normalize_workspace_path(p_str: str) -> Path:
    cleaned = p_str.strip().replace("\\", "/")
    if len(cleaned) >= 2 and cleaned[1] == ":":
        drive = cleaned[0].lower()
        rest = cleaned[2:].lstrip("/")
        if os.name != 'nt' and os.path.exists(f"/mnt/{drive}"):
            return Path(f"/mnt/{drive}/{rest}").resolve()
    return Path(cleaned).resolve()

@app.get("/api/workspace/projects")
def get_workspace_projects():
    """Returns current active project and recent projects list."""
    global ACTIVE_WORKSPACE_ROOT, RECENT_PROJECTS
    return {
        "current_project": ACTIVE_WORKSPACE_ROOT.name,
        "project_path": str(ACTIVE_WORKSPACE_ROOT).replace("\\", "/"),
        "recent_projects": list(dict.fromkeys(RECENT_PROJECTS))[:10]
    }

@app.post("/api/workspace/open-project")
def open_workspace_project(req: OpenProjectRequest):
    """Opens any folder / directory on the host as the active IDE project root, creating if requested."""
    global ACTIVE_WORKSPACE_ROOT, RECENT_PROJECTS
    target_path = normalize_workspace_path(req.path)
    
    if not target_path.exists():
        if req.create_if_missing:
            target_path.mkdir(parents=True, exist_ok=True)
            readme_file = target_path / "README.md"
            if not readme_file.exists():
                readme_file.write_text(f"# {target_path.name}\n\nInitialized with Archon Copilot.\n", encoding="utf-8")
        else:
            raise HTTPException(status_code=400, detail=f"Directory not found: {req.path}")
    elif not target_path.is_dir():
        raise HTTPException(status_code=400, detail=f"Path is not a directory: {req.path}")
    
    ACTIVE_WORKSPACE_ROOT = target_path
    normalized_path = str(target_path).replace("\\", "/")
    if normalized_path not in RECENT_PROJECTS:
        RECENT_PROJECTS.insert(0, normalized_path)

    return {
        "status": "success",
        "current_project": target_path.name,
        "project_path": normalized_path,
        "recent_projects": list(dict.fromkeys(RECENT_PROJECTS))[:10]
    }

@app.post("/api/terminal/exec")
async def terminal_exec(req: TerminalExecRequest):
    """Executes a real shell command in the active workspace directory context."""
    global ACTIVE_WORKSPACE_ROOT
    raw_cmd = req.command.strip()
    cwd_str = str(ACTIVE_WORKSPACE_ROOT).replace("\\", "/")
    
    if not raw_cmd:
        return {"stdout": "", "stderr": "", "exit_code": 0, "cwd": cwd_str}
    
    # Handle 'cd <dir>' command
    if raw_cmd == "cd" or raw_cmd.startswith("cd "):
        parts = raw_cmd.split(maxsplit=1)
        target_dir_str = parts[1].strip() if len(parts) > 1 else "~"
        if target_dir_str == "~":
            new_dir = Path.home()
        elif target_dir_str.startswith("/"):
            new_dir = Path(target_dir_str).resolve()
        else:
            new_dir = (ACTIVE_WORKSPACE_ROOT / target_dir_str).resolve()
        
        if new_dir.exists() and new_dir.is_dir():
            ACTIVE_WORKSPACE_ROOT = new_dir
            new_cwd = str(new_dir).replace("\\", "/")
            if new_cwd not in RECENT_PROJECTS:
                RECENT_PROJECTS.insert(0, new_cwd)
            return {
                "stdout": f"Changed working directory to {new_dir}\n",
                "stderr": "",
                "exit_code": 0,
                "cwd": new_cwd,
                "project_name": new_dir.name
            }
        else:
            return {
                "stdout": "",
                "stderr": f"cd: no such file or directory: {target_dir_str}\n",
                "exit_code": 1,
                "cwd": cwd_str
            }
    
    # Execute command in shell
    try:
        shell_cmd = ["bash", "-c", raw_cmd] if os.name != "nt" else ["cmd.exe", "/c", raw_cmd]
        process = await asyncio.create_subprocess_exec(
            *shell_cmd,
            cwd=str(ACTIVE_WORKSPACE_ROOT),
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        try:
            stdout_bytes, stderr_bytes = await asyncio.wait_for(process.communicate(), timeout=45.0)
            stdout_str = stdout_bytes.decode("utf-8", errors="replace")
            stderr_str = stderr_bytes.decode("utf-8", errors="replace")
            return {
                "stdout": stdout_str,
                "stderr": stderr_str,
                "exit_code": process.returncode if process.returncode is not None else 0,
                "cwd": str(ACTIVE_WORKSPACE_ROOT).replace("\\", "/")
            }
        except asyncio.TimeoutError:
            try:
                process.kill()
            except Exception:
                pass
            return {
                "stdout": "",
                "stderr": "Command execution timed out (45s limit)\n",
                "exit_code": 124,
                "cwd": cwd_str
            }
    except Exception as e:
        return {
            "stdout": "",
            "stderr": f"Execution error: {str(e)}\n",
            "exit_code": 1,
            "cwd": cwd_str
        }

@app.get("/api/workspace/tree")
def get_workspace_tree(subpath: str = ""):
    """Returns a recursive file & folder tree of the active project workspace."""
    global ACTIVE_WORKSPACE_ROOT
    target_dir = (ACTIVE_WORKSPACE_ROOT / subpath).resolve()
    if not str(target_dir).startswith(str(ACTIVE_WORKSPACE_ROOT)):
        raise HTTPException(status_code=403, detail="Access denied")
    
    def build_tree(dir_path: Path):
        items = []
        try:
            entries = sorted(os.listdir(dir_path), key=lambda x: (not os.path.isdir(dir_path / x), x.lower()))
            for entry in entries:
                if entry in IGNORED_DIRS or entry.startswith("."):
                    continue
                full_path = dir_path / entry
                rel_path = str(full_path.relative_to(ACTIVE_WORKSPACE_ROOT)).replace("\\", "/")
                if full_path.is_dir():
                    items.append({
                        "name": entry,
                        "path": rel_path,
                        "type": "directory",
                        "children": build_tree(full_path)
                    })
                else:
                    ext = full_path.suffix.lower().lstrip(".")
                    items.append({
                        "name": entry,
                        "path": rel_path,
                        "type": "file",
                        "extension": ext,
                        "size": full_path.stat().st_size
                    })
        except Exception as e:
            pass
        return items

    return {
        "root": str(ACTIVE_WORKSPACE_ROOT.name),
        "root_path": str(ACTIVE_WORKSPACE_ROOT).replace("\\", "/"),
        "tree": build_tree(target_dir)
    }

@app.get("/api/workspace/file")
def read_workspace_file(path: str):
    """Reads the raw text content of a workspace file."""
    global ACTIVE_WORKSPACE_ROOT
    target_file = (ACTIVE_WORKSPACE_ROOT / path).resolve()
    if not str(target_file).startswith(str(ACTIVE_WORKSPACE_ROOT)) or not target_file.is_file():
        raise HTTPException(status_code=404, detail="File not found")
    try:
        with open(target_file, "r", encoding="utf-8", errors="replace") as f:
            content = f.read()
        return {"path": path, "content": content, "filename": target_file.name}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/workspace/file")
def save_workspace_file(req: FileContentRequest):
    """Saves updated text content to a workspace file."""
    global ACTIVE_WORKSPACE_ROOT
    target_file = (ACTIVE_WORKSPACE_ROOT / req.path).resolve()
    if not str(target_file).startswith(str(ACTIVE_WORKSPACE_ROOT)):
        raise HTTPException(status_code=403, detail="Access denied")
    try:
        target_file.parent.mkdir(parents=True, exist_ok=True)
        with open(target_file, "w", encoding="utf-8") as f:
            f.write(req.content or "")
        return {"status": "success", "path": req.path, "bytes_written": len(req.content or "")}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/workspace/create")
def create_workspace_item(req: CreateFileRequest):
    """Creates a new file or directory in the workspace."""
    global ACTIVE_WORKSPACE_ROOT
    target_path = (ACTIVE_WORKSPACE_ROOT / req.path).resolve()
    if not str(target_path).startswith(str(ACTIVE_WORKSPACE_ROOT)):
        raise HTTPException(status_code=403, detail="Access denied")
    try:
        if req.is_directory:
            target_path.mkdir(parents=True, exist_ok=True)
        else:
            target_path.parent.mkdir(parents=True, exist_ok=True)
            if not target_path.exists():
                target_path.touch()
        return {"status": "success", "path": req.path}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ── Copilot Agent Multi-Turn Chat Endpoint ────────────────────────────────

@app.post("/api/agent/chat")
async def agent_chat(req: AgentChatRequest):
    """Multi-turn Copilot Agent endpoint with Hybrid RAG retrieval, active file context, and conversational guardrails."""
    # Find latest user message
    latest_user_msg = next((m.content for m in reversed(req.messages) if m.role == "user"), "").strip()
    is_greeting = latest_user_msg.lower() in ["hi", "hello", "hey", "sup", "greetings", "good morning", "good evening", "how are you", "who are you"]

    # Hybrid RAG Context Retrieval (Dual-stream BM25 + Dense + Cross-Encoder)
    rag_context = ""
    if latest_user_msg and not is_greeting and len(latest_user_msg) > 3:
        try:
            async with httpx.AsyncClient(timeout=6.0) as client:
                search_resp = await client.post(
                    f"{RAG_SERVICE_URL}/api/search",
                    json={"query": latest_user_msg, "top_k": 3}
                )
                if search_resp.status_code == 200:
                    search_data = search_resp.json()
                    cross_results = search_data.get("cross_encoder", [])
                    valid_chunks = [c["text"] for c in cross_results if "text" in c and c.get("score") != "N/A"]
                    if valid_chunks:
                        rag_context = "\n\n---\n\n".join(valid_chunks[:3])
        except Exception as e:
            print(f"Warning: Agent RAG retrieval failed: {e}")

    system_prompt = """You are Archon Agent, an elite AI pair programmer and software architect embedded directly into the developer's IDE.
You write clean, modular, production-ready code with rigorous adherence to best practices.

### CONVERSATIONAL RULES:
1. If the user is greeting you (e.g. 'hi', 'hello', 'hey'), respond concisely and warmly asking what task or code they want to work on. DO NOT generate code or analyze the active file for simple greetings.
2. When the user asks a question, requests a feature, or asks for code refactoring/debugging:
   - Provide concise, high-signal explanations.
   - Output code blocks with precise language tags (e.g. ```python, ```typescript, ```json, ```yaml, ```bash, ```css, ```html).
   - Use the retrieved API Documentation Context and Active Editor File context below to provide 100% accurate, production-ready code.
"""

    if rag_context:
        system_prompt += f"\n\n### Retrieved Enterprise API Documentation (via Hybrid RAG):\n```\n{rag_context}\n```\n"

    if req.active_file_path:
        file_preview = (req.active_file_content[:15000] + "\n...[truncated]") if req.active_file_content and len(req.active_file_content) > 15000 else (req.active_file_content or "")
        system_prompt += f"\n\n### Current Active Editor File: `{req.active_file_path}`\n```\n{file_preview}\n```\n"

    full_prompt = f"System: {system_prompt}\n\n"
    for msg in req.messages:
        role_label = "User" if msg.role == "user" else "Assistant"
        full_prompt += f"{role_label}: {msg.content}\n\n"
    full_prompt += "Assistant: "

    async def token_stream():
        async with httpx.AsyncClient() as client:
            try:
                async with client.stream(
                    "POST",
                    f"{OLLAMA_URL}/api/generate",
                    json={"model": req.model, "prompt": full_prompt, "stream": True, "options": {"temperature": req.temperature or 0.2}},
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
                yield f"data: {json_module.dumps({'error': f'Agent Inference Error: {err_msg}'})}\n\n"

    return StreamingResponse(token_stream(), media_type="text/event-stream")
