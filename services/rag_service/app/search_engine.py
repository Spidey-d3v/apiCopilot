import os
import uuid
import numpy as np
import httpx
from rank_bm25 import BM25Okapi
import chromadb
from sentence_transformers import SentenceTransformer, CrossEncoder
from typing import List, Dict, Any, Optional

from .config import (
    CHROMA_DB_DIR, 
    INGESTION_SERVICE_URL,
    EMBEDDING_MODEL, 
    CROSS_ENCODER_MODEL, 
    DEFAULT_COLLECTION_NAME
)

class SearchEngine:
    def __init__(self):
        self.encoder = None
        self.cross_encoder = None
        self.bm25 = None
        self.docs_texts = []
        self.docs_metas = []
        self.collection = None
        self.ready = False
        
        self._init_chroma()

    def _init_chroma(self):
        try:
            self.chroma_client = chromadb.PersistentClient(path=str(CHROMA_DB_DIR))
            self.collection = self.chroma_client.get_or_create_collection(name=DEFAULT_COLLECTION_NAME)
        except Exception as e:
            print(f"Warning: Could not initialize Chroma DB at {CHROMA_DB_DIR}: {e}")

    def load_bm25(self):
        if not self.collection:
            return None, [], []
        try:
            all_docs = self.collection.get()
            texts = all_docs.get('documents', [])
            metas = all_docs.get('metadatas', [])
            if not texts:
                return None, [], []
            tokenized_corpus = [doc.lower().split(" ") for doc in texts]
            return BM25Okapi(tokenized_corpus), texts, metas
        except Exception as e:
            print(f"Error loading BM25 index: {e}")
            return None, [], []

    def initialize_models_and_data(self):
        """Loads neural models and auto-syncs with Ingestion Service if empty."""
        try:
            print(f"RAG Service: Loading Embedding Model ({EMBEDDING_MODEL})...")
            self.encoder = SentenceTransformer(EMBEDDING_MODEL)
            
            print(f"RAG Service: Loading Cross-Encoder ({CROSS_ENCODER_MODEL})...")
            self.cross_encoder = CrossEncoder(CROSS_ENCODER_MODEL)
            
            self.bm25, self.docs_texts, self.docs_metas = self.load_bm25()
            
            # Check if database needs seeding from Ingestion Service
            if self.collection and self.collection.count() == 0:
                print("RAG Service: ChromaDB is empty. Syncing with Ingestion Service...")
                self.sync_with_ingestion_service()
            else:
                count = self.collection.count() if self.collection else 0
                print(f"RAG Service: ChromaDB initialized with {count} chunks.")
                
            self.ready = True
            print("RAG Service: Ready.")
        except Exception as e:
            print(f"RAG Service Initialization Failed: {e}")

    def sync_with_ingestion_service(self):
        """Calls Ingestion Service to retrieve all parsed dataset chunks and embeds them."""
        try:
            with httpx.Client(timeout=30.0) as client:
                resp = client.post(f"{INGESTION_SERVICE_URL}/api/parse-dataset")
                if resp.status_code == 200:
                    data = resp.json()
                    chunks = data.get("chunks", [])
                    if chunks:
                        self.ingest_chunks(chunks)
                        print(f"RAG Service: Successfully synced {len(chunks)} chunks from Ingestion Service.")
                else:
                    print(f"Ingestion service responded with status {resp.status_code}")
        except Exception as e:
            print(f"Could not connect to Ingestion Service at {INGESTION_SERVICE_URL}: {e}")

    def ingest_chunks(self, chunks: List[Dict[str, Any]]) -> int:
        """Ingests structured chunks into ChromaDB with dense embeddings and rebuilds BM25 index."""
        if not chunks or not self.collection:
            return 0

        texts = [c["text"] for c in chunks]
        metas = [{
            "source": c.get("source", "unknown"),
            "api_title": c.get("api_title", "API"),
            "endpoint": c.get("endpoint", ""),
            "hash": c.get("hash", "")
        } for c in chunks]
        ids = [str(uuid.uuid4()) for _ in chunks]

        # Generate dense embeddings
        embeddings = self.encoder.encode(texts).tolist() if self.encoder else None

        if embeddings:
            self.collection.add(
                documents=texts,
                metadatas=metas,
                ids=ids,
                embeddings=embeddings
            )
        else:
            self.collection.add(
                documents=texts,
                metadatas=metas,
                ids=ids
            )

        self.bm25, self.docs_texts, self.docs_metas = self.load_bm25()
        return len(chunks)

    def search(self, query: str, top_k: int = 5) -> Dict[str, Any]:
        """Executes Hybrid Lexical (BM25) + Dense Vector + MS-Marco Cross-Encoder Re-ranking."""
        # 1. BM25 Lexical Search
        bm25_results = []
        bm25_candidates = []
        if self.bm25 and self.docs_texts:
            tokens = query.lower().split(" ")
            scores = self.bm25.get_scores(tokens)
            if len(scores) > 0:
                top_indices = np.argsort(scores)[::-1][:min(top_k * 2, len(scores))]
                for i, idx in enumerate(top_indices[:top_k]):
                    if scores[idx] > 0.0:
                        bm25_results.append({
                            "rank": i + 1,
                            "score": f"BM25: {scores[idx]:.2f}",
                            "text": self.docs_texts[idx]
                        })
                for idx in top_indices:
                    if scores[idx] > 0.0:
                        bm25_candidates.append(self.docs_texts[idx])
        
        if not bm25_results:
            bm25_results.append({"rank": 1, "score": "N/A", "text": "No exact keyword matches found."})

        # 2. Dense Vector Proximity Search
        dense_results = []
        dense_candidates = []
        if self.encoder and self.collection and self.collection.count() > 0:
            query_vector = self.encoder.encode(query).tolist()
            k = min(top_k * 2, self.collection.count())
            raw = self.collection.query(query_embeddings=[query_vector], n_results=k)
            
            if raw['documents'] and len(raw['documents'][0]) > 0:
                docs = raw['documents'][0]
                dists = raw['distances'][0] if 'distances' in raw and raw['distances'] else [0.0]*len(docs)
                for i in range(min(top_k, len(docs))):
                    dense_results.append({
                        "rank": i + 1,
                        "score": f"L2 Dist: {dists[i]:.4f}",
                        "text": docs[i]
                    })
                dense_candidates = docs
        
        if not dense_results:
            dense_results.append({"rank": 1, "score": "N/A", "text": "Dense vector model loading or DB empty."})

        # 3. Candidate Fusion & Cross-Encoder Deep Attention Re-Ranking
        # Combine unique candidates from BM25 and Dense vector searches
        candidate_pool = list(dict.fromkeys(bm25_candidates + dense_candidates))
        if not candidate_pool and self.docs_texts:
            candidate_pool = self.docs_texts[:min(top_k * 2, len(self.docs_texts))]

        cross_results = []
        if self.cross_encoder and candidate_pool:
            pairs = [[query, doc] for doc in candidate_pool]
            raw_scores = self.cross_encoder.predict(pairs)
            ranked = sorted(zip(raw_scores, candidate_pool), reverse=True)
            for i, (score, doc) in enumerate(ranked[:top_k]):
                cross_results.append({
                    "rank": i + 1,
                    "score": f"Logit: {float(score):.4f}",
                    "text": doc
                })
        else:
            cross_results.append({"rank": 1, "score": "N/A", "text": "Cross-Encoder model loading or candidate pool empty."})

        return {
            "bm25": bm25_results,
            "dense": dense_results,
            "cross_encoder": cross_results,
            "candidate_count": len(candidate_pool)
        }
