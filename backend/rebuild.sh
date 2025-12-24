# Docker rebuild script

echo "Stop & remove containers"
docker stop $(docker ps -q) 2>/dev/null
docker rm $(docker ps -aq) 2>/dev/null

echo "Build image (no cache)"
docker build --no-cache -t onepic-backend .

echo "Run container"
docker run -d \
  --name onepic_backend \
  -p 8000:8000 \
  onepic-backend

echo "Done"
docker ps

# chmod +x rebuild.sh → 처음 세팅 때 한 번
# ./rebuild.sh → 이후 매번 빌드할 때