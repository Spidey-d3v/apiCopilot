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
