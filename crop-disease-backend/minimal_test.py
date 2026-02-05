#!/usr/bin/env python3
"""
Minimal FastAPI test to isolate the issue
"""

from fastapi import FastAPI, File, UploadFile
from pydantic import BaseModel
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Minimal Test API")

class PredictionResponse(BaseModel):
    crop: str
    disease: str
    confidence: float

@app.get("/")
async def root():
    return {"status": "healthy", "service": "Minimal Test API"}

@app.post("/predict", response_model=PredictionResponse)
async def predict_disease(file: UploadFile = File(...)):
    """Simple prediction endpoint without any complex processing"""
    try:
        # Just read the file without processing
        contents = await file.read()
        logger.info(f"Received file: {file.filename}, size: {len(contents)} bytes")
        
        # Return a simple response
        return {
            "crop": "Tomato",
            "disease": "Healthy",
            "confidence": 0.95
        }
        
    except Exception as e:
        logger.error(f"Prediction failed: {str(e)}")
        raise

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)