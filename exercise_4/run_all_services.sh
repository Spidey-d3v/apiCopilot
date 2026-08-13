#!/bin/bash
echo "Starting all microservices..."
uvicorn services.rag_service.main:app --port 8002 &
uvicorn services.orchestrator_service.main:app --port 8001 &
uvicorn services.ui_service.main:app --port 8000 &
echo "All microservices online!"
