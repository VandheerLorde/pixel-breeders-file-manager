# apps/files/serializers.py
import magic  # Requires 'python-magic' system package and pip package
from rest_framework import serializers
from .models import File
from datetime import timedelta
from django.utils import timezone
from .models import File, SharedLink

class FileSerializer(serializers.ModelSerializer):
    """Output serializer for file lists."""
    human_readable_size = serializers.SerializerMethodField()

    class Meta:
        model = File
        fields = ('id', 'original_name', 'mime_type', 'size_bytes', 'human_readable_size', 'created_at')
        read_only_fields = fields

    def get_human_readable_size(self, obj):
        size = obj.size_bytes
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size < 1024:
                return f"{size:.1f} {unit}"
            size /= 1024
        return f"{size:.1f} TB"

class FileUploadSerializer(serializers.Serializer):
    """Input serializer for validating file uploads."""
    file = serializers.FileField()

    ALLOWED_MIME_TYPES = [
        'image/png', 'image/jpeg', 'image/gif', 'image/webp',
        'application/pdf', 'text/plain'
    ]
    MAX_SIZE = 10 * 1024 * 1024  # 10MB

    def validate_file(self, value):
        # 1. Size Check
        if value.size > self.MAX_SIZE:
            raise serializers.ValidationError(
                f"File too large. Max size is {self.MAX_SIZE/1024/1024}MB.",
                code='FILE_TOO_LARGE'
            )

        # 2. Type Check (Header)
        if value.content_type not in self.ALLOWED_MIME_TYPES:
            raise serializers.ValidationError(
                f"Unsupported file type: {value.content_type}",
                code='INVALID_FILE_TYPE'
            )

        # 3. Deep Content Check
        # Note: In some container setups, libmagic C libs might be missing. 
        initial_pos = value.tell()
        value.seek(0)
        mime = magic.from_buffer(value.read(2048), mime=True)
        value.seek(initial_pos) # Reset pointer

        if mime not in self.ALLOWED_MIME_TYPES:
             raise serializers.ValidationError(
                f"File content does not match allowed types. Detected: {mime}",
                code='INVALID_FILE_TYPE'
            )

        return value

class CreateSharedLinkSerializer(serializers.Serializer):
    """Input for creating a new share link."""
    expires_in = serializers.ChoiceField(
        choices=[
            ('1h', '1 hour'),
            ('24h', '24 hours'),
            ('7d', '7 days'),
        ]
    )

    def get_expiration_datetime(self):
        expires_in = self.validated_data['expires_in']
        now = timezone.now()
        if expires_in == '1h':
            return now + timedelta(hours=1)
        elif expires_in == '24h':
            return now + timedelta(hours=24)
        elif expires_in == '7d':
            return now + timedelta(days=7)
        return now + timedelta(hours=24) # Default

class SharedLinkSerializer(serializers.ModelSerializer):
    """Output for the share link (including the full URL)."""
    url = serializers.SerializerMethodField()
    file_name = serializers.CharField(source='file.original_name', read_only=True)

    class Meta:
        model = SharedLink
        fields = ['id', 'token', 'url', 'file_name', 'expires_at', 'created_at', 'download_count']
        read_only_fields = fields

    def get_url(self, obj):
        request = self.context.get('request')
        if request is None:
            return None
        # We point this to the FRONTEND public route, not the backend API
        return request.build_absolute_uri(f'/api/shared/{obj.token}/')
