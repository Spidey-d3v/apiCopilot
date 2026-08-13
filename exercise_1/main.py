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
