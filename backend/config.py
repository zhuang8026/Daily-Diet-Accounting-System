import os

JWT_SECRET = os.environ.get("JWT_SECRET", "fa23de638e3fee2f01d1711c7653a8cfdbe0aca0599e59e0027a17fee0ca120f")
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_HOURS = 24

_extra_origins = os.environ.get("CORS_ORIGINS", "")
CORS_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:4173",
    "https://zhuang8026.github.io",
] + [o.strip() for o in _extra_origins.split(",") if o.strip()]

COOKIE_NAME = "ddas_token"
COOKIE_SECURE = os.environ.get("COOKIE_SECURE", "false").lower() == "true"
COOKIE_SAMESITE = "lax"
COOKIE_MAX_AGE = 60 * 60 * JWT_EXPIRE_HOURS
