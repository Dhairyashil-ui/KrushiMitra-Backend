# 🌾 Crop Disease Detection API

Production-ready crop disease detection system using a hybrid two-stage AI pipeline for agriculture applications.

## 🏗️ Architecture

**Two-Stage Hybrid Pipeline:**
1. **Stage 1**: Object Detection using YOLOv8-nano (detects plant/leaf regions)
2. **Stage 2**: Disease Classification using MobileNetV3 (identifies specific diseases)

## 🚀 Features

- ✅ **Image-based inference** - Farmers upload or capture images
- ✅ **CPU-optimized** - Runs efficiently on free-tier hosting
- ✅ **Pre-trained models only** - No retraining required
- ✅ **Multilingual support** - Ready for localization
- ✅ **Comprehensive validation** - Robust image processing
- ✅ **Production-ready** - Built for real-world deployment
- ✅ **Free deployment** - Works on Hugging Face Spaces, Render, etc.

## 📊 Technical Stack

- **Framework**: FastAPI (Python 3.9+)
- **Object Detection**: YOLOv8-nano (pretrained COCO weights)
- **Classification**: MobileNetV3 (pretrained ImageNet weights)
- **Image Processing**: OpenCV, Pillow
- **Deployment**: Docker, Hugging Face Spaces, Render

## 📁 Project Structure

```
crop-disease-backend/
├── main.py                 # FastAPI application entry point
├── requirements.txt        # Python dependencies
├── Dockerfile             # Docker configuration
├── render.yaml           # Render.com deployment config
├── space_config.json     # Hugging Face Spaces config
├── CLIENT_INTEGRATION.md # Client integration guide
└── src/
    ├── models/
    │   └── model_manager.py    # Model loading and management
    ├── inference/
    │   └── pipeline.py         # Two-stage inference pipeline
    └── utils/
        ├── validators.py       # Image validation
        ├── logger.py          # Logging configuration
        └── cpu_optimizer.py   # CPU performance tuning
```

## 🛠️ Quick Start

### Local Development

1. **Clone and setup:**
```bash
git clone <repository-url>
cd crop-disease-backend
pip install -r requirements.txt
```

2. **Run the server:**
```bash
python main.py
```

3. **Access the API:**
- API Docs: `http://localhost:8000/docs`
- Health Check: `http://localhost:8000/health`
- Prediction Endpoint: `http://localhost:8000/predict`

### API Usage Example

```bash
curl -X POST "http://localhost:8000/predict" \
  -H "accept: application/json" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@path/to/plant_image.jpg"
```

## 🌐 Deployment Options

### Option 1: Hugging Face Spaces (Recommended)

1. Create a new Space on [Hugging Face](https://huggingface.co/spaces)
2. Upload all files from this repository
3. Set Space SDK to "Docker"
4. The space will automatically build and deploy

### Option 2: Render.com

1. Fork this repository to GitHub
2. Create new Web Service on Render
3. Connect your GitHub repository
4. Render will automatically deploy using `render.yaml`

### Option 3: Google Colab (Temporary)

Create a notebook with:
```python
# Install dependencies
!pip install fastapi uvicorn ultralytics tensorflow-cpu pillow python-multipart

# Download and run the application
# [Your deployment code here]
```

## 📱 Client Integration

See [CLIENT_INTEGRATION.md](CLIENT_INTEGRATION.md) for detailed integration guides for:
- Android (Java/Kotlin)
- iOS (Swift)
- Web (JavaScript/TypeScript)
- React Native
- Flutter

### Example JavaScript Integration

```javascript
async function detectCropDisease(imageFile) {
    const formData = new FormData();
    formData.append('file', imageFile);
    
    const response = await fetch('YOUR_API_URL/predict', {
        method: 'POST',
        body: formData
    });
    
    return await response.json();
}
```

## 📊 API Response Format

```json
{
  "crop": "Tomato",
  "disease": "Early Blight",
  "severity": "Medium",
  "confidence": 0.85,
  "advice": "Tomato treatment: Apply copper-based fungicide and remove affected leaves.",
  "bbox": {
    "x1": 120,
    "y1": 80,
    "x2": 380,
    "y2": 290,
    "width": 260,
    "height": 210
  },
  "processing_time": 2.34,
  "detection_count": 1
}
```

## ⚙️ Environment Variables

```bash
TF_NUM_INTEROP_THREADS=2    # TensorFlow inter-op threads
TF_NUM_INTRAOP_THREADS=2    # TensorFlow intra-op threads
TORCH_NUM_THREADS=2         # PyTorch threads
PORT=8000                   # Server port
```

## 📈 Performance Optimization

- **CPU Threading**: Configured for optimal CPU utilization
- **Model Warmup**: Automatic model warming on startup
- **Memory Management**: Efficient memory allocation
- **Batch Processing**: Single-threaded for consistency

Expected performance on free-tier hosting:
- **Processing Time**: 2-5 seconds per image
- **Memory Usage**: ~2GB RAM
- **Concurrent Requests**: 1-2 simultaneous users

## 🔒 Security & Validation

- Image format validation (JPEG, PNG)
- File size limits (10MB max)
- Dimension validation (100x100 to 4000x4000 pixels)
- Content-type verification
- Comprehensive error handling

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Ultralytics** for YOLOv8 implementation
- **TensorFlow** for MobileNetV3
- **FastAPI** for the web framework
- **OpenCV** for image processing

## 📞 Support

For issues and questions:
- Open an issue on GitHub
- Contact: [your-email@example.com]

---

**Ready to deploy your crop disease detection service!** 🌱