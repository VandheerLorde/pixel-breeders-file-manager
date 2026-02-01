# apps/files/services.py
import os
import logging
from io import BytesIO
from pathlib import Path
from PIL import Image

from django.conf import settings
from minio import Minio
from minio.error import S3Error

logger = logging.getLogger(__name__)

class StorageService:
    THUMBNAIL_SIZE = (200, 200)
    IMAGE_MIME_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp']

    def __init__(self):
        # Check if we should use MinIO (based on your settings.py logic)
        self.use_minio = getattr(settings, 'USE_MINIO', False)
        
        if self.use_minio:
            # --- MAP AWS SETTINGS TO MINIO CLIENT ---
            endpoint_url = settings.AWS_S3_ENDPOINT_URL
            
            # MinIO client expects 'localhost:9000', not 'http://localhost:9000'
            if endpoint_url.startswith('http://'):
                endpoint = endpoint_url.replace('http://', '')
                secure = False
            elif endpoint_url.startswith('https://'):
                endpoint = endpoint_url.replace('https://', '')
                secure = True
            else:
                endpoint = endpoint_url
                secure = False

            self.client = Minio(
                endpoint,
                access_key=settings.AWS_ACCESS_KEY_ID,
                secret_key=settings.AWS_SECRET_ACCESS_KEY,
                secure=secure
            )
            self.bucket_name = settings.AWS_STORAGE_BUCKET_NAME
        else:
            # Local filesystem setup
            self.media_root = Path(settings.MEDIA_ROOT)
            self.files_dir = self.media_root / 'files'
            self.thumbs_dir = self.media_root / 'thumbnails'
            self.files_dir.mkdir(parents=True, exist_ok=True)
            self.thumbs_dir.mkdir(parents=True, exist_ok=True)

    def generate_storage_key(self, user_id, filename):
        import uuid
        ext = os.path.splitext(filename)[1].lower()
        # storage_key format: files/user_id/uuid.ext
        return f"files/{user_id}/{uuid.uuid4()}{ext}"

    def get_thumbnail_key(self, storage_key: str) -> str:
        """Convert storage key (files/...) to thumbnail key (thumbnails/...)"""
        return storage_key.replace('files/', 'thumbnails/', 1)

    def is_image(self, mime_type: str) -> bool:
        return mime_type in self.IMAGE_MIME_TYPES

    def generate_thumbnail(self, file_obj, mime_type: str) -> BytesIO | None:
        """Generate thumbnail for image files in memory."""
        if not self.is_image(mime_type):
            return None

        try:
            image = Image.open(file_obj)
            
            # Convert RGBA to RGB for JPEGs
            if image.mode == 'RGBA' and mime_type == 'image/jpeg':
                image = image.convert('RGB')
            
            # Resize
            image.thumbnail(self.THUMBNAIL_SIZE, Image.Resampling.LANCZOS)
            
            thumb_io = BytesIO()
            format_map = {
                'image/png': 'PNG', 'image/jpeg': 'JPEG',
                'image/gif': 'GIF', 'image/webp': 'WEBP',
            }
            # Save to buffer
            image.save(thumb_io, format=format_map.get(mime_type, 'PNG'), quality=85)
            thumb_io.seek(0)
            
            # Reset original file pointer
            file_obj.seek(0)
            return thumb_io
        except Exception as e:
            logger.error(f"Thumbnail generation failed: {e}")
            file_obj.seek(0)
            return None

    def upload(self, file_obj, storage_key, content_type=None):
        """Standard upload."""
        if self.use_minio:
            # Ensure we are at start and get size safely
            file_obj.seek(0, 2)
            size = file_obj.tell()
            file_obj.seek(0)
            
            self.client.put_object(
                self.bucket_name,
                storage_key,
                file_obj,
                size,
                content_type=content_type
            )
        else:
            full_path = self.media_root / storage_key
            full_path.parent.mkdir(parents=True, exist_ok=True)
            with open(full_path, 'wb') as f:
                for chunk in file_obj.chunks() if hasattr(file_obj, 'chunks') else file_obj:
                    if isinstance(chunk, bytes): f.write(chunk)
                    else: f.write(file_obj.read())

    def upload_with_thumbnail(self, file_obj, storage_key: str, content_type: str):
        """Uploads original file AND generates/uploads a thumbnail if it's an image."""
        file_obj.seek(0)
        
        # 1. Upload Original
        self.upload(file_obj, storage_key, content_type)
        
        # 2. Generate Thumbnail
        thumbnail_io = self.generate_thumbnail(file_obj, content_type)
        
        if thumbnail_io:
            thumb_key = self.get_thumbnail_key(storage_key)
            self.upload(thumbnail_io, thumb_key, content_type)

    def download_stream(self, storage_key):
        if self.use_minio:
            return self.client.get_object(self.bucket_name, storage_key)
        else:
            path = self.media_root / storage_key
            if not path.exists():
                raise FileNotFoundError
            return open(path, 'rb')
            
    def delete(self, storage_key):
        keys_to_delete = [storage_key]
        if 'files/' in storage_key:
            keys_to_delete.append(self.get_thumbnail_key(storage_key))

        if self.use_minio:
            for key in keys_to_delete:
                try:
                    self.client.remove_object(self.bucket_name, key)
                except S3Error:
                    pass
        else:
            for key in keys_to_delete:
                path = self.media_root / key
                if path.exists():
                    os.remove(path)

    def thumbnail_exists(self, storage_key: str) -> bool:
        thumb_key = self.get_thumbnail_key(storage_key)
        try:
            if self.use_minio:
                self.client.stat_object(self.bucket_name, thumb_key)
                return True
            else:
                return (self.media_root / thumb_key).exists()
        except:
            return False
