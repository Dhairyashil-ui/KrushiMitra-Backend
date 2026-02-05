"""
Crop Disease Detection API
Hybrid two-stage AI pipeline using YOLOv8 + MobileNetV3
"""

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional
import uvicorn
import logging
import os

from src.models.model_manager import ModelManager
from src.inference.pipeline import DiseaseDetectionPipeline
from src.utils.validators import ImageValidator
from src.utils.logger import setup_logger
from src.utils.cpu_optimizer import cpu_engine

# Setup logging
logger = setup_logger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Crop Disease Detection API",
    description="Production-ready crop disease detection using hybrid AI pipeline",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global model manager
model_manager: Optional[ModelManager] = None
pipeline: Optional[DiseaseDetectionPipeline] = None

class PredictionResponse(BaseModel):
    """Standard response format for predictions"""
    crop: str
    disease: str
    severity: str
    confidence: float
    advice: str
    bbox: dict  # Bounding box coordinates

@app.on_event("startup")
async def startup_event():
    """Initialize models on startup"""
    global model_manager, pipeline
    
    try:
        logger.info("Starting crop disease detection service...")
        
        # Initialize CPU optimization
        cpu_engine.create_thread_pool(max_workers=2)
        
        # Log system information
        system_info = cpu_engine.get_system_info()
        logger.info(f"System info: {system_info}")
        
        # Initialize model manager
        model_manager = ModelManager()
        await model_manager.initialize_models()
        
        # Warm up models
        cpu_engine.warmup_models(model_manager)
        
        # Initialize pipeline
        pipeline = DiseaseDetectionPipeline(model_manager)
        
        logger.info("Crop disease detection service initialized successfully!")
        
    except Exception as e:
        logger.error(f"Failed to initialize service: {str(e)}")
        raise

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "Crop Disease Detection API",
        "version": "1.0.0"
    }

@app.get("/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "models_loaded": model_manager is not None and model_manager.is_ready(),
        "timestamp": __import__('datetime').datetime.utcnow().isoformat()
    }

@app.post("/predict", response_model=PredictionResponse)
async def predict_disease(file: UploadFile = File(...)):
    """
    Predict crop disease from uploaded image
    
    Args:
        file: Uploaded image file (JPEG/PNG)
        
    Returns:
        PredictionResponse: Disease prediction with confidence and advice
    """
    try:
        # Validate image
        validator = ImageValidator()
        is_valid, error_msg = validator.validate_image(file)
        
        if not is_valid:
            raise HTTPException(status_code=400, detail=error_msg)
        
        # Process image
        image_bytes = await file.read()
        
        # Run inference pipeline
        result = await pipeline.process_image(image_bytes)
        
        logger.info(f"Disease detected: {result['disease']} (confidence: {result['confidence']})")
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Prediction failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler"""
    logger.error(f"Unhandled exception: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.environ.get("PORT", 8000)),
        workers=1,  # Single worker for CPU optimization
        log_level="info"
    )