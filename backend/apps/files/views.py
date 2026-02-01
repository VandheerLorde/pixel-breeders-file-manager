# apps/files/views.py
from django.http import StreamingHttpResponse
from rest_framework import viewsets, status, parsers
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import NotFound

from .models import File
from .serializers import FileSerializer, FileUploadSerializer
from .permissions import IsFileOwner
from .services import StorageService

class FileViewSet(viewsets.ModelViewSet):
    serializer_class = FileSerializer
    permission_classes = [IsAuthenticated, IsFileOwner]
    parser_classes = (parsers.JSONParser, parsers.MultiPartParser, parsers.FormParser)

    def get_queryset(self):
        """Return only non-deleted files belonging to the current user."""
        return File.objects.filter(
            user=self.request.user, 
            deleted_at__isnull=True
        )

    @action(detail=False, methods=['POST'], url_path='upload')
    def upload_file(self, request):
        serializer = FileUploadSerializer(data=request.data)
        if serializer.is_valid():
            uploaded_file = serializer.validated_data['file']
            
            # Service Logic
            service = StorageService()
            key = service.generate_storage_key(request.user.id, uploaded_file.name)
            
            try:
                service.upload(uploaded_file, key, uploaded_file.content_type)
                
                # Database Entry
                file_instance = File.objects.create(
                    user=request.user,
                    original_name=uploaded_file.name,
                    storage_key=key,
                    mime_type=uploaded_file.content_type,
                    size_bytes=uploaded_file.size
                )
                
                return Response(
                    FileSerializer(file_instance).data, 
                    status=status.HTTP_201_CREATED
                )
            except Exception as e:
                return Response(
                    {"error": "Upload failed", "details": str(e)}, 
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['GET'])
    def download(self, request, pk=None):
        file_obj = self.get_object() # Handles permissions checks
        
        service = StorageService()
        try:
            # We use StreamingHttpResponse for memory efficiency
            response = StreamingHttpResponse(
                service.download_stream(file_obj.storage_key),
                content_type=file_obj.mime_type
            )
            response['Content-Disposition'] = f'attachment; filename="{file_obj.original_name}"'
            response['Content-Length'] = file_obj.size_bytes
            return response
        except FileNotFoundError:
            raise NotFound(detail="File content not found in storage.")
        except Exception as e:
             return Response(
                {"error": "Download failed", "details": str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def destroy(self, request, *args, **kwargs):
        """Soft delete instead of hard delete."""
        file_obj = self.get_object()
        file_obj.soft_delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
