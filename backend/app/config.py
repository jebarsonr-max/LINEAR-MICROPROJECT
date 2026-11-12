import os

class Settings:
    APP_NAME: str = "BrightInt API"
    APP_VERSION: str = "2.0.0"
    
    # On Vercel serverless, root filesystem is read-only; use /tmp for SQLite
    _default_db = "sqlite:////tmp/brightint.db" if os.getenv("VERCEL") else "sqlite:///./brightint.db"
    DATABASE_URL: str = os.getenv("DATABASE_URL", _default_db)
    
    MAX_UPLOAD_SIZE_MB: int = int(os.getenv("MAX_UPLOAD_SIZE_MB", "15"))
    MAX_PIXELS: int = int(os.getenv("MAX_PIXELS", "25000000")) # 25 megapixels safe limit
    
    # Allow local ports, configured origins, and all Vercel deployment domains
    CORS_ORIGINS: list = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
        "*"
    ]
    DEFAULT_ALPHA_BG: tuple = (255, 255, 255) # Pure white background for alpha compositing

settings = Settings()
