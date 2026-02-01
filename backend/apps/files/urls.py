# apps/files/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import FileViewSet

router = DefaultRouter()
# This registers the ViewSet at /api/files/
# It automatically generates routes for:
# list (/), retrieve (/{id}), destroy (/{id}), upload (/upload), download (/{id}/download)
router.register('', FileViewSet, basename='files')

urlpatterns = [
    path('', include(router.urls)),
]
