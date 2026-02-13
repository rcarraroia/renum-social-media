import logging
import sys
from app.config import settings

def setup_logger():
    """
    Configura logger global
    """
    logger = logging.getLogger("renum")
    level = getattr(logging, settings.log_level.upper(), logging.INFO)
    logger.setLevel(level)
    
    # Avoid duplicate handlers
    if not logger.handlers:
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setLevel(level)
        formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
        console_handler.setFormatter(formatter)
        logger.addHandler(console_handler)
    return logger

def get_logger(name: str):
    return logging.getLogger(f"renum.{name}")