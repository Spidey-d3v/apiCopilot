import sys
import os

# Add exercise_1 to path to import ollama_client
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'exercise_1')))

from fastapi import FastAPI, Request, Form
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from rag_engine import RAGEngine
from ollama_client import OllamaClient

app = FastAPI(title="Exercise 3 - RAG Comparison")
templates = Jinja2Templates(directory="templates")
ollama = OllamaClient()
rag = RAGEngine()

def generate_with_rag(user_query: str):
    context = rag.retrieve_context(user_query)
    augmented_prompt = f"""Use the following API documentation snippets to answer the request accurately.

CONTEXT:
{context}

USER REQUEST:
{user_query}

REQUIREMENT: Generate exact code using the endpoints, headers, and payload schemas specified in the CONTEXT."""
    return ollama.generate_sdk_code(augmented_prompt)

@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    return templates.TemplateResponse("index.html", {"request": request, "response_rag": None, "response_norag": None})

@app.post("/generate", response_class=HTMLResponse)
async def generate(request: Request, prompt: str = Form(...)):
    output_norag = ollama.generate_sdk_code(prompt)
    output_rag = generate_with_rag(prompt)
    return templates.TemplateResponse("index.html", {"request": request, "prompt": prompt, "response_rag": output_rag, "response_norag": output_norag})
