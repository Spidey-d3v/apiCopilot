#!/bin/bash
docker-compose ps
echo "Testing UI Health..."
curl http://localhost:8000/health
echo "\nStack verified."
