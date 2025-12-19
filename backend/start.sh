#!/usr/bin/env bash

# Always run from backend dir
cd "$(dirname "$0")"

# Run uvicorn using venv python
exec ./venv/bin/python -m uvicorn main:app \
  --host 0.0.0.0 \
  --port 8000
