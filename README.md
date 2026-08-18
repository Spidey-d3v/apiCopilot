# 🌌 Archon Copilot & AI Agent IDE

[![Next.js](https://img.shields.io/badge/Next.js-14.x-black?style=flat&logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109+-009688?style=flat&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Ollama](https://img.shields.io/badge/Ollama-Local_LLM-black?style=flat&logo=ollama)](https://ollama.com/)
[![ChromaDB](https://img.shields.io/badge/ChromaDB-Vector_DB-orange?style=flat)](https://trychroma.com/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**Archon** is an enterprise-grade AI Pair Programmer, Dual-Stream Hybrid RAG Retrieval Engine, and Web-based IDE built for seamless developer productivity.

---

## 🌟 Key Features

### 1. 🤖 Archon Agent (Full-Featured IDE)
* **VS Code-Style Tabbed Editor:** Multi-file editing with line numbers, code folding, token-level syntax highlighting, synchronized scrolling, and dirty state tracking (`● Unsaved`).
* **⚡ One-Click Code Apply & Auto-Apply Mode:** Directly inject generated refactors or bug fixes into active buffers or toggle `⚡ Auto-Apply: ON`.
* **✨ Smart File Detection:** Automatically distinguishes between editing the open file and creating new files (e.g. `refund_slack.py`) without overwriting unrelated tabs.
* **💻 Interactive Multi-Terminal Drawer:** Real-time multi-tab terminal sessions with command history (`Up`/`Down` arrows), single-click copy buffer, and instant file tree synchronization.
* **⎇ Live Git Integration:** Real-time branch detection in the status bar across any workspace directory.
* **📁 Open / Create Project Modal:** Switch to any workspace folder (`D:/...`, `C:/Users/...`, `/mnt/...`) or create new starter projects on the fly.

### 2. ⚡ Archon RAG (Hybrid Retrieval & Code Synthesis)
* **Dual-Stream Hybrid Search:** Combines **Okapi BM25** (lexical keyword matching) and **ChromaDB Dense Vectors** (`BAAI/bge-small-en-v1.5`).
* **MS-Marco Cross-Encoder Re-Ranking:** Deep pairwise cross-attention scoring (`ms-marco-MiniLM-L-6-v2`) ensuring the highest semantic precision.
* **Interactive 3-Column Diagnostic Inspector:** Real-time live ranking comparisons across lexical, dense, and cross-encoder streams.
* **📚 Interactive Hover Citations:** Hovering over RAG source badges in the chat displays the exact raw OpenAPI / specification chunks and relevance scores.

---

## 🏗️ Architecture & Microservices Mesh

```
                                  ┌───────────────────────────────────┐
                                  │      Next.js 14 Frontend          │
                                  │    http://localhost:3000          │
                                  └─────────────────┬─────────────────┘
                                                    │
                                                    ▼
                                  ┌───────────────────────────────────┐
                                  │   Orchestrator Gateway (:8000)    │
                                  └───────┬──────────────┬────────────┘
                                          │              │
                   ┌──────────────────────┴──────┐       │
                   ▼                             ▼       ▼
    ┌─────────────────────────────┐   ┌───────────────────────────────┐
    │     RAG Service (:8001)     │   │   Ingestion Service (:8002)   │
    │  • Okapi BM25 Lexical Index │   │  • OpenAPI / Markdown Chunker │
    │  • ChromaDB Dense Vectors   │   │  • Dynamic Spec Ingestion     │
    │  • Cross-Encoder Re-Ranker  │   └───────────────────────────────┘
    └──────────────┬──────────────┘
                   │
                   ▼
    ┌─────────────────────────────┐
    │   Ollama Local GPU Server   │
    │  (gemma3:4b / codellama)    │
    │    http://localhost:11434   │
    └─────────────────────────────┘
```

---

## 🚀 Quickstart Guide

### 1. Prerequisites (Inside WSL / Ubuntu)
* **Python 3.10+** & `pip`
* **Node.js 18+** & `npm`
* **Ollama** installed with models pulled:
  ```bash
  ollama pull gemma3:4b
  ```

---

### 2. Starting All Services

You can launch the entire stack using the startup script:

```bash
# In WSL:
cd /mnt/d/AIDeV
chmod +x scripts/start_all.sh
./scripts/start_all.sh
```

Or start the services individually:

#### Terminal 1: Ingestion Service (Port 8002)
```bash
cd /mnt/d/AIDeV
PYTHONPATH=/mnt/d/AIDeV/services/ingestion_service ./backend/venv/bin/python3 -m uvicorn services.ingestion_service.app.main:app --host 0.0.0.0 --port 8002
```

#### Terminal 2: RAG Service (Port 8001)
```bash
cd /mnt/d/AIDeV
PYTHONPATH=/mnt/d/AIDeV/services/rag_service ./backend/venv/bin/python3 -m uvicorn services.rag_service.app.main:app --host 0.0.0.0 --port 8001
```

#### Terminal 3: Orchestrator Gateway (Port 8000)
```bash
cd /mnt/d/AIDeV
PYTHONPATH=/mnt/d/AIDeV/services/orchestrator_service ./backend/venv/bin/python3 -m uvicorn services.orchestrator_service.app.main:app --host 0.0.0.0 --port 8000
```

#### Terminal 4: Next.js Frontend (Port 3000)
```bash
cd /mnt/d/AIDeV/frontend
npm run dev
```

---

## 🌐 Access the Application
Open **[http://localhost:3000](http://localhost:3000)** in your browser:
* **`Archon RAG`**: Ingest OpenAPI specifications, search endpoints, and inspect multi-stage retrieval ranking.
* **`Archon Agent (IDE)`**: Full VS Code-style pair programming environment with interactive terminal, live editor, and direct AI code application.

---

## 📜 License
This project is licensed under the MIT License.
