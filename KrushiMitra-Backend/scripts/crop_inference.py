import sys
import json
import os
import argparse
import random

# Suppress YOLO logs
os.environ["YOLO_VERBOSE"] = "False"

try:
    from ultralytics import YOLO
    import cv2
    import numpy as np
except ImportError as e:
    print(json.dumps({"success": False, "error": f"Import Error: {str(e)}"}))
    sys.exit(1)

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("image_path", help="Path to the image file")
    args = parser.parse_args()

    image_path = args.image_path

    if not os.path.exists(image_path):
        print(json.dumps({"success": False, "error": "File not found"}))
        return

    try:
        # ---------------------------------------------------------
        # STEP 4: Leaf/Region Detection (YOLOv8)
        # ---------------------------------------------------------
        # Using a pre-trained model. In a real scenario, this would be a custom trained 'yolov8n-leaf.pt'
        # For this demo, we use standard 'yolov8n.pt' and check for any detection as a proxy for "something found"
        model = YOLO("yolov8n.pt") 
        
        results = model(image_path, verbose=False)
        
        detected_objects = []
        has_leaf_or_plant = False

        # Mocking "Leaf" detection if *any* object is found or just assuming success for the demo
        # In reality, check for class_id corresponding to plant/potted plant
        if len(results) > 0 and len(results[0].boxes) > 0:
            has_leaf_or_plant = True # Simplified for demo
            
            # Creating a mock bounding box result
            for box in results[0].boxes:
                detected_objects.append({
                    "class": int(box.cls),
                    "conf": float(box.conf),
                    "box": box.xywh.tolist()[0]
                })

        # ---------------------------------------------------------
        # STEP 5: Disease Analysis (MobileNet / CNN)
        # ---------------------------------------------------------
        # Since we don't have the trained .h5 model file yet, we simulate the classification logic.
        # This structure is ready to swap in `tf.keras.models.load_model('disease_model.h5')`
        
        # Simulated Disease Classes
        DISEASES = [
            "Healthy",
            "Leaf Blight",
            "Brown Spot",
            "Powdery Mildew",
            "Rust"
        ]
        
        # Random simulation for demonstration (skewed towards Healthy or randomness)
        # In production: img = preprocess(image_path); prediction = disease_model.predict(img)
        predicted_index = random.choices(
            range(len(DISEASES)), 
            weights=[0.4, 0.2, 0.2, 0.1, 0.1], 
            k=1
        )[0]
        
        disease_name = DISEASES[predicted_index]
        confidence = round(random.uniform(0.75, 0.99), 2)

        # ---------------------------------------------------------
        # Output JSON
        # ---------------------------------------------------------
        output = {
            "success": True,
            "leaf_detection": {
                "detected": has_leaf_or_plant,
                "objects": len(detected_objects),
                "model": "YOLOv8n"
            },
            "disease_analysis": {
                "disease": disease_name,
                "confidence": confidence,
                "model": "MobileNetV3 (Simulated)"
            }
        }
        
        print(json.dumps(output))

    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    main()
