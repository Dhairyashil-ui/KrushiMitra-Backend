"""
CPU Optimization and Performance Tuning Configuration
"""

import os
import tensorflow as tf
import logging
from concurrent.futures import ThreadPoolExecutor

logger = logging.getLogger(__name__)

class CPUEngine:
    """CPU optimization engine for inference performance"""
    
    def __init__(self):
        self.thread_pool = None
        self._configure_tensorflow()
        self._configure_ultralytics()
    
    def _configure_tensorflow(self):
        """Configure TensorFlow for CPU optimization"""
        try:
            # Set TensorFlow CPU threads
            cpu_threads = int(os.environ.get('TF_NUM_INTEROP_THREADS', '2'))
            intra_threads = int(os.environ.get('TF_NUM_INTRAOP_THREADS', '2'))
            
            tf.config.threading.set_inter_op_parallelism_threads(cpu_threads)
            tf.config.threading.set_intra_op_parallelism_threads(intra_threads)
            
            # Enable memory growth to avoid OOM
            gpus = tf.config.experimental.list_physical_devices('GPU')
            if gpus:
                # Configure GPU memory growth
                for gpu in gpus:
                    tf.config.experimental.set_memory_growth(gpu, True)
            
            # CPU optimizations
            tf.config.optimizer.set_jit(True)  # Enable XLA JIT compilation
            
            logger.info(f"TensorFlow configured with {cpu_threads} inter-op threads, {intra_threads} intra-op threads")
            
        except Exception as e:
            logger.warning(f"TensorFlow CPU optimization failed: {str(e)}")
    
    def _configure_ultralytics(self):
        """Configure Ultralytics for CPU optimization"""
        try:
            import torch
            
            # Set number of CPU threads for PyTorch (used by Ultralytics)
            torch.set_num_threads(int(os.environ.get('TORCH_NUM_THREADS', '2')))
            
            # Disable gradient computation for inference
            torch.set_grad_enabled(False)
            
            logger.info("Ultralytics configured for CPU inference")
            
        except Exception as e:
            logger.warning(f"Ultralytics CPU optimization failed: {str(e)}")
    
    def create_thread_pool(self, max_workers: int = 4):
        """Create thread pool for concurrent processing"""
        if self.thread_pool is None:
            self.thread_pool = ThreadPoolExecutor(max_workers=max_workers)
            logger.info(f"Thread pool created with {max_workers} workers")
        return self.thread_pool
    
    def warmup_models(self, model_manager):
        """Warm up models with dummy inference to load weights into memory"""
        try:
            logger.info("Warming up models...")
            
            # Skip actual warmup due to numpy compatibility issues
            # The models will be loaded lazily when first used
            logger.info("Model warmup skipped due to compatibility issues")
            
        except Exception as e:
            logger.warning(f"Model warmup failed: {str(e)}")
    
    def get_system_info(self) -> dict:
        """Get system information for monitoring"""
        import psutil
        import platform
        
        try:
            cpu_percent = psutil.cpu_percent(interval=1)
            memory = psutil.virtual_memory()
            
            return {
                "cpu_percent": cpu_percent,
                "memory_percent": memory.percent,
                "memory_available_gb": round(memory.available / (1024**3), 2),
                "platform": platform.platform(),
                "python_version": platform.python_version()
            }
        except Exception as e:
            logger.error(f"Failed to get system info: {str(e)}")
            return {}

# Global CPU engine instance
cpu_engine = CPUEngine()