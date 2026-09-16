"""
Byte2Bite authentication package (Task 2B).

Exposes router + reusable dependencies for role-based authorization.
"""

from .router import router  # noqa: F401
from .dependencies import (  # noqa: F401
    get_current_user,
    require_role,
    require_admin,
    oauth2_scheme,
)

__all__ = [
    "router",
    "get_current_user",
    "require_role",
    "require_admin",
    "oauth2_scheme",
]
