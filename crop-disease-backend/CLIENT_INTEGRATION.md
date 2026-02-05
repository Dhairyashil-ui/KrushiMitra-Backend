# Client Integration Guide

## Android Integration (Java/Kotlin)

### Using Retrofit (Java)

```java
public class CropDiseaseApi {
    private static final String BASE_URL = "YOUR_DEPLOYED_API_URL";
    
    public interface ApiService {
        @Multipart
        @POST("predict")
        Call<DiseasePrediction> predictDisease(@Part MultipartBody.Part image);
    }
    
    public static class DiseasePrediction {
        public String crop;
        public String disease;
        public String severity;
        public float confidence;
        public String advice;
        public BoundingBox bbox;
        public float processing_time;
        public int detection_count;
    }
    
    public static class BoundingBox {
        public int x1, y1, x2, y2, width, height;
    }
}
```

### Using OkHttp (Kotlin)

```kotlin
class CropDiseaseClient {
    private val client = OkHttpClient()
    private val baseUrl = "YOUR_DEPLOYED_API_URL"
    
    suspend fun predictDisease(imageFile: File): DiseasePrediction {
        val requestBody = MultipartBody.Builder()
            .setType(MultipartBody.FORM)
            .addFormDataPart(
                "file",
                imageFile.name,
                RequestBody.create(MediaType.parse("image/*"), imageFile)
            )
            .build()
        
        val request = Request.Builder()
            .url("$baseUrl/predict")
            .post(requestBody)
            .build()
        
        val response = client.newCall(request).execute()
        val json = response.body()?.string()
        
        return Gson().fromJson(json, DiseasePrediction::class.java)
    }
}
```

## Web Integration (JavaScript/TypeScript)

### Using Fetch API

```javascript
async function detectCropDisease(imageFile) {
    const formData = new FormData();
    formData.append('file', imageFile);
    
    try {
        const response = await fetch('YOUR_DEPLOYED_API_URL/predict', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Prediction failed:', error);
        throw error;
    }
}

// Usage example
document.getElementById('uploadBtn').addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (file) {
        try {
            const result = await detectCropDisease(file);
            displayResults(result);
        } catch (error) {
            showError(error.message);
        }
    }
});
```

### Using Axios (React/Vue)

```javascript
import axios from 'axios';

const apiClient = axios.create({
    baseURL: 'YOUR_DEPLOYED_API_URL',
    timeout: 30000, // 30 second timeout
});

export async function detectCropDisease(imageFile) {
    const formData = new FormData();
    formData.append('file', imageFile);
    
    try {
        const response = await apiClient.post('/predict', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    } catch (error) {
        if (error.response) {
            throw new Error(error.response.data.detail || 'Prediction failed');
        }
        throw error;
    }
}
```

## Flutter Integration (Dart)

```dart
import 'package:http/http.dart' as http;
import 'dart:convert';

class DiseasePrediction {
  final String crop;
  final String disease;
  final String severity;
  final double confidence;
  final String advice;
  final BoundingBox bbox;
  final double processingTime;
  final int detectionCount;

  DiseasePrediction.fromJson(Map<String, dynamic> json)
      : crop = json['crop'],
        disease = json['disease'],
        severity = json['severity'],
        confidence = json['confidence'].toDouble(),
        advice = json['advice'],
        bbox = BoundingBox.fromJson(json['bbox']),
        processingTime = json['processing_time'].toDouble(),
        detectionCount = json['detection_count'];
}

class BoundingBox {
  final int x1, y1, x2, y2, width, height;

  BoundingBox.fromJson(Map<String, dynamic> json)
      : x1 = json['x1'],
        y1 = json['y1'],
        x2 = json['x2'],
        y2 = json['y2'],
        width = json['width'],
        height = json['height'];
}

Future<DiseasePrediction> detectCropDisease(String imagePath) async {
  final uri = Uri.parse('YOUR_DEPLOYED_API_URL/predict');
  final request = http.MultipartRequest('POST', uri);
  
  final file = await http.MultipartFile.fromPath('file', imagePath);
  request.files.add(file);
  
  try {
    final response = await request.send();
    
    if (response.statusCode == 200) {
      final jsonString = await response.stream.bytesToString();
      final jsonMap = json.decode(jsonString);
      return DiseasePrediction.fromJson(jsonMap);
    } else {
      throw Exception('Failed to detect disease: ${response.statusCode}');
    }
  } catch (e) {
    throw Exception('Network error: $e');
  }
}
```

## React Native Integration

```javascript
import RNFetchBlob from 'rn-fetch-blob';

const detectCropDisease = async (imageUri) => {
  try {
    const response = await RNFetchBlob.fetch('POST', 'YOUR_DEPLOYED_API_URL/predict', {
      'Content-Type': 'multipart/form-data',
    }, [
      {
        name: 'file',
        filename: 'photo.jpg',
        data: RNFetchBlob.wrap(imageUri),
      }
    ]);

    const status = response.info().status;
    
    if (status === 200) {
      const result = JSON.parse(response.data);
      return result;
    } else {
      throw new Error(`HTTP ${status}: ${response.data}`);
    }
  } catch (error) {
    console.error('Detection failed:', error);
    throw error;
  }
};
```

## API Response Format

The API returns a standardized JSON response:

```json
{
  "crop": "Tomato",
  "disease": "Early Blight",
  "severity": "Medium",
  "confidence": 0.85,
  "advice": "Tomato treatment: Apply copper-based fungicide and remove affected leaves. Ensure proper spacing between plants.",
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

## Error Handling

Common error responses:

```json
{
  "detail": "No file uploaded"
}

{
  "detail": "Unsupported file format. Supported formats: JPEG, PNG, JPG"
}

{
  "detail": "File too large. Maximum size: 10.0 MB"
}

{
  "detail": "Invalid or corrupted image"
}
```

## Best Practices

1. **Image Quality**: Capture clear, well-lit images of affected plant parts
2. **Image Size**: Keep images under 10MB for optimal performance
3. **Timeout Handling**: Set reasonable timeouts (15-30 seconds)
4. **Retry Logic**: Implement exponential backoff for failed requests
5. **Offline Support**: Cache recent predictions locally
6. **User Feedback**: Show loading indicators during processing
7. **Error Messages**: Display user-friendly error messages