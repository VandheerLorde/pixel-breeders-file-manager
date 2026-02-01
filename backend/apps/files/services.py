# apps/files/services.py
import os
import uuid
import boto3
import logging
from typing import Generator
from pathlib import Path
from django.conf import settings
from django.utils.text import slugify
from botocore.exceptions import ClientError

logger = logging.getLogger(__name__)

class StorageService:
    def __init__(self):
        # We assume USE_MINIO is True if AWS_S3_ENDPOINT_URL is set, or explicit flag.
        self.use_minio = getattr(settings, 'USE_MINIO', False) or bool(getattr(settings, 'AWS_S3_ENDPOINT_URL', None))
        
        if self.use_minio:
            self.bucket_name = settings.AWS_STORAGE_BUCKET_NAME
            self.s3_client = boto3.client(
                's3',
                endpoint_url=settings.AWS_S3_ENDPOINT_URL,
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                region_name=getattr(settings, 'AWS_S3_REGION_NAME', 'us-east-1')
            )
        else:
            self.local_root = Path(settings.MEDIA_ROOT)
            self.local_root.mkdir(parents=True, exist_ok=True)

    def generate_storage_key(self, user_id: int, filename: str) -> str:
        """
        Generate unique storage key: files/{user_id}/{uuid}_{safe_filename}
        """
        name, ext = os.path.splitext(filename)
        # Sanitize filename (basic slugify to remove special chars, keep structure)
        safe_name = slugify(name)
        unique_id = uuid.uuid4().hex
        
        # files/1/a1b2c3d4_my-image.png
        return f"files/{user_id}/{unique_id}_{safe_name}{ext}"

    def upload(self, file_obj, storage_key: str, content_type: str) -> None:
        """Upload file to storage (MinIO or local)"""
        try:
            if self.use_minio:
                # Ensure we are at the start of the file
                file_obj.seek(0)
                self.s3_client.put_object(
                    Bucket=self.bucket_name,
                    Key=storage_key,
                    Body=file_obj,
                    ContentType=content_type
                )
            else:
                full_path = self.local_root / storage_key
                full_path.parent.mkdir(parents=True, exist_ok=True)
                
                with open(full_path, 'wb') as dest:
                    for chunk in file_obj.chunks():
                        dest.write(chunk)
        except Exception as e:
            logger.error(f"Upload failed for key {storage_key}: {e}")
            raise e

    def download_stream(self, storage_key: str) -> Generator[bytes, None, None]:
        """Stream file contents as generator (for large files)"""
        chunk_size = 8192 # 8KB
        
        if self.use_minio:
            try:
                response = self.s3_client.get_object(Bucket=self.bucket_name, Key=storage_key)
                stream = response['Body']
                for chunk in iter(lambda: stream.read(chunk_size), b''):
                    yield chunk
            except ClientError as e:
                logger.error(f"MinIO download error: {e}")
                raise e
        else:
            full_path = self.local_root / storage_key
            if not full_path.exists():
                raise FileNotFoundError(f"File not found: {storage_key}")
            
            with open(full_path, 'rb') as f:
                while True:
                    chunk = f.read(chunk_size)
                    if not chunk:
                        break
                    yield chunk

    def delete(self, storage_key: str) -> None:
        """Permanently delete file from storage"""
        if self.use_minio:
            self.s3_client.delete_object(Bucket=self.bucket_name, Key=storage_key)
        else:
            full_path = self.local_root / storage_key
            if full_path.exists():
                full_path.unlink()

    def get_file_url(self, storage_key: str, expires_in: int = 3600) -> str:
        """Generate presigned URL (MinIO) or local media URL"""
        if self.use_minio:
            return self.s3_client.generate_presigned_url(
                'get_object',
                Params={'Bucket': self.bucket_name, 'Key': storage_key},
                ExpiresIn=expires_in
            )
        else:
            return f"{settings.MEDIA_URL}{storage_key}"
