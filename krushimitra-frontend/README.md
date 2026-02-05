# KrushiMitra - AI-Powered Farming Assistant

KrushiMitra (meaning "Farmers' Friend" in Hindi) is an AI-powered mobile application designed to empower farmers with intelligent agricultural assistance. The app provides personalized advice on crop care, pest management, weather updates, market prices, and government schemes in multiple Indian languages.

## Features

### Multilingual Support
- English
- Hindi
- Malayalam
- Marathi

### Core Functionalities
1. **AI Chat Assistant** - Conversational AI for farming queries
2. **Crop Disease Detection** - Image-based disease identification
3. **Activity Tracking** - Log farming activities and get AI insights
4. **Mandi Prices** - Real-time market price information
5. **Government Schemes** - Information on subsidies and benefits
6. **Farming News** - Latest agricultural updates
7. **Community Forum** - Connect with other farmers
8. **Events Calendar** - Workshops and webinars

## Technology Stack

### Frontend
- React Native with Expo
- TypeScript
- React Navigation
- Native UI components

### Backend
- Node.js with Express
- MongoDB for data storage
- Google Cloud Text-to-Speech for audio responses
- LLaMA 3 for AI assistance

### AI/ML Services
- Computer Vision for crop disease detection
- Natural Language Processing for chat
- Multilingual support with translation capabilities

## Farmer-Friendly AI Implementation

The application uses a specially trained LLaMA 3 model that provides:
- Simple language explanations
- Culturally relevant advice
- Practical, actionable recommendations
- Support for small-scale farming practices

### Training Approach
1. **Persona-based prompting** - The AI adopts a friendly farming expert persona
2. **Context-aware responses** - Personalized advice based on farmer profile
3. **Language-specific guidelines** - Culturally appropriate communication
4. **Practical focus** - Emphasis on low-cost, implementable solutions

For detailed information on training the AI to be farmer-friendly, see [FARMER_FRIENDLY_AI_TRAINING.md](FARMER_FRIENDLY_AI_TRAINING.md).

## Installation

### Environment Setup Paths
For detailed platform-specific environment preparation choose one:
- [CPU Setup Guide](CPU_SETUP.md) – run entirely without a GPU (slower training, full instructions for offline mode)
- [GPU Setup Guide](GPU_SETUP.md) – accelerated training/inference on NVIDIA (CUDA 12.1 / RTX series)

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- MongoDB instance
- Google Cloud service account with Text-to-Speech enabled
- Expo CLI for mobile development
- Ollama with llama3 model

### Backend Setup
```bash
cd backend
npm install
# Set environment variables
# Start the server
npm start
```

### Mobile App Setup
```bash
npm install
# For development
npx expo start
```

## Troubleshooting

If you encounter any issues during setup or runtime, please refer to our [Troubleshooting Guide](TROUBLESHOOTING.md) for common solutions to connectivity and configuration problems.

## API Documentation

The backend provides RESTful APIs for all functionalities:
- Authentication and user management
- Activity tracking
- Market price information
- AI chat interface
- Text-to-speech services

Detailed API documentation can be found in [backend/API_CONTRACT.md](backend/API_CONTRACT.md).

## Contributing

We welcome contributions from the community. Please read our [CONTRIBUTING.md](CONTRIBUTING.md) guide for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

## Contact

For support or queries, please contact the development team at [support@krushimitra.com](mailto:support@krushimitra.com).

## Deployment (Backend + AI Services)

### 1. Prepare Global Python Environment (No Local .venv Committed)
We intentionally do not commit virtual environments. Install system-wide (or use your own venv) with the consolidated `requirements.txt`.

PowerShell (Windows RTX 4070):
```powershell
cd <repo-root>
scripts\setup-global-env.ps1
```

This installs CUDA-enabled PyTorch (cu121) and all required Python packages, then verifies GPU matmul on device 0.

### 2. Node/Backend Install
```powershell
cd backend
npm install
npm run start
```

### 3. Environment Variables
Create a `.env` in `backend/` (not committed):
```
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster/url
GOOGLE_APPLICATION_CREDENTIALS=./gcp-tts-key.json  # or set GOOGLE_TTS_CREDENTIALS with base64 JSON
OPENAI_API_KEY=... (if applicable)
HF_HOME=./.hf_cache
```

**Google Cloud TTS configuration**
- Create a service account with the *Cloud Text-to-Speech API* role enabled.
- Download the JSON key and point `GOOGLE_APPLICATION_CREDENTIALS` to it, or base64-encode the JSON and place it in `GOOGLE_TTS_CREDENTIALS` for containerized deployments.
- Optional tuning: `GOOGLE_TTS_SPEAKING_RATE`, `GOOGLE_TTS_PITCH`, and `GOOGLE_TTS_AUDIO_ENCODING` control the voice profile without code changes.

### 4. Running FastAPI / Python Microservices (If Added)
If you add a FastAPI server (e.g., for model inference):
```powershell
uvicorn server:app --host 0.0.0.0 --port 8000 --reload
```

### 5. Verifying GPU Access
```powershell
python - <<'PY'
import torch;print(torch.__version__, torch.cuda.is_available(), torch.cuda.get_device_name(0))
PY
```
Expected: `True` and `NVIDIA GeForce RTX 4070`.

### 6. YOLO / Ultralytics Training Example
```powershell
 yolo detect train data=your_data.yaml model=yolov8n.pt epochs=50 imgsz=640 device=0
```
Replace `your_data.yaml` with dataset config. Monitor metrics in `runs/detect/`.

### 7. Reproducibility
Keep `requirements.txt` pinned. If you upgrade, document changes in CHANGELOG (to be created) and re-run minimal smoke tests.

## GPU / Accuracy Expectations
Achieving literal 100% accuracy is generally unrealistic for real agricultural datasets (noise, class overlap, lighting variation). Instead, define target metrics:

- Disease detection: mAP@0.5 >= 0.85
- Classification (if any): F1 >= 0.90 on validation
- ASR / TTS quality: Subjective MOS or WER targets

Steps to iterate toward higher performance:
1. Curate balanced, diverse dataset (lighting, angles, stages of crop disease)
2. Apply augmentations (Albumentations) carefully (avoid unrealistic transforms)
3. Track experiments with Weights & Biases (`wandb`) – enabled by `wandb` dependency
4. Use early stopping + LR scheduling in training scripts
5. Perform error analysis on false positives/negatives

If you still require a "100%" style endpoint (e.g. for a unit test), implement a constrained synthetic test dataset where perfection is attainable, separate from real-world evaluation.

## Cleaning Local Development Artifacts
We removed committed virtual environment directories via `.gitignore` additions:
```
.venv/
venv/
*/.venv/
/.venv310/
__pycache__/
```
Run locally to remove large leftover folders (execute from repo root):
```powershell
Remove-Item -Recurse -Force .venv, .venv310, 'krushimitra-mistral-7b/.venv' -ErrorAction SilentlyContinue
```

## Future Improvements
- Add CI pipeline to lint (ESLint, Ruff), test, and build
- Add dataset versioning (DVC or W&B Artifacts)
- Provide a dedicated FastAPI inference microservice

## Inference Microservice (FastAPI)
Path: `python-services/inference/main.py`
Run locally:
```powershell
uvicorn python-services.inference.main:app --reload --port 8000
```
Endpoints:
- `GET /health` – service status
- `POST /predict` – example echo prediction (replace with real model logic)

## Training Script & Metrics Integration
Path: `python-services/training/train.py`
Simulated training produces `backend/training-metrics.json` consumed by backend `GET /training/metrics`.
Run (1 epoch quick test):
```powershell
EPOCHS=1 python python-services/training/train.py
```
Metrics file fields: `epoch`, `map50`, `f1`, `train_loss`, `best_map50`.

### YOLO Training Helper
PowerShell helper script: `scripts/train-yolo.ps1`
Example:
```powershell
scripts\train-yolo.ps1 -Model yolov8n.pt -Data datasets/crop_disease.yaml -Epochs 100 -Img 640 -Device 0 -UpdateMetrics
```
This will:
1. Validate presence of YOLO CLI and dataset yaml
2. Run Ultralytics training
3. (If -UpdateMetrics) parse latest `runs/detect/*/results.csv` via `scripts/update-metrics-from-yolo.py` and refresh `backend/training-metrics.json`


## Dataset Template & Validation
Dataset config: `datasets/crop_disease.yaml` (YOLO format).
Validate structure:
```powershell
python scripts/validate-dataset.py datasets/crop_disease.yaml
```

## Testing
Backend (Jest):
```powershell
cd backend
npm test
```
Python services (Pytest):
```powershell
pytest -q
```

## Continuous Integration (GitHub Actions)
Workflow: `.github/workflows/ci.yml` runs Node + Python tests on pushes/PRs to main/master.

## Docker
Build and run both backend + inference:
```powershell
docker compose build
docker compose up
```
Backend: http://localhost:3000/health
Inference: http://localhost:8000/health

Individual images:
```powershell
docker build -t km-backend -f Dockerfile.backend .
docker build -t km-inference -f Dockerfile.inference .
```

## Metrics Endpoint Usage
After running the training script, query:
```
GET http://localhost:3000/training/metrics
```
If metrics file absent, placeholder values are returned.
