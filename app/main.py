from fastapi import FastAPI, Request, Response
from fastapi.responses import StreamingResponse
import os
import subprocess
import httpx
import signal
import atexit
from dotenv import load_dotenv
import asyncio
from typing import Optional

load_dotenv()

app = FastAPI(title="CVS Customer Service Demo")
node_process = None

def start_node_server():
    global node_process
    env = os.environ.copy()
    env['TWILIO_ACCOUNT_SID'] = os.getenv('TWILIO_SID')
    env['TWILIO_AUTH_TOKEN'] = os.getenv('TWILIO_SECRET')
    env['PORT'] = '3000'
    node_process = subprocess.Popen(['node', 'index.js'],
                                  stdout=subprocess.PIPE,
                                  stderr=subprocess.PIPE,
                                  env=env)

def cleanup():
    if node_process:
        node_process.terminate()
        try:
            node_process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            node_process.kill()

atexit.register(cleanup)
signal.signal(signal.SIGTERM, lambda *args: cleanup())

@app.on_event("startup")
async def startup_event():
    start_node_server()
    # Wait for Node.js server to start
    await asyncio.sleep(2)

@app.api_route("/{path:path}", methods=["GET", "POST"])
async def proxy(request: Request, path: str):
    client = httpx.AsyncClient()
    url = f"http://localhost:3000/{path}"

    try:
        method = request.method
        headers = dict(request.headers)
        body = await request.body() if method == "POST" else None

        if method == "POST":
            response = await client.post(url, content=body, headers=headers)
        else:
            response = await client.get(url, headers=headers)

        return Response(
            content=response.content,
            status_code=response.status_code,
            headers=dict(response.headers)
        )
    except httpx.ConnectError:
        return Response(content="Service temporarily unavailable", status_code=503)
    finally:
        await client.aclose()

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 5000))
    uvicorn.run(app, host="0.0.0.0", port=port)
