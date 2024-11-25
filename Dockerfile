FROM node:20-slim

# Install Python and required system dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy Node.js application files
COPY package*.json ./
RUN npm install

# Copy Python application files
COPY requirements.txt ./
RUN pip3 install -r requirements.txt

# Copy application code
COPY . .

# Set environment variables
ENV PORT=8080
ENV NODE_PORT=3000

# Start both servers using a shell script
COPY <<EOF start.sh
#!/bin/bash
node index.js &
python3 -m uvicorn app.main:app --host 0.0.0.0 --port \$PORT
EOF

RUN chmod +x start.sh
CMD ["./start.sh"]
