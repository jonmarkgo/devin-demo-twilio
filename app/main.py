from fastapi import FastAPI, Request, Response, HTTPException
from fastapi.responses import JSONResponse
import os
import subprocess
import httpx
import signal
import atexit
from dotenv import load_dotenv
import asyncio
from typing import Optional
import logging
import sys

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

app = FastAPI(title="CVS Customer Service Demo")
node_process = None

def start_node_server():
    global node_process
    try:
        env = os.environ.copy()
        env['TWILIO_ACCOUNT_SID'] = os.getenv('TWILIO_SID')
        env['TWILIO_AUTH_TOKEN'] = os.getenv('TWILIO_SECRET')
        env['PORT'] = '3000'

        # Get the absolute path to the project root
        project_root = os.path.dirname(os.path.dirname(__file__))
        logger.info(f"Starting Node.js server in directory: {project_root}")

        # Check if we're in production (Fly.io)
        if os.getenv('FLY_APP_NAME'):
            logger.info("Running in production environment")
            # In production, we'll use a different port for Node.js
            env['PORT'] = '3001'
            # Ensure Node.js only listens on localhost
            env['HOST'] = 'localhost'

        node_process = subprocess.Popen(
            ['node', 'index.js'],
            cwd=project_root,
            env=env,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )

        # Log subprocess output
        async def log_output(stream, level):
            while True:
                line = await asyncio.get_event_loop().run_in_executor(None, stream.readline)
                if not line:
                    break
                logger.log(level, line.decode().strip())

        asyncio.create_task(log_output(node_process.stdout, logging.INFO))
        asyncio.create_task(log_output(node_process.stderr, logging.ERROR))

        return True
    except Exception as e:
        logger.error(f"Failed to start Node.js server: {str(e)}")
        return False

def cleanup():
    if node_process:
        try:
            logger.info("Cleaning up Node.js process...")
            node_process.terminate()
            node_process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            logger.warning("Node.js process did not terminate, forcing kill...")
            node_process.kill()
        except Exception as e:
            logger.error(f"Error during cleanup: {str(e)}")

atexit.register(cleanup)
signal.signal(signal.SIGTERM, lambda *args: cleanup())

@app.on_event("startup")
async def startup_event():
    logger.info("Starting FastAPI application...")
    if not start_node_server():
        logger.error("Failed to start Node.js server, but continuing...")
    await asyncio.sleep(2)  # Wait for Node.js server to initialize

@app.on_event("shutdown")
async def shutdown_event():
    cleanup()

@app.get("/health")
async def health_check():
    try:
        # Check if Node.js server is running
        if node_process and node_process.poll() is None:
            node_status = "running"
        else:
            node_status = "not running"
            # Try to restart Node.js server if it's not running
            if start_node_server():
                node_status = "restarted"

        return {
            "status": "healthy",
            "node_server": node_status,
            "environment": "production" if os.getenv('FLY_APP_NAME') else "development"
        }
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"status": "unhealthy", "error": str(e)}
        )

@app.api_route("/{path:path}", methods=["GET", "POST"])
async def proxy(request: Request, path: str):
    # Determine Node.js server port
    node_port = "3001" if os.getenv('FLY_APP_NAME') else "3000"

    async with httpx.AsyncClient() as client:
        try:
            url = f"http://localhost:{node_port}/{path}"
            method = request.method
            headers = dict(request.headers)

            if method == "POST":
                body = await request.body()
                response = await client.post(url, content=body, headers=headers)
            else:
                response = await client.get(url, headers=headers)

            return Response(
                content=response.content,
                status_code=response.status_code,
                headers=dict(response.headers)
            )
        except httpx.ConnectError:
            logger.error(f"Failed to connect to Node.js server at {url}")
            raise HTTPException(status_code=503, detail="Service temporarily unavailable")
        except Exception as e:
            logger.error(f"Error proxying request: {str(e)}")
            raise HTTPException(status_code=500, detail="Internal server error")

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
