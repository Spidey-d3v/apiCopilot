import sys
import os

# Add exercise_1 to path to import ollama_client
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'exercise_1')))

from rag_engine import RAGEngine
from ollama_client import OllamaClient

def run_test():
    ollama = OllamaClient()
    rag = RAGEngine()
    
    query = "How to refund a charge?"
    
    print(f"--- TEST QUERY: {query} ---\n")
    
    print("=== WITHOUT RAG ===")
    out_norag = ollama.generate_sdk_code(query)
    print(out_norag)
    
    print("\n=== WITH RAG ===")
    context = rag.retrieve_context(query)
    augmented_prompt = f"Use the following API documentation snippets to answer the request accurately.\n\nCONTEXT:\n{context}\n\nUSER REQUEST:\n{query}\n\nREQUIREMENT: Generate exact code using the endpoints, headers, and payload schemas specified in the CONTEXT."
    
    out_rag = ollama.generate_sdk_code(augmented_prompt)
    print(out_rag)

if __name__ == "__main__":
    run_test()
