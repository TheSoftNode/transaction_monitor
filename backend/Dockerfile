FROM python:3.12-slim as builder

WORKDIR /app

ARG BUILD_ENV=production

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

COPY requirements/ /app/requirements/

RUN pip install --no-cache-dir --upgrade pip && \
    if [ "$BUILD_ENV" = "development" ]; then \
        pip install --no-cache-dir -r requirements/development.txt; \
    else \
        pip install --no-cache-dir -r requirements/production.txt; \
    fi

FROM python:3.12-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DJANGO_ENV=production

RUN apt-get update && apt-get install -y --no-install-recommends \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/* \
    && useradd -m -u 1000 appuser

COPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

COPY . /app/

RUN mkdir -p /app/logs /app/staticfiles /app/media && \
    chown -R appuser:appuser /app

USER appuser

EXPOSE 8000

CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "4", "--timeout", "120"]
