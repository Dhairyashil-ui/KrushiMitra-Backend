"""
Image validation and preprocessing utilities
"""

import logging
from typing import Tuple
from fastapi import UploadFile
from PIL import Image
import io

logger = logging.getLogger(__name__)

class ImageValidator:
    """Validates uploaded images for the crop disease detection API"""
    
    def __init__(self):
        # Supported image formats
        self.allowed_formats = {'JPEG', 'PNG', 'JPG'}
        
        # Size limits (in bytes)
        self.max_file_size = 10 * 1024 * 1024  # 10MB
        self.min_file_size = 1024  # 1KB
        
        # Dimension limits
        self.min_width = 100
        self.min_height = 100
        self.max_width = 4000
        self.max_height = 4000
    
    def validate_image(self, file: UploadFile) -> Tuple[bool, str]:
        """
        Validate uploaded image file
        
        Args:
            file: FastAPI UploadFile object
            
        Returns:
            Tuple[bool, str]: (is_valid, error_message)
        """
        try:
            # Check filename
            if not file.filename:
                return False, "No file uploaded"
            
            # Check file extension
            if not self._check_file_extension(file.filename):
                return False, f"Unsupported file format. Supported formats: {', '.join(self.allowed_formats)}"
            
            # Check content type
            if not self._check_content_type(file.content_type):
                return False, "Invalid content type"
            
            # Check file size
            file_size = len(file.file.read())
            file.file.seek(0)  # Reset file pointer
            
            if file_size < self.min_file_size:
                return False, f"File too small. Minimum size: {self.min_file_size} bytes"
            
            if file_size > self.max_file_size:
                return False, f"File too large. Maximum size: {self.max_file_size / (1024*1024):.1f} MB"
            
            # Validate image content
            is_valid_image, error_msg = self._validate_image_content(file)
            if not is_valid_image:
                return False, error_msg
            
            return True, ""
            
        except Exception as e:
            logger.error(f"Image validation failed: {str(e)}")
            return False, f"Validation error: {str(e)}"
    
    def _check_file_extension(self, filename: str) -> bool:
        """Check if file extension is supported"""
        if not filename:
            return False
        
        extension = filename.lower().split('.')[-1]
        return extension.upper() in self.allowed_formats
    
    def _check_content_type(self, content_type: str) -> bool:
        """Check if content type is supported"""
        if not content_type:
            # If content type is not provided, we'll check the file extension later
            return True
        
        supported_types = {
            'image/jpeg',
            'image/jpg', 
            'image/png'
        }
        
        # Allow any content type that starts with 'image/'
        if content_type.lower().startswith('image/'):
            return True
            
        return content_type.lower() in supported_types
    
    def _validate_image_content(self, file: UploadFile) -> Tuple[bool, str]:
        """Validate actual image content and dimensions"""
        try:
            # Read image content
            image_bytes = file.file.read()
            file.file.seek(0)  # Reset file pointer
            
            # Try to open as PIL Image
            image = Image.open(io.BytesIO(image_bytes))
            
            # Check dimensions
            width, height = image.size
            
            if width < self.min_width or height < self.min_height:
                return False, f"Image too small. Minimum dimensions: {self.min_width}x{self.min_height} pixels"
            
            if width > self.max_width or height > self.max_height:
                return False, f"Image too large. Maximum dimensions: {self.max_width}x{self.max_height} pixels"
            
            # Check if image is not corrupted
            image.verify()
            image.close()
            
            # Reopen for further checks
            image = Image.open(io.BytesIO(image_bytes))
            if image.format not in self.allowed_formats:
                image.close()
                return False, "Image format not supported after verification"
            
            image.close()
            return True, ""
            
        except Exception as e:
            return False, f"Invalid or corrupted image: {str(e)}"
    
    def get_image_info(self, file: UploadFile) -> dict:
        """Get basic information about the uploaded image"""
        try:
            image_bytes = file.file.read()
            file.file.seek(0)
            
            image = Image.open(io.BytesIO(image_bytes))
            width, height = image.size
            format_name = image.format
            mode = image.mode
            
            image.close()
            
            return {
                "width": width,
                "height": height,
                "format": format_name,
                "mode": mode,
                "size_bytes": len(image_bytes)
            }
            
        except Exception as e:
            logger.error(f"Failed to get image info: {str(e)}")
            return {}