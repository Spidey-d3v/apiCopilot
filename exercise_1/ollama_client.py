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
