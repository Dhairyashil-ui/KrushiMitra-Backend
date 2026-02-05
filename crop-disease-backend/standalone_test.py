#!/usr/bin/env python3
"""
Standalone test of the crop disease detection API
"""

import requests
import json
import time
from pathlib import Path

def test_standalone_api():
    """Test the API with a direct request"""
    print("🧪 Testing Standalone API...")
    
    # Initialize timing variables outside try block to avoid undefined variable issues
    start_time = time.time()
    
    try:
        # Create a simple test image
        from PIL import Image
        import io
        
        # Create test image
        test_image = Image.new('RGB', (224, 224), color='green')
        img_buffer = io.BytesIO()
        test_image.save(img_buffer, format='JPEG')
        img_buffer.seek(0)
        
        # Make prediction request
        files = {'file': ('test_image.jpg', img_buffer, 'image/jpeg')}
        response = requests.post('http://localhost:8000/predict', files=files)
        
        processing_time = time.time() - start_time
        
        if response.status_code == 200:
            result = response.json()
            print("✅ API Test: SUCCESS")
            print(f"   Processing time: {processing_time:.2f}s")
            print(f"   Result: {result['disease']} ({result['confidence']:.2f} confidence)")
            print(f"   Advice: {result['advice']}")
            print(f"   Crop: {result['crop']}")
            print(f"   Severity: {result['severity']}")
            return True
        else:
            print(f"❌ API Test: FAILED")
            print(f"   Status Code: {response.status_code}")
            print(f"   Error: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ API Test failed: {str(e)}")
        return False

def test_health_endpoints():
    """Test health endpoints"""
    print("🧪 Testing Health Endpoints...")
    
    try:
        # Test root endpoint
        response = requests.get("http://localhost:8000/")
        assert response.status_code == 200
        print("✅ Root endpoint: OK")
        
        # Test health endpoint
        response = requests.get("http://localhost:8000/health")
        assert response.status_code == 200
        health_data = response.json()
        assert health_data["status"] == "healthy"
        print("✅ Health endpoint: OK")
        print(f"   Models loaded: {health_data['models_loaded']}")
        
        return True
    except Exception as e:
        print(f"❌ Health test failed: {str(e)}")
        return False

def main():
    """Run standalone tests"""
    print("🔬 Starting Standalone Tests for Crop Disease Detection API")
    print("=" * 60)
    
    tests_passed = 0
    total_tests = 2
    
    # Test 1: Health endpoints
    if test_health_endpoints():
        tests_passed += 1
    
    # Test 2: API prediction
    if test_standalone_api():
        tests_passed += 1
    
    # Summary
    print("\n" + "=" * 60)
    print(f"📊 Test Results: {tests_passed}/{total_tests} tests passed")
    
    if tests_passed == total_tests:
        print("🎉 All tests passed! API is working correctly.")
    else:
        print("⚠️  Some tests failed. Check the errors above.")

if __name__ == "__main__":
    main()