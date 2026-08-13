# Automated Agentic Implementation Plan: APICopilot
## Project 4: Enterprise API Documentation & SDK Generator Playground
**Target OS**: VMware Ubuntu 24.04 LTS  
**Primary Stack**: Ollama (`codellama:7b-instruct`), Qdrant Vector DB, FastAPI (Python 3.12), BAAI/bge-small-en-v1.5, Docker & Docker Compose  
**File Location**: `C:\Users\SHREY\Desktop\idt\MASTER_PLAN.md`

---

## 📁 Repository Directory Structure

```text
idt/
├── project.txt                     # Original lab instructions
├── MASTER_PLAN.md                  # This master plan
├── dataset/                        # Synthesized API Knowledge Base
│   ├── payments_v2.yaml
│   ├── customers_v1.yaml
│   ├── subscriptions_v1.yaml
│   ├── auth_and_security.md
│   └── error_dictionary.json
├── dataset_generator.py            # Automated script to generate dataset files
├── exercise_1/                     # Basic LLM App
│   ├── main.py
│   ├── ollama_client.py
│   ├── requirements.txt
│   └── templates/
│       └── index.html
├── exercise_2/                     # Knowledge Base & Vector Ingestion
│   ├── chunker.py
│   ├── ingest.py
│   └── requirements.txt
├── exercise_3/                     # Retrieval & RAG Comparison
│   ├── main.py
│   ├── rag_engine.py
│   ├── test_comparison.py
│   └── templates/
│       └── index.html
├── exercise_4/                     # Decoupled Microservices
│   ├── run_all_services.sh
│   └── services/
│       ├── ui_service/
│       │   ├── main.py
│       │   └── templates/index.html
│       ├── orchestrator_service/
│       │   └── main.py
│       └── rag_service/
│           └── main.py
└── exercise_5/                     # Dockerized Microservices Environment
    ├── docker-compose.yml
    ├── .env
    ├── verify_stack.sh
    └── services/
        ├── ui_service/
        │   ├── Dockerfile
        │   ├── main.py
        │   ├── requirements.txt
        │   └── templates/index.html
        ├── orchestrator_service/
        │   ├── Dockerfile
        │   ├── main.py
        │   └── requirements.txt
        └── rag_service/
            ├── Dockerfile
            ├── main.py
            ├── ingest_on_start.py
            └── requirements.txt
```

---

## 🛠️ Global System Prerequisites Setup (Ubuntu 24.04 LTS)

Run these commands once on the Ubuntu VM:

```bash
# 1. Update system & install dependencies
sudo apt-get update && sudo apt-get install -y python3-pip python3-venv curl git docker.io docker-compose-v2

# 2. Start and enable Docker
sudo systemctl enable --now docker
sudo usermod -aG docker $USER

# 3. Install and start Ollama natively
curl -fsSL https://ollama.com/install.sh | sh
OLLAMA_HOST=0.0.0.0:11434 ollama serve &

# 4. Pull Code Llama model
ollama pull codellama:7b-instruct
```

---

## 🤖 Step-by-Step Agentic Implementation Tasks

### 📊 Dataset Generation Step (`dataset_generator.py`)
Agent must create `dataset_generator.py` and run it to produce all OpenAPI specs and markdown documentation.

```python
# dataset_generator.py snippet
import os

os.makedirs("dataset", exist_ok=True)

payments_yaml = """
openapi: 3.0.3
info:
  title: Enterprise Payments API
  version: 2.1.0
paths:
  /v2/payments/charge:
    post:
      summary: Create a card charge
      description: Requires Idempotency-Key header and Bearer Auth token.
      parameters:
        - in: header
          name: Idempotency-Key
          required: true
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [amount, currency, customer_id]
              properties:
                amount:
                  type: integer
                  description: Amount in cents (e.g. 1000 = $10.00)
                currency:
                  type: string
                  example: usd
                customer_id:
                  type: string
                  example: cus_89210
  /v2/payments/refund:
    post:
      summary: Issue a payment refund
      parameters:
        - in: header
          name: Idempotency-Key
          required: true
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [charge_id, amount]
              properties:
                charge_id:
                  type: string
                amount:
                  type: integer
                reason:
                  type: string
                  enum: [duplicate, fraudulent, requested_by_customer]
"""

with open("dataset/payments_v2.yaml", "w") as f:
    f.write(payments_yaml)

print("Dataset generated successfully in ./dataset/")
```

---

### 📍 EXERCISE 1: Basic LLM Application

#### Goal
Build a single FastAPI web application communicating with host Ollama (`codellama:7b-instruct`).

#### Step-by-Step Execution:
1. Create `exercise_1/ollama_client.py`:
   ```python
   import requests

   class OllamaClient:
       def __init__(self, host="http://localhost:11434", model="codellama:7b-instruct"):
           self.host = host
           self.model = model

       def generate_sdk_code(self, user_prompt: str) -> str:
           url = f"{self.host}/api/chat"
           payload = {
               "model": self.model,
               "messages": [
                   {"role": "system", "content": "You are an expert SDK Code Generator."},
                   {"role": "user", "content": user_prompt}
               ],
               "stream": False
           }
           resp = requests.post(url, json=payload, timeout=120)
           resp.raise_for_status()
           return resp.json()["message"]["content"]
   ```

2. Create `exercise_1/main.py`:
   ```python
   from fastapi import FastAPI, Request, Form
   from fastapi.responses import HTMLResponse
   from fastapi.templating import Jinja2Templates
   from ollama_client import OllamaClient

   app = FastAPI(title="Exercise 1 - Basic LLM App")
   templates = Jinja2Templates(directory="templates")
   ollama = OllamaClient()

   @app.get("/", response_class=HTMLResponse)
   async def home(request: Request):
       return templates.TemplateResponse("index.html", {"request": request, "response": None})

   @app.post("/generate", response_class=HTMLResponse)
   async def generate(request: Request, prompt: str = Form(...)):
       output = ollama.generate_sdk_code(prompt)
       return templates.TemplateResponse("index.html", {"request": request, "prompt": prompt, "response": output})
   ```

3. **Validation Command**:
   ```bash
   cd exercise_1
   python3 -m venv venv && source venv/bin/activate
   pip install fastapi uvicorn requests jinja2
   uvicorn main:app --port 8000 &
   curl -X POST "http://localhost:8000/generate" -d "prompt=Write a python HTTP request to refund a payment"
   ```

---

### 📍 EXERCISE 2: Knowledge Base & Vector Representation

#### Goal
Set up Qdrant Vector DB container, implement semantic OpenAPI chunking, embed chunks with `BAAI/bge-small-en-v1.5`, and store vectors in Qdrant.

#### Step-by-Step Execution:
1. Launch Qdrant Container:
   ```bash
   docker run -d -p 6333:6333 --name qdrant-ex2 qdrant/qdrant:latest
   ```

2. Create `exercise_2/chunker.py`:
   ```python
   import yaml, json, glob

   def chunk_openapi_spec(file_path: str):
       chunks = []
       with open(file_path, 'r') as f:
           if file_path.endswith('.yaml') or file_path.endswith('.yml'):
               data = yaml.safe_load(f)
           else:
               data = json.load(f)
       
       title = data.get('info', {}).get('title', 'API Spec')
       paths = data.get('paths', {})
       
       for path, methods in paths.items():
           for method, details in methods.items():
               chunk_text = f"API Spec: {title}\nEndpoint: {method.upper()} {path}\n"
               chunk_text += f"Summary: {details.get('summary', '')}\n"
               chunk_text += f"Description: {details.get('description', '')}\n"
               chunk_text += f"Parameters: {json.dumps(details.get('parameters', []))}\n"
               chunk_text += f"RequestBody: {json.dumps(details.get('requestBody', {}))}\n"
               chunks.append({
                   "text": chunk_text,
                   "source": file_path,
                   "endpoint": path,
                   "method": method.upper()
               })
       return chunks
   ```

3. Create `exercise_2/ingest.py`:
   ```python
   from sentence_transformers import SentenceTransformer
   from qdrant_client import QdrantClient
   from qdrant_client.models import VectorParams, Distance, PointStruct
   from chunker import chunk_openapi_spec
   import glob, uuid

   encoder = SentenceTransformer('BAAI/bge-small-en-v1.5')
   client = QdrantClient(host="localhost", port=6333)

   client.recreate_collection(
       collection_name="api_docs",
       vectors_config=VectorParams(size=384, distance=Distance.COSINE)
   )

   points = []
   for spec_file in glob.glob("../dataset/*.yaml") + glob.glob("../dataset/*.json"):
       chunks = chunk_openapi_spec(spec_file)
       for c in chunks:
           vector = encoder.encode(c["text"]).tolist()
           points.append(PointStruct(
               id=str(uuid.uuid4()),
               vector=vector,
               payload={"text": c["text"], "source": c["source"], "endpoint": c["endpoint"]}
           ))

   client.upsert(collection_name="api_docs", points=points)
   print(f"Successfully ingested {len(points)} API chunks into Qdrant!")
   ```

4. **Validation Command**:
   ```bash
   cd exercise_2
   pip install qdrant-client sentence-transformers pyyaml
   python3 ingest.py
   curl http://localhost:6333/collections/api_docs
   ```

---

### 📍 EXERCISE 3: Vector Similarity & RAG Implementation

#### Goal
Implement query embedding and vector search. Compare Code Llama outputs **with RAG** vs **without RAG**.

#### Step-by-Step Execution:
1. Create `exercise_3/rag_engine.py`:
   ```python
   from sentence_transformers import SentenceTransformer
   from qdrant_client import QdrantClient

   class RAGEngine:
       def __init__(self, qdrant_host="localhost", qdrant_port=6333):
           self.encoder = SentenceTransformer('BAAI/bge-small-en-v1.5')
           self.client = QdrantClient(host=qdrant_host, port=qdrant_port)

       def retrieve_context(self, query: str, top_k=3) -> str:
           query_vector = self.encoder.encode(query).tolist()
           results = self.client.search(
               collection_name="api_docs",
               query_vector=query_vector,
               limit=top_k
           )
           contexts = [hit.payload["text"] for hit in results]
           return "\n---\n".join(contexts)
   ```

2. Create RAG-augmented prompt construction in `exercise_3/main.py`:
   ```python
   def generate_with_rag(user_query: str):
       context = rag.retrieve_context(user_query)
       augmented_prompt = f"""Use the following API documentation snippets to answer the request accurately.

CONTEXT:
{context}

USER REQUEST:
{user_query}

REQUIREMENT: Generate exact code using the endpoints, headers, and payload schemas specified in the CONTEXT."""
       return ollama.generate_sdk_code(augmented_prompt)
   ```

3. **Validation Test Script (`exercise_3/test_comparison.py`)**:
   - Compare output for *"How to refund a charge?"*
   - Verify non-RAG uses generic Stripe SDK while RAG uses `POST /v2/payments/refund` with `Idempotency-Key` header.

---

### 📍 EXERCISE 4: APIs, Services & Orchestration

#### Goal
Refactor into 4 distinct microservices communicating over REST API calls.

#### Service Port Mapping:
- `qdrant-db`: `:6333`
- `rag-service`: `:8002` (Endpoints: `/health`, `/retrieve`)
- `orchestrator-service`: `:8001` (Endpoint: `/api/v1/generate-sdk`)
- `ui-service`: `:8000` (Web UI Dashboard)

#### Execution Script (`exercise_4/run_all_services.sh`):
```bash
#!/bin/bash
echo "Starting all microservices..."
uvicorn services.rag_service.main:app --port 8002 &
uvicorn services.orchestrator_service.main:app --port 8001 &
uvicorn services.ui_service.main:app --port 8000 &
echo "All microservices online!"
```

---

### 📍 EXERCISE 5: Dockerize the Application Stack

#### Goal
Containerize all microservices and orchestrate via `docker-compose`.

#### `exercise_5/docker-compose.yml`:
```yaml
version: '3.8'

services:
  qdrant-db:
    image: qdrant/qdrant:latest
    container_name: apicopilot-qdrant
    ports:
      - "6333:6333"
    volumes:
      - qdrant_storage:/qdrant/storage
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:6333/healthz"]
      interval: 5s
      timeout: 5s
      retries: 5

  rag-service:
    build: ./services/rag_service
    container_name: apicopilot-rag
    ports:
      - "8002:8002"
    environment:
      - QDRANT_HOST=qdrant-db
      - QDRANT_PORT=6333
    depends_on:
      qdrant-db:
        condition: service_healthy

  orchestrator-service:
    build: ./services/orchestrator_service
    container_name: apicopilot-orchestrator
    ports:
      - "8001:8001"
    environment:
      - RAG_SERVICE_URL=http://rag-service:8002
      - OLLAMA_HOST=http://host.docker.internal:11434
      - LLM_MODEL=codellama:7b-instruct
    extra_hosts:
      - "host.docker.internal:host-gateway"
    depends_on:
      - rag-service

  ui-service:
    build: ./services/ui_service
    container_name: apicopilot-ui
    ports:
      - "8000:8000"
    environment:
      - ORCHESTRATOR_URL=http://orchestrator-service:8001
    depends_on:
      - orchestrator-service

volumes:
  qdrant_storage:
```

#### Final End-to-End Verification Command:
```bash
cd exercise_5
docker-compose up --build -d
docker-compose ps
curl http://localhost:8000/health
```

---

## Summary Checklist for Automated Execution

| Exercise | Key Deliverable | Empirical Validation Method |
| :--- | :--- | :--- |
| **Dataset** | Synthetic OpenAPI & Markdown Specs | Check non-empty `dataset/*.yaml` files |
| **Ex 1** | Basic LLM FastAPI App | `curl -X POST http://localhost:8000/generate` returns Code Llama text |
| **Ex 2** | Qdrant Ingestion Pipeline | `curl http://localhost:6333/collections/api_docs` returns status `green` |
| **Ex 3** | RAG vs Non-RAG Comparison | Verify presence of `Idempotency-Key` & `/v2/payments/refund` in RAG output |
| **Ex 4** | 4-Service API Orchestration | HTTP 200 from `ui-service` -> `orchestrator` -> `rag-service` chain |
| **Ex 5** | Docker Compose Stack | `docker-compose ps` shows 4 healthy running containers |
