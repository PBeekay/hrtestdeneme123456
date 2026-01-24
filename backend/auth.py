"""
Authentication utilities for JWT token management
"""

import os
import jwt
from jwt.exceptions import ExpiredSignatureError, DecodeError, InvalidTokenError
from datetime import datetime, timedelta
from typing import Optional, Dict
from dotenv import load_dotenv

load_dotenv()

# JWT Configuration
# JWT Configuration
SECRET_KEY = os.getenv('SECRET_KEY')
if not SECRET_KEY:
    raise ValueError("❌ SECRET_KEY missing! Please check .env file.")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30


def create_access_token(data: Dict[str, str]) -> str:
    """
    Create a JWT access token with expiration
    
    Args:
        data: Dictionary containing user information (username, role, etc.)
    
    Returns:
        Encoded JWT token string
    """
    to_encode = data.copy()
    
    # Add expiration time
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({
        "exp": expire,
        "iat": datetime.utcnow(),  # Issued at
        "type": "access"
    })
    
    # Encode JWT
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def verify_token(token: str) -> Optional[Dict]:
    """
    Verify and decode a JWT token
    
    Args:
        token: JWT token string
    
    Returns:
        Decoded token payload if valid, None if invalid/expired
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except ExpiredSignatureError:
        # Token has expired
        print("⚠️ Token has expired")
        return None
    except (DecodeError, InvalidTokenError) as e:
        # Invalid token format or signature
        print(f"⚠️ Invalid token: {e}")
        return None
    except Exception as e:
        # Catch any other JWT-related errors
        print(f"⚠️ Token verification error: {e}")
        return None


def get_token_expiry(token: str) -> Optional[datetime]:
    """
    Verilen JWT token'ın sona erme zamanını döndürür.
    
    Args:
        token: JWT token string
    
    Returns:
        Geçerli ise token'ın bitiş zamanı (datetime), geçersizse None
    """
    payload = verify_token(token)
    if payload and "exp" in payload:
        return datetime.fromtimestamp(payload["exp"])
    return None


def is_token_expired(token: str) -> bool:
    """
    Verilen JWT token'ın süresinin dolup dolmadığını kontrol eder.
    
    Args:
        token: JWT token string
    
    Returns:
        Süresi dolmuş veya geçersizse True, halen geçerliyse False
    """
    expiry = get_token_expiry(token)
    if expiry is None:
        return True
    return datetime.utcnow() > expiry

