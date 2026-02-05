#!/usr/bin/env python3
"""
Minimal test to isolate the numpy compatibility issue
"""

import sys
import traceback

def test_imports():
    """Test which imports work and which don't"""
    print("Testing imports...")
    
    try:
        import numpy as np
        print("✅ NumPy imported successfully")
        
        # Test basic numpy operations
        arr = np.array([1, 2, 3])
        print(f"✅ Basic numpy array: {arr}")
        
    except Exception as e:
        print(f"❌ NumPy import failed: {e}")
        traceback.print_exc()
        return False
    
    try:
        from ultralytics import YOLO
        print("✅ Ultralytics imported successfully")
    except Exception as e:
        print(f"❌ Ultralytics import failed: {e}")
        traceback.print_exc()
        return False
    
    try:
        import tensorflow as tf
        print("✅ TensorFlow imported successfully")
    except Exception as e:
        print(f"❌ TensorFlow import failed: {e}")
        traceback.print_exc()
        return False
    
    return True

def test_basic_operations():
    """Test basic operations that might cause issues"""
    print("\nTesting basic operations...")
    
    try:
        import numpy as np
        import cv2
        from PIL import Image
        
        # Test PIL operations
        img = Image.new('RGB', (100, 100), color='red')
        print("✅ PIL Image creation works")
        
        # Test converting to numpy
        img_array = np.array(img)
        print(f"✅ PIL to numpy conversion works: {img_array.shape}")
        
        # Test OpenCV operations
        bgr_img = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)
        print("✅ OpenCV color conversion works")
        
        return True
        
    except Exception as e:
        print(f"❌ Basic operations failed: {e}")
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("=== NumPy Compatibility Test ===")
    
    if test_imports():
        print("\n✅ All imports successful")
        if test_basic_operations():
            print("\n✅ All basic operations successful")
            print("🎉 System is ready for crop disease detection!")
        else:
            print("\n❌ Basic operations failed")
            sys.exit(1)
    else:
        print("\n❌ Import failures detected")
        sys.exit(1)