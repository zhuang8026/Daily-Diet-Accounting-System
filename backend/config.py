JWT_SECRET = "ddas-dev-secret-key-change-in-production"
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_HOURS = 24
CORS_ORIGINS = ["http://localhost:5173", "http://localhost:4173"]

COOKIE_NAME = "ddas_token"
COOKIE_SECURE = False       # Set True in production (requires HTTPS)
COOKIE_SAMESITE = "lax"
COOKIE_MAX_AGE = 60 * 60 * JWT_EXPIRE_HOURS  # seconds (24h)
