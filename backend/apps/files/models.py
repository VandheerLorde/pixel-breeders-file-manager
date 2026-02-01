# apps/files/models.py
import uuid
import secrets
from datetime import timedelta
from django.db import models
from django.conf import settings
from django.utils import timezone

class File(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='files')
    original_name = models.CharField(max_length=255)
    # The path where the file is physically stored (e.g., files/1/uuid_name.png)
    storage_key = models.CharField(max_length=500, unique=True)
    mime_type = models.CharField(max_length=100)
    size_bytes = models.BigIntegerField()
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'files'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'deleted_at']),
        ]

    @property
    def is_deleted(self):
        return self.deleted_at is not None

    def soft_delete(self):
        """Mark file as deleted without removing from DB."""
        self.deleted_at = timezone.now()
        self.save(update_fields=['deleted_at'])

    def restore(self):
        """Recover a soft-deleted file."""
        self.deleted_at = None
        self.save(update_fields=['deleted_at'])

    def __str__(self):
        return f"{self.original_name} ({self.id})"

def generate_share_token():
    return secrets.token_urlsafe(24)

class SharedLink(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    file = models.ForeignKey(File, on_delete=models.CASCADE, related_name='shared_links')
    token = models.CharField(max_length=64, unique=True, default=generate_share_token)
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    download_count = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = 'shared_links'
        indexes = [
            models.Index(fields=['token']),
        ]

    @property
    def is_expired(self):
        return timezone.now() > self.expires_at

    def increment_download_count(self):
        self.download_count = models.F('download_count') + 1
        self.save(update_fields=['download_count'])
