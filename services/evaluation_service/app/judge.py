import json
import httpx
from typing import List, Tuple
from .config import OLLAMA_URL, JUDGE_MODEL

def score_correctness(
    question: str,
    llm_response: str,
    expected_keywords: List[str],
    scoring_mode: str = "keyword",
    judge_model: str = JUDGE_MODEL,
    current_model: str = ""
) -> Tuple[float, str]:
    """
    Computes correctness score (0.0 to 1.0) and records method used.
    """
    if scoring_mode == "llm":
        # Cannot judge itself with the same model
        if current_model and current_model == judge_model:
            print(f"Judge: Model {current_model} is same as judge model {judge_model}. Falling back to keyword.")
            return _keyword_score(llm_response, expected_keywords), "keyword_fallback"

        try:
            judge_prompt = f"""You are a strict factual evaluator. A developer asked:
QUESTION: {question}

A model responded:
ANSWER: {llm_response}

Expected key facts that should appear in a correct answer:
{json.dumps(expected_keywords)}

Score the answer from 0.0 to 1.0:
- 1.0 = All key facts present, no false information
- 0.5 = Partially correct, some key facts present
- 0.0 = Missing all key facts or answer is factually wrong

Reply ONLY with valid JSON: {{"score": <float 0.0-1.0>, "reason": "<one sentence>"}}"""

            with httpx.Client(timeout=60.0) as client:
                resp = client.post(
                    f"{OLLAMA_URL}/api/generate",
                    json={
                        "model": judge_model,
                        "prompt": judge_prompt,
                        "stream": False,
                        "format": "json"
                    }
                )
                if resp.status_code == 200:
                    data = resp.json()
                    res_text = data.get("response", "").strip()
                    parsed = json.loads(res_text)
                    score = float(parsed.get("score", 0.0))
                    score = max(0.0, min(1.0, score))
                    return round(score, 4), "llm"
        except Exception as e:
            print(f"Judge: LLM evaluation error: {e}. Falling back to keyword scoring.")
            return _keyword_score(llm_response, expected_keywords), "keyword_fallback"

    return _keyword_score(llm_response, expected_keywords), "keyword"

def _keyword_score(llm_response: str, expected_keywords: List[str]) -> float:
    if not expected_keywords:
        return 1.0
    if not llm_response:
        return 0.0

    resp_lower = llm_response.lower()
    matched = sum(1 for kw in expected_keywords if kw.lower() in resp_lower)
    return round(matched / len(expected_keywords), 4)
