from fastapi import FastAPI, Request, Response
from fastapi.responses import StreamingResponse
import uvicorn, request, Response
import os
import subprocess
import requests
import signal
import atexit
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()
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

@app.before_first_request
def initialize():
    start_node_server()

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>', methods=['GET', 'POST'])
def proxy(path):
    url = f'http://localhost:3000/{path}'

    try:
        if request.method == 'POST':
            resp = requests.post(url, json=request.get_json(), headers=request.headers)
        else:
            resp = requests.get(url, headers=request.headers)

        excluded_headers = ['content-encoding', 'content-length', 'transfer-encoding', 'connection']
        headers = [(name, value) for (name, value) in resp.raw.headers.items()
                  if name.lower() not in excluded_headers]

        return Response(resp.content, resp.status_code, headers)
    except requests.exceptions.ConnectionError:
        return "Service temporarily unavailable", 503

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
