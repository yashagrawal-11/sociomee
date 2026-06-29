"""
crypto_utils.py — Encrypt/decrypt sensitive values (OAuth tokens) at rest.
Backward-compatible: decrypt() safely passes through legacy plaintext values
that were stored before encryption was added, so nothing breaks during transition.
"""
import os
from cryptography.fernet import Fernet, InvalidToken

_key = os.getenv("TOKEN_ENCRYPTION_KEY", "")
_fernet = Fernet(_key.encode()) if _key else None

def encrypt(value: str) -> str:
    if not value or not _fernet:
        return value
    return _fernet.encrypt(value.encode()).decode()

def decrypt(value: str) -> str:
    if not value or not _fernet:
        return value
    try:
        return _fernet.decrypt(value.encode()).decode()
    except Exception:
        # Not a valid encrypted token (legacy plaintext, or any other
        # decode failure) — safely treat as plaintext and return as-is.
        return value
