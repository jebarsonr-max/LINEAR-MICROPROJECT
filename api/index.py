import sys
import os

# Add backend directory to sys.path so app imports work seamlessly
backend_dir = os.path.join(os.path.dirname(__file__), "..", "backend")
sys.path.insert(0, os.path.abspath(backend_dir))

from app.main import app

# Export app for Vercel ASGI serverless handler
handler = app
