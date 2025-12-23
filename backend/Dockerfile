# Python 베이스 이미지 (CPU 전용, 용량/안정성 균형)
FROM python:3.12-slim


# 작업 디렉토리
WORKDIR /app


# 시스템 패키지 (opencv, torch, easyocr에 필요)
RUN apt-get update && apt-get install -y \
    build-essential \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# pip 최신화
RUN pip install --upgrade pip


# requirements 먼저 복사 (캐시 활용)
COPY requirements.txt .


# Python 패키지 설치 (캐시 최소화)
RUN pip install --no-cache-dir -r requirements.txt


# 나머지 소스 복사
COPY . .


# FastAPI 포트
EXPOSE 8000


# 서버 실행
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

