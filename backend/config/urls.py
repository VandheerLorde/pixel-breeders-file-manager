# backend/config/urls.py

from django.contrib import admin
from django.urls import path, include
from apps.files.views import SharedDownloadView
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    path('admin/', admin.site.urls),

    # API endpoints
    path('api/auth/', include('apps.users.urls')),
    path('api/auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/files/', include('apps.files.urls')),
    path('api/shared/<str:token>/', SharedDownloadView.as_view(), name='shared-download'),
]
