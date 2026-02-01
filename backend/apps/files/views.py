# apps/files/views.py
from django.http import StreamingHttpResponse
from rest_framework import viewsets, status, parsers
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.exceptions import NotFound
from rest_framework.views import APIView

from .models import File, SharedLink
from .serializers import FileSerializer, FileUploadSerializer, CreateSharedLinkSerializer, SharedLinkSerializer
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
    @action(detail=True, methods=['post'], url_path='share')
    def share(self, request, pk=None):
        """Create a shareable link for a file."""
        file = self.get_object()
        
        serializer = CreateSharedLinkSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        shared_link = SharedLink.objects.create(
            file=file,
            expires_at=serializer.get_expiration_datetime()
        )
        
        response_serializer = SharedLinkSerializer(shared_link, context={'request': request})
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)

    def destroy(self, request, *args, **kwargs):
        """Soft delete instead of hard delete."""
        file_obj = self.get_object()
        file_obj.soft_delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class SharedDownloadView(APIView):
    """Public endpoint - NO authentication required."""
    permission_classes = [AllowAny]
    authentication_classes = [] 

    def get(self, request, token):
        try:
            shared_link = SharedLink.objects.select_related('file').get(token=token)
        except SharedLink.DoesNotExist:
            return Response(
                {'error': 'Link not found', 'code': 'LINK_NOT_FOUND'},
                status=status.HTTP_404_NOT_FOUND
            )

        if shared_link.is_expired:
            return Response(
                {'error': 'This link has expired', 'code': 'LINK_EXPIRED'},
                status=status.HTTP_410_GONE
            )

        if shared_link.file.deleted_at is not None:
             return Response(
                {'error': 'File no longer exists', 'code': 'FILE_DELETED'},
                status=status.HTTP_404_NOT_FOUND
            )

        shared_link.increment_download_count()

        file = shared_link.file
        service = StorageService() # Ensure Service is imported
        
        response = StreamingHttpResponse(
            service.download_stream(file.storage_key),
            content_type=file.mime_type
        )
        response['Content-Length'] = file.size_bytes
        response['Content-Disposition'] = f'attachment; filename="{file.original_name}"'
        return response
