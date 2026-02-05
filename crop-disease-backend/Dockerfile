# Dockerfile for Crop Disease Detection API
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create logs directory
RUN mkdir -p logs

# Expose port
EXPOSE 8000

# Environment variables for CPU optimization
ENV TF_NUM_INTEROP_THREADS=2
ENV TF_NUM_INTRAOP_THREADS=2
ENV TORCH_NUM_THREADS=2
ENV PYTHONUNBUFFERED=1

# Run the application
CMD ["python", "main.py"]