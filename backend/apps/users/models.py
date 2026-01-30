# backend/apps/users/models.py

from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    email = models.EmailField(unique=True)

    USERNAME_FIELD = 'email'
    # 'username' is still needed for Django internals like createsuperuser
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return self.email
