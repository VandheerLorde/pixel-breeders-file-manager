FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
# ADDED: libmagic1 (Fixes the crash you just saw)
RUN apt-get update && apt-get install -y \
    pkg-config \
    default-libmysqlclient-dev \
    build-essential \
    curl \
    libmagic1 \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy project files
COPY . .

EXPOSE 8000

# UPDATED CMD:
# 1. Run migrations (so the DB is always ready)
# 2. Collect static files (so the Admin panel has CSS)
# 3. Start Gunicorn
CMD ["sh", "-c", "python manage.py migrate && python manage.py collectstatic --noinput && gunicorn config.wsgi:application --bind 0.0.0.0:8000"]
