# apps/files/permissions.py
from rest_framework import permissions

class IsFileOwner(permissions.BasePermission):
    """Ensure user can only access their own files."""
    
    def has_object_permission(self, request, view, obj):
        # Instance must have an attribute named 'user'.
        return obj.user == request.user
