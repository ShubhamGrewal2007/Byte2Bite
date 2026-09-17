"""
Byte2Bite Backend — password hashing and verification.

This module was migrated from passlib to pwdlib.

Rationale:
- passlib 1.7.4 (last release 2020) does not work on Python 3.13+ and
  has a known incompatibility with bcrypt 4.1.0+ that causes:
      ValueError: password cannot be longer than 72 bytes
- pwdlib is the actively maintained successor, uses Argon2 as the
  primary algorithm, and can still verify existing bcrypt hashes.

Public API is preserved:
    hash_password(plain_password) -> str
    verify_password(plain_password, password_hash) -> bool
"""

from pwdlib import PasswordHash
from pwdlib.hashers.argon2 import Argon2Hasher
from pwdlib.hashers.bcrypt import BcryptHasher

# ---------------------------------------------------------------------------
# Hasher configuration
# ---------------------------------------------------------------------------
# Argon2 is the primary hasher for all newly created passwords.
# Bcrypt is kept as a fallback so hashes that already exist in the
# database (created by the previous passlib/bcrypt setup) remain
# verifiable. PasswordHash.verify() identifies the algorithm from the
# hash prefix, so both formats are handled transparently.
# ---------------------------------------------------------------------------

password_hash = PasswordHash(
    (
        Argon2Hasher(),
        BcryptHasher(),
    )
)


def hash_password(plain_password: str) -> str:
    """
    Hash a plaintext password using the recommended hasher (Argon2).

    Returns the encoded hash string, including algorithm identifier
    and salt, suitable for storage in the database.
    """
    return password_hash.hash(plain_password)


def verify_password(plain_password: str, password_hash_value: str) -> bool:
    """
    Verify a plaintext password against a stored hash.

    Supports both Argon2 hashes (created by this module) and legacy
    bcrypt hashes (created before the migration). Returns True if the
    password matches, False otherwise.
    """
    return password_hash.verify(plain_password, password_hash_value)


def verify_and_update(
    plain_password: str, password_hash_value: str
) -> tuple[bool, str | None]:
    """
    Verify a password and, if the stored hash uses an outdated
    algorithm or parameters, return a new hash.

    Returns:
        (True, new_hash)  if the password is valid and the hash was upgraded
        (True, None)      if the password is valid and the hash is current
        (False, None)     if the password is invalid

    Callers that perform authentication should store new_hash back to
    the database when it is not None. This is the recommended pattern
    for gradual migration from bcrypt to Argon2.
    """
    return password_hash.verify_and_update(plain_password, password_hash_value)
