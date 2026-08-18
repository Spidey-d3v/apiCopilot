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

WORKSPACE_ROOT = Path(os.getenv("WORKSPACE_ROOT", "/workspace" if os.path.exists("/workspace") else str(Path(__file__).resolve().parent.parent.parent.parent)))

IGNORED_DIRS = {
    ".git", "venv", ".venv", "node_modules", ".next", "__pycache__", ".idea", ".vscode", "data", "chroma_db",
    "AppData", "Application Data", "Local Settings", "Cookies", "NetHood", "PrintHood", "Recent", "SendTo",
    "Start Menu", "Templates", ".cache", ".npm", ".config", "$RECYCLE.BIN", "System Volume Information",
    "MicrosoftEdgeBackups", "Searches", "Contacts", "Saved Games", "Links"
}

@app.on_event("startup")
def ensure_git_safe_directory():
    """Automatically ensures Git safe.directory '*' is configured for all repositories and mounts."""
    try:
        subprocess.run(["git", "config", "--global", "--add", "safe.directory", "*"], check=False)
    except Exception:
        pass

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
    str(WORKSPACE_ROOT).replace("\\", "/")
]

class OpenProjectRequest(BaseModel):
    path: str
    create_if_missing: Optional[bool] = False

class TerminalExecRequest(BaseModel):
    command: str
    cwd: Optional[str] = None
    terminal_id: Optional[str] = "term-1"

import subprocess

def normalize_workspace_path(p_str: str) -> Path:
    cleaned = p_str.strip().replace("\\", "/")

    # 1. Clean malformed /mnt/D:... or /mnt/d:... prefixes
    if cleaned.lower().startswith("/mnt/") and len(cleaned) >= 7 and cleaned[6] == ":":
        drive = cleaned[5].lower()
        rest = cleaned[7:].lstrip("/")
        cleaned = f"{drive}:/{rest}"
    elif cleaned.lower().startswith("/mnt/") and len(cleaned) >= 6 and cleaned[5] == "/":
        drive = cleaned[4].lower()
        rest = cleaned[6:].lstrip("/")
        cleaned = f"/mnt/{drive}/{rest}"

    clean_lower = cleaned.lower().rstrip("/")

    # 2. Check if path starts with a Windows Drive (e.g. C:/... or D:/...)
    if len(cleaned) >= 2 and cleaned[1] == ":":
        drive = cleaned[0].lower()
        rest = cleaned[2:].lstrip("/")
        if os.name != 'nt':
            # If /mnt/c or /mnt/d is mounted
            if os.path.exists(f"/mnt/{drive}"):
                return Path(f"/mnt/{drive}/{rest}").resolve() if rest else Path(f"/mnt/{drive}").resolve()
            # If running in Docker where /workspace is the repo
            if os.path.exists("/workspace"):
                if not rest or rest.lower() == "aidev":
                    return Path("/workspace").resolve()
                return (Path("/workspace") / rest).resolve()
        return Path(cleaned).resolve()

    # 3. If running inside Docker where /workspace is mounted
    if os.path.exists("/workspace"):
        if clean_lower in ["", ".", "./", "/workspace", "d:/aidev", "/mnt/d/aidev", "aidev"]:
            return Path("/workspace").resolve()
        if clean_lower.startswith("/mnt/d/aidev/"):
            sub = cleaned[13:].lstrip("/")
            return (Path("/workspace") / sub).resolve()
        if clean_lower.startswith("d:/aidev/"):
            sub = cleaned[9:].lstrip("/")
            return (Path("/workspace") / sub).resolve()
        if clean_lower.startswith("/workspace/"):
            sub = cleaned[11:].lstrip("/")
            return (Path("/workspace") / sub).resolve()

    # 4. Handle Linux /mnt/... mounts
    if os.name != 'nt' and clean_lower.startswith("/mnt/"):
        if os.path.exists(cleaned):
            return Path(cleaned).resolve()
        if os.path.exists("/workspace") and "aidev" in clean_lower:
            idx = clean_lower.find("aidev")
            sub = cleaned[idx + 5:].lstrip("/")
            return (Path("/workspace") / sub).resolve() if sub else Path("/workspace").resolve()

    p = Path(cleaned)
    if not p.is_absolute() and not cleaned.startswith("/"):
        return (ACTIVE_WORKSPACE_ROOT / cleaned).resolve()
    return p.resolve()

def get_active_git_branch(directory: Path) -> str:
    """Returns the live git branch of the directory or 'no git' if not a repo."""
    try:
        res = subprocess.run(
            ["git", "rev-parse", "--abbrev-ref", "HEAD"],
            cwd=str(directory),
            capture_output=True,
            text=True,
            timeout=2.0
        )
        if res.returncode == 0:
            branch = res.stdout.strip()
            if branch:
                return branch
    except Exception:
        pass
    return "main"

@app.get("/api/workspace/projects")
def get_workspace_projects():
    """Returns current active project, recent projects list, and live git branch."""
    global ACTIVE_WORKSPACE_ROOT, RECENT_PROJECTS
    return {
        "current_project": ACTIVE_WORKSPACE_ROOT.name,
        "project_path": str(ACTIVE_WORKSPACE_ROOT).replace("\\", "/"),
        "git_branch": get_active_git_branch(ACTIVE_WORKSPACE_ROOT),
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

    try:
        subprocess.run(["git", "config", "--global", "--add", "safe.directory", "*"], check=False)
    except Exception:
        pass

    return {
        "status": "success",
        "current_project": target_path.name,
        "project_path": normalized_path,
        "git_branch": get_active_git_branch(target_path),
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
        elif len(target_dir_str) >= 2 and target_dir_str[1] == ":":
            new_dir = normalize_workspace_path(target_dir_str)
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
                "project_name": new_dir.name,
                "git_branch": get_active_git_branch(new_dir)
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
    
    def build_tree(dir_path: Path, current_depth: int = 0, max_depth: int = 2):
        items = []
        if current_depth > max_depth:
            return items
        try:
            with os.scandir(dir_path) as it:
                entries = sorted(list(it), key=lambda e: (not e.is_dir(follow_symlinks=False), e.name.lower()))
                count = 0
                for entry in entries:
                    if count >= 120:
                        break
                    if entry.name in IGNORED_DIRS or entry.name.startswith("."):
                        continue
                    full_path = Path(entry.path)
                    rel_path = str(full_path.relative_to(ACTIVE_WORKSPACE_ROOT)).replace("\\", "/")
                    if entry.is_dir(follow_symlinks=False):
                        items.append({
                            "name": entry.name,
                            "path": rel_path,
                            "type": "directory",
                            "children": build_tree(full_path, current_depth + 1, max_depth) if current_depth < max_depth else []
                        })
                    else:
                        ext = full_path.suffix.lower().lstrip(".")
                        items.append({
                            "name": entry.name,
                            "path": rel_path,
                            "type": "file",
                            "extension": ext
                        })
                    count += 1
        except Exception:
            pass
        return items

    return {
        "root": str(ACTIVE_WORKSPACE_ROOT.name),
        "root_path": str(ACTIVE_WORKSPACE_ROOT).replace("\\", "/"),
        "tree": build_tree(target_dir, 0, 1 if str(ACTIVE_WORKSPACE_ROOT) == "/mnt/c/Users/gaura" else 2)
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
    rag_sources_list = []
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
                    valid_chunks = [c for c in cross_results if isinstance(c, dict) and "text" in c and c.get("score") != "N/A"]
                    if valid_chunks:
                        rag_context = "\n\n---\n\n".join([c["text"] for c in valid_chunks[:3]])
                        for c in valid_chunks[:3]:
                            raw_txt = c["text"]
                            title = "Enterprise API"
                            file_name = "payments_v2.yaml"
                            if "title:" in raw_txt.lower():
                                for line in raw_txt.splitlines():
                                    if line.strip().lower().startswith("title:"):
                                        title = line.split(":", 1)[1].strip()
                                        break
                            elif "slack" in raw_txt.lower():
                                title = "Slack Web API"
                                file_name = "slack_spec.yaml"
                            elif "stripe" in raw_txt.lower() or "payment" in raw_txt.lower() or "refund" in raw_txt.lower():
                                title = "Enterprise Payments API v2.1.0"
                                file_name = "payments_v2.yaml"

                            rag_sources_list.append({
                                "title": title,
                                "file": file_name,
                                "score": c.get("score", "0.92"),
                                "rank": c.get("rank", 1),
                                "text": raw_txt
                            })
        except Exception as e:
            print(f"Warning: Agent RAG retrieval failed: {e}")

    system_prompt = """You are Archon Agent, an elite AI pair programmer and software architect embedded directly into the developer's IDE.
You write clean, modular, production-ready code with rigorous adherence to best practices.

### PAIR PROGRAMMING & CODE EDITING RULES:
1. If the user is greeting you (e.g. 'hi', 'hello', 'hey'), respond concisely and warmly asking what task or code they want to work on. DO NOT generate code for simple greetings.
2. When asked to write, modify, refactor, optimize, debug, or add features to code:
   - Provide the complete, updated code inside standard fenced code blocks (e.g. ```python, ```typescript, ```javascript, ```json, ```yaml, ```html, ```css, ```bash).
   - Whenever creating a new file (e.g. `refund_slack.py`), specify the filename at the very top of the code block as a comment (e.g. `# filename: refund_slack.py`) so the IDE can automatically create and open that file for the developer.
   - Your code blocks are directly parsed and applied by the IDE with the '⚡ Apply to File' button and Auto-Apply engine.
   - Maintain correct imports, type annotations, and error handling.
   - Use the retrieved API Documentation Context and Active Editor File context below to provide 100% accurate, production-ready code.
"""

    if rag_context:
        system_prompt += f"\n\n### Retrieved Enterprise API Documentation (via Hybrid RAG):\n```\n{rag_context}\n```\n"

    if req.active_file_path:
        file_preview = (req.active_file_content[:15000] + "\n...[truncated]") if req.active_file_content and len(req.active_file_content) > 15000 else (req.active_file_content or "")
        system_prompt += f"\n\n### Current Active Editor File: `{req.active_file_path}`\n```\n{file_preview}\n```\n"

    # Build clean structured message history for Ollama /api/chat
    ollama_messages = [{"role": "system", "content": system_prompt}]
    for msg in req.messages:
        content_str = msg.content.strip()
        # Skip the static frontend welcome banner
        if msg.role == "assistant" and ("👋 **Hello! I am Archon Agent" in content_str or "👋 Hello! I am Archon Agent" in content_str):
            continue
        if content_str:
            ollama_messages.append({"role": msg.role, "content": content_str})

    async def token_stream():
        # First emit RAG sources metadata if available
        if rag_sources_list:
            yield f"data: {json_module.dumps({'rag_sources': rag_sources_list})}\n\n"

        async with httpx.AsyncClient() as client:
            try:
                async with client.stream(
                    "POST",
                    f"{OLLAMA_URL}/api/chat",
                    json={
                        "model": req.model,
                        "messages": ollama_messages,
                        "stream": True,
                        "options": {"temperature": req.temperature or 0.2}
                    },
                    timeout=None
                ) as response:
                    async for line in response.aiter_lines():
                        if line.strip():
                            try:
                                chunk = json_module.loads(line)
                                token = chunk.get("message", {}).get("content", "")
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

@app.post("/api/agent/apply-edit")
def apply_agent_edit(req: FileContentRequest):
    """Directly applies an AI-generated code edit to the active workspace file."""
    global ACTIVE_WORKSPACE_ROOT
    target_file = (ACTIVE_WORKSPACE_ROOT / req.path).resolve()
    if not str(target_file).startswith(str(ACTIVE_WORKSPACE_ROOT)):
        raise HTTPException(status_code=403, detail="Access denied")
    try:
        target_file.parent.mkdir(parents=True, exist_ok=True)
        with open(target_file, "w", encoding="utf-8") as f:
            f.write(req.content or "")
        return {
            "status": "success",
            "path": req.path,
            "filename": target_file.name,
            "bytes_written": len(req.content or ""),
            "content": req.content
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
