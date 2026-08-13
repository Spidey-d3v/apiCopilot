from fastapi import FastAPI
from sentence_transformers import SentenceTransformer
from qdrant_client import QdrantClient
import os

app = FastAPI(title="RAG Service")

QDRANT_HOST = os.getenv("QDRANT_HOST", "localhost")
QDRANT_PORT = int(os.getenv("QDRANT_PORT", "6333"))

encoder = SentenceTransformer('BAAI/bge-small-en-v1.5')
client = QdrantClient(host=QDRANT_HOST, port=QDRANT_PORT)

@app.get("/health")
def health():
    return {"status": "healthy"}

@app.get("/retrieve")
def retrieve(query: str, top_k: int = 3):
    query_vector = encoder.encode(query).tolist()
    try:
        results = client.search(
            collection_name="api_docs",
            query_vector=query_vector,
            limit=top_k
        )
        contexts = [hit.payload["text"] for hit in results]
        return {"context": "\n---\n".join(contexts)}
    except Exception as e:
        return {"context": ""}
