# apps/files/models.py
import uuid
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
