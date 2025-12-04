import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "VisionPlante"
    API_V1_STR: str = "/api/v1"
    
    # MinIO Configuration
    MINIO_ENDPOINT: str = os.getenv("MINIO_ENDPOINT", "minio:9000")
    MINIO_ACCESS_KEY: str = os.getenv("MINIO_ACCESS_KEY", "minioadmin")
    MINIO_SECRET_KEY: str = os.getenv("MINIO_SECRET_KEY", "minioadmin")
    MINIO_BUCKET_IMAGES: str = os.getenv("MINIO_BUCKET_IMAGES", "uav-images")
    MINIO_BUCKET_RESULTS: str = os.getenv("MINIO_BUCKET_RESULTS", "vision-results")
    MINIO_SECURE: bool = False

    class Config:
        case_sensitive = True

settings = Settings()
