# apps/files/serializers.py
import magic  # Requires 'python-magic' system package and pip package
from rest_framework import serializers
from .models import File

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
