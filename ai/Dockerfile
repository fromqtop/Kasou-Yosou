FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# /notebooks は.dockerignoreによりコピー対象外
COPY . .

CMD ["python", "workers/main.py"]