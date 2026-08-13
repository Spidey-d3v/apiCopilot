from fastapi import FastAPI, Request, Form
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
import requests
import os

app = FastAPI(title="UI Service")
templates = Jinja2Templates(directory="templates")
ORCHESTRATOR_URL = os.getenv("ORCHESTRATOR_URL", "http://localhost:8001")

@app.get("/health")
def health():
    return {"status": "healthy"}

@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    return templates.TemplateResponse("index.html", {"request": request, "response": None})

@app.post("/generate", response_class=HTMLResponse)
async def generate(request: Request, prompt: str = Form(...)):
    try:
        resp = requests.post(f"{ORCHESTRATOR_URL}/api/v1/generate-sdk", json={"prompt": prompt})
        resp.raise_for_status()
        output = resp.json().get("code", "")
    except Exception as e:
        output = f"Error: {str(e)}"
    return templates.TemplateResponse("index.html", {"request": request, "prompt": prompt, "response": output})
