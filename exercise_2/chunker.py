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
