# ==============================================================================
# GARUDA A.S.T.R.A — FastAPI Backend Dockerfile
# Optimized for Python 3.11, OpenCV, PyTorch, and AsyncPG
# ==============================================================================

FROM python:3.11-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app

WORKDIR /app

# Install system dependencies for OpenCV and PostgreSQL
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY services/requirements.txt ./services/
RUN pip install --no-cache-dir --upgrade pip setuptools wheel && \
    pip install --no-cache-dir -r services/requirements.txt

# Copy application source code
COPY database ./database
COPY services ./services
COPY core_config.py ./

# Create uploads storage directories
RUN mkdir -p services/backend/uploads/crops \
             services/backend/uploads/footage \
             services/backend/uploads/reference

EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:8000/health/live || exit 1

CMD ["sh", "-c", "python3 -m alembic -c database/alembic.ini upgrade head && python3 -m uvicorn services.backend.main:app --host 0.0.0.0 --port 8000 --workers 2"]
