import requests
import json
import time

def test_crop_disease_api():
    """Test the crop disease detection API"""
    url = "http://localhost:8000/predict"
    
    # Open the test image
    with open("test_plant.jpg", "rb") as image_file:
        files = {"file": ("test_plant.jpg", image_file, "image/jpeg")}
        
        print("Sending image to crop disease detection API...")
        response = requests.post(url, files=files)
        
        if response.status_code == 200:
            result = response.json()
            print("✅ SUCCESS: Crop disease detection completed!")
            print(json.dumps(result, indent=2))
        else:
            print(f"❌ ERROR: {response.status_code} - {response.text}")

if __name__ == "__main__":
    test_crop_disease_api()