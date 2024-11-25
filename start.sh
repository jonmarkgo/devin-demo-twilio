#!/bin/bash
node index.js &
python3 -m uvicorn app.main:app --host 0.0.0.0 --port $PORT
