"""
Byte2Bite Backend — password hashing and verification.

Uses pwdlib with Argon2 for new passwords and keeps bcrypt
support for existing passwords.

Public API:
    hash_password(plain_password) -> str
    verify_password(plain_password, password_hash) -> bool
"""

from pwdlib import PasswordHash
from pwdlib.hashers.argon2 import Argon2Hasher
from pwdlib.hashers.bcrypt import BcryptHasher


# Argon2 is used for new passwords.
# Bcrypt remains available for verifying existing hashes.
_password_hash = PasswordHash(
    (
        Argon2Hasher(),
        BcryptHasher(),
    )
)


def hash_password(plain_password: str) -> str:
    """Hash a plaintext password using Argon2."""
    return _password_hash.hash(plain_password)


def verify_password(
    plain_password: str,
    password_hash: str,
) -> bool:
    """Verify a plaintext password against a stored hash."""
    return _password_hash.verify(
        plain_password,
        password_hash,
    )


def verify_and_update(
    plain_password: str,
    password_hash: str,
) -> tuple[bool, str | None]:
    """
    Verify a password and optionally return an upgraded hash.

    Returns:
        (True, new_hash) if the password is valid and should be upgraded
        (True, None) if the password is valid and already current
        (False, None) if the password is invalid
    """
    return _password_hash.verify_and_update(
        plain_password,
        password_hash,
    )
