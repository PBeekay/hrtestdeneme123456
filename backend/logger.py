"""
Structured logging configuration for the HR Dashboard API
"""

import logging
import sys
from datetime import datetime
from typing import Any

# Custom formatter for better readability
class ColoredFormatter(logging.Formatter):
    """
    Custom formatter with colors for console output
    """
    
    # ANSI color codes
    COLORS = {
        'DEBUG': '\033[36m',    # Cyan
        'INFO': '\033[32m',     # Green
        'WARNING': '\033[33m',  # Yellow
        'ERROR': '\033[31m',    # Red
        'CRITICAL': '\033[35m', # Magenta
        'RESET': '\033[0m'      # Reset
    }
    
    def format(self, record: logging.LogRecord) -> str:
        # Add color to level name
        if record.levelname in self.COLORS:
            record.levelname = f"{self.COLORS[record.levelname]}{record.levelname}{self.COLORS['RESET']}"
        
        return super().format(record)


def setup_logging(log_level: str = "INFO") -> logging.Logger:
    """
    Setup structured logging with file and console handlers
    
    Args:
        log_level: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
    
    Returns:
        Configured logger instance
    """
    # Create logger
    logger = logging.getLogger("hr_dashboard")
    logger.setLevel(getattr(logging, log_level.upper()))
    
    # Prevent duplicate handlers
    if logger.handlers:
        return logger
    
    # Console handler with colors
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.INFO)
    console_formatter = ColoredFormatter(
        fmt='%(asctime)s | %(levelname)s | %(name)s | %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    console_handler.setFormatter(console_formatter)
    
    # File handler for all logs
    file_handler = logging.FileHandler('logs/hr_dashboard.log', encoding='utf-8')
    file_handler.setLevel(logging.DEBUG)
    file_formatter = logging.Formatter(
        fmt='%(asctime)s | %(levelname)-8s | %(name)s | %(funcName)s | %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    file_handler.setFormatter(file_formatter)
    
    # Error file handler (only errors and above)
    error_handler = logging.FileHandler('logs/errors.log', encoding='utf-8')
    error_handler.setLevel(logging.ERROR)
    error_handler.setFormatter(file_formatter)
    
    # Add handlers
    logger.addHandler(console_handler)
    logger.addHandler(file_handler)
    logger.addHandler(error_handler)
    
    return logger


# Create logs directory if it doesn't exist
import os
os.makedirs('logs', exist_ok=True)

# Initialize logger
logger = setup_logging()


# Helper functions for common log patterns
def log_request(endpoint: str, method: str, user: str = "anonymous"):
    """Log incoming API request"""
    logger.info(f"📥 {method} {endpoint} | User: {user}")


def log_response(endpoint: str, status_code: int, duration_ms: float):
    """Log API response"""
    emoji = "✅" if status_code < 400 else "❌"
    logger.info(f"{emoji} {endpoint} | Status: {status_code} | Duration: {duration_ms:.2f}ms")


def log_auth_attempt(username: str, success: bool, ip: str = "unknown"):
    """Log authentication attempt"""
    emoji = "✅" if success else "❌"
    logger.info(f"{emoji} Auth attempt | User: {username} | IP: {ip} | Success: {success}")


def log_db_operation(operation: str, table: str, success: bool, duration_ms: float = 0):
    """Log database operation"""
    emoji = "✅" if success else "❌"
    logger.debug(f"{emoji} DB {operation} | Table: {table} | Duration: {duration_ms:.2f}ms")


def log_error(error: Exception, context: str = ""):
    """Log error with context"""
    logger.error(f"🚨 Error in {context}: {str(error)}", exc_info=True)


# Export for easy import
__all__ = [
    'logger',
    'log_request',
    'log_response',
    'log_auth_attempt',
    'log_db_operation',
    'log_error'
]

