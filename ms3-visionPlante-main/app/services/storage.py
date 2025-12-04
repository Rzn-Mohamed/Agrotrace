from minio import Minio
from minio.error import S3Error
import io
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

class MinioService:
    def __init__(self):
        self.client = Minio(
            settings.MINIO_ENDPOINT,
            access_key=settings.MINIO_ACCESS_KEY,
            secret_key=settings.MINIO_SECRET_KEY,
            secure=settings.MINIO_SECURE
        )
        self._ensure_buckets()

    def _ensure_buckets(self):
        try:
            for bucket in [settings.MINIO_BUCKET_IMAGES, settings.MINIO_BUCKET_RESULTS]:
                if not self.client.bucket_exists(bucket):
                    self.client.make_bucket(bucket)
                    logger.info(f"Created bucket: {bucket}")
        except S3Error as e:
            logger.error(f"Error checking/creating buckets: {e}")

    def upload_file(self, bucket_name: str, object_name: str, data: bytes, content_type: str = "application/octet-stream"):
        try:
            self.client.put_object(
                bucket_name,
                object_name,
                io.BytesIO(data),
                len(data),
                content_type=content_type
            )
            return f"{bucket_name}/{object_name}"
        except S3Error as e:
            logger.error(f"Error uploading file: {e}")
            raise

    def download_file(self, bucket_name: str, object_name: str) -> bytes:
        try:
            response = self.client.get_object(bucket_name, object_name)
            return response.read()
        except S3Error as e:
            logger.error(f"Error downloading file: {e}")
            raise
        finally:
            if 'response' in locals():
                response.close()
                
    def get_file_url(self, bucket_name: str, object_name: str):
        return self.client.presigned_get_object(bucket_name, object_name)

minio_service = MinioService()
