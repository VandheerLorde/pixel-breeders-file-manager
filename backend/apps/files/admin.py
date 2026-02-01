# apps/files/admin.py
from django.contrib import admin
from django.utils.html import format_html
from .models import File

@admin.register(File)
class FileAdmin(admin.ModelAdmin):
    list_display = ('original_name', 'user_email', 'size_kb', 'mime_type', 'is_active', 'created_at')
    list_filter = ('mime_type', 'created_at', 'deleted_at')
    search_fields = ('original_name', 'user__email', 'id')
    readonly_fields = ('id', 'created_at', 'updated_at', 'storage_key')
    
    def user_email(self, obj):
        return obj.user.email
    user_email.short_description = 'User'

    def size_kb(self, obj):
        return f"{obj.size_bytes / 1024:.2f} KB"
    
    def is_active(self, obj):
        if obj.deleted_at:
            return format_html('<span style="color: red;">Deleted</span>')
        return format_html('<span style="color: green;">Active</span>')
    
    def get_queryset(self, request):
        return super().get_queryset(request)
