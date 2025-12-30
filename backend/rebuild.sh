# Docker rebuild script

set -e

echo "===================================="
echo " ONEPIC Backend DEV Build & Run"
echo "===================================="

IMAGE_NAME="onepic-backend"
CONTAINER_NAME="onepic_backend"
PORT="8000:8000"

echo "[1] Stop & remove existing container (if exists)"
docker stop $CONTAINER_NAME 2>/dev/null || true
docker rm $CONTAINER_NAME 2>/dev/null || true

echo "[2] Build image (USE CACHE)"
docker build -t $IMAGE_NAME .

echo "[3] Run container"
docker run -d \
  --name $CONTAINER_NAME \
  -p $PORT \
  --restart unless-stopped \
  $IMAGE_NAME

echo "[4] Done"
docker ps | grep $CONTAINER_NAME || true



# chmod +x rebuild.sh → 처음 세팅 때 한 번
# ./rebuild.sh → 이후 매번 빌드할 때

# docker system prune -a → 도커 전체 정리할 때, 필요할 때만 사용












# 최종버전...

# set -e

# echo "===================================="
# echo " ONEPIC Backend Rebuild"
# echo "===================================="

# IMAGE_NAME="onepic-backend"
# CONTAINER_NAME="onepic_backend"
# PORT="8000:8000"

# echo "[1] Stop & remove existing container (if exists)"
# docker stop $CONTAINER_NAME 2>/dev/null || true
# docker rm $CONTAINER_NAME 2>/dev/null || true

# echo "[2] Optional cleanup (dangling only)"
# docker image prune -f
# docker builder prune -f

# echo "[3] Build image (no cache)"
# docker build --no-cache -t $IMAGE_NAME .

# echo "[4] Run container"
# docker run -d \
#   --name $CONTAINER_NAME \
#   -p $PORT \
#   --restart unless-stopped \
#   $IMAGE_NAME

# echo "[5] Done"
# docker ps | grep $CONTAINER_NAME || true