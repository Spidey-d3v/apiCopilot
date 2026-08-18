```
                      @%*+-::..::+@                          
                  %-++:.....-.....=%=-=+#@@@@@               
                %-....:--=*=*=.:-.=.:::::*-..+#@             
             @%%........-:+=.::...=-++*-:...::::#@           
            %-.-....:==#.:%..+.:-:.:::+@:..=@#==*@           
           %.=...#..=-=..:%-..::-*#+*%@@=-+%%..::+@          
          @=-:.=:=...##:.:-%+-:-*@@@@@%#*=:-:.:+%-#          
          @*+::::-:...*%+===%@@@@@@%*-.:-=----+%%*+@@        
         @@=-=-.-%#-::...-%@@@@*-.:.....::#@@@#+%*=@@        
        %---.....:@%++*#%%=..............--*@@@@@%#@@        
       @-...::...-.::*%#:...:::-===:......::+@@@@@@@@        
       @:.:%%##=::-+%@+::::-=**#%@@@%+..::--*@@@@@@@         
       @+-:#*%###%%@@+....=*=---+@@@@#:.:%@@@@@@@@@          
        @+*%=%@@#==+#..:......:::##+:...:@@@@@@@@            
         @##-:*@%*#%+...::..............:@@@@@@@             
         @=-*..=%=::.....:..............:@@@@                
         @#=%=...........::::...........-@@@@                
          +..+%+=+..........::..........-@@@@                
          @--=+#@%...........::....+%%#+#@@@                 
           @*.=%*.:.........::::=-=+=%@@@@@@                 
            %*#%:..+::.....:::::.:::=@@@@@@                  
             *=+=...#=-::..:::...:=#@@@@@@                   
              %#*:...+%+-:::::......-%@@@                    
                @::...:%@%=-:-:....::%@@                     
                @-::....+@@@@%+---=#@@@@@                    
                 *::......%@@@@@@@@@@@@@@@                   
                 %:::......=@@@@@@@@@@@@@@@@                 
                 @-::.......:%@@@@@@@@@@@@@@@@@@             
                 @=:::.......-*%@@@@@@@@@@@@@@@              
                  #:::.....:::-+*%@@@@@@@@@@@                
                  @#-::......::-=++#%@@@@@@@                 
                    @*=-......::::=+++*#@                    
                       @*-:...:==+**#@                       
```

# 🌌 Archon Copilot & AI Agent IDE

[![Next.js](https://img.shields.io/badge/Next.js-14.x-black?style=flat&logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109+-009688?style=flat&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Ollama](https://img.shields.io/badge/Ollama-Local_LLM-black?style=flat&logo=ollama)](https://ollama.com/)
[![Docker](https://img.shields.io/badge/Docker-Compose_Ready-2496ED?style=flat&logo=docker)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**Archon** is an enterprise-grade AI Pair Programmer, Dual-Stream Hybrid RAG Retrieval Engine, and Web-based IDE designed for modern developer workflows.

---

## 🌟 Key Features

### 1. 🤖 Archon Agent (Full-Featured Web IDE)
* **VS Code-Style Tabbed Editor:** Multi-file editing with line numbers, code folding, token-level syntax highlighting, synchronized scrolling, and dirty state tracking (`● Unsaved`).
* **⚡ 1-Click Code Apply & Auto-Apply Mode:** Directly inject generated refactors or bug fixes into active editor buffers or toggle `⚡ Auto-Apply: ON`.
* **✨ Smart File Detection:** Distinguishes between editing the current open file and creating brand new files (e.g. `refund_slack.py`) without overwriting open tabs.
* **💻 Interactive Multi-Terminal Drawer:** Real-time multi-tab terminal sessions with command history (`Up`/`Down` navigation), full selectable text, single-click copy buffer, and instant file tree synchronization.
* **⎇ Live Git Integration:** Real-time branch detection in the status bar across any workspace directory.
* **📁 Open / Create Project Modal:** Switch to any workspace folder or initialize new projects on the fly.

### 2. ⚡ Archon RAG (Hybrid Retrieval & Code Synthesis)
* **Dual-Stream Hybrid Search:** Combines **Okapi BM25** (lexical keyword matching) and **ChromaDB Dense Vectors** (`BAAI/bge-small-en-v1.5`).
* **MS-Marco Cross-Encoder Re-Ranking:** Deep pairwise cross-attention scoring (`ms-marco-MiniLM-L-6-v2`) ensuring high semantic precision.
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

### 1. Clone the Repository
```bash
git clone https://github.com/Spidey-d3v/apiCopilot.git
cd apiCopilot
```

### 2. Prerequisites
* **Ollama** installed with models pulled:
  ```bash
  ollama pull gemma3:4b
  ```

---

### Option A: Run with Docker Compose (Recommended)
```bash
# Build and start all 4 microservices
docker compose up --build -d

# View status
docker compose ps

# View logs
docker compose logs -f

# Stop containers
docker compose down
```

---

### Option B: Run with Native Startup Script (WSL / Linux)
```bash
# Make script executable and launch all services
chmod +x scripts/start_all.sh
./scripts/start_all.sh
```

---

## 🌐 Access the Application
Open **[http://localhost:3000](http://localhost:3000)** in your browser:
* **`Archon RAG`**: Ingest OpenAPI specifications, search endpoints, and inspect multi-stage retrieval ranking.
* **`Archon Agent (IDE)`**: Full VS Code-style pair programming environment with interactive terminal, live editor, and direct AI code application.

---

## 📜 License
This project is licensed under the MIT License.
