from sentence_transformers import SentenceTransformer
from qdrant_client import QdrantClient
from qdrant_client.models import VectorParams, Distance, PointStruct
from chunker import chunk_openapi_spec
import glob, uuid

encoder = SentenceTransformer('BAAI/bge-small-en-v1.5')
client = QdrantClient(host="localhost", port=6333)

client.recreate_collection(
    collection_name="api_docs",
    vectors_config=VectorParams(size=384, distance=Distance.COSINE)
)

points = []
for spec_file in glob.glob("../dataset/*.yaml") + glob.glob("../dataset/*.json"):
    chunks = chunk_openapi_spec(spec_file)
    for c in chunks:
        vector = encoder.encode(c["text"]).tolist()
        points.append(PointStruct(
            id=str(uuid.uuid4()),
            vector=vector,
            payload={"text": c["text"], "source": c["source"], "endpoint": c["endpoint"]}
        ))

client.upsert(collection_name="api_docs", points=points)
print(f"Successfully ingested {len(points)} API chunks into Qdrant!")
