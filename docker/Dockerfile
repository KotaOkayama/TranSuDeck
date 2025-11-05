FROM python:3.11-slim

WORKDIR /app

# Install system dependencies including make
RUN apt-get update && apt-get install -y \
    make \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt requirements-dev.txt ./
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install --no-cache-dir -r requirements-dev.txt

# Copy application code
COPY app/ ./app/
COPY tests/ ./tests/
COPY pytest.ini ./
COPY Makefile ./

# Create necessary directories
RUN mkdir -p /app/config /app/outputs /app/logs

# ポート8001を公開
EXPOSE 8001

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001"]
