#!/bin/bash

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 설정
IMAGE_NAME="hopper"
IMAGE_VERSION="${1:-1.0.0}"
REGISTRY="d612a575-kr1-registry.container.nhncloud.com"
REGISTRY_IMAGE="${REGISTRY}/hopper/${IMAGE_NAME}:${IMAGE_VERSION}"

echo -e "${YELLOW}================================${NC}"
echo -e "${YELLOW}Hobber Registry 배포${NC}"
echo -e "${YELLOW}================================${NC}"
echo ""
echo "이미지 이름: ${IMAGE_NAME}"
echo "버전: ${IMAGE_VERSION}"
echo "로컬 이미지: ${IMAGE_NAME}:${IMAGE_VERSION}"
echo "레지스트리 이미지: ${REGISTRY_IMAGE}"
echo ""

# Step 1: Docker 빌드
echo -e "${YELLOW}[1/3] Docker 이미지 빌드 중...${NC}"
if docker build --platform linux/amd64 -t "${IMAGE_NAME}:${IMAGE_VERSION}" .; then
    echo -e "${GREEN}✓ 빌드 성공${NC}"
else
    echo -e "${RED}✗ 빌드 실패${NC}"
    exit 1
fi

echo ""

# Step 2: 태그 설정
echo -e "${YELLOW}[2/3] 이미지 태그 설정 중...${NC}"
if docker tag "${IMAGE_NAME}:${IMAGE_VERSION}" "${REGISTRY_IMAGE}"; then
    echo -e "${GREEN}✓ 태그 설정 성공${NC}"
else
    echo -e "${RED}✗ 태그 설정 실패${NC}"
    exit 1
fi

echo ""

# Step 3: 레지스트리에 푸시
echo -e "${YELLOW}[3/3] 레지스트리에 푸시 중...${NC}"
if docker push "${REGISTRY_IMAGE}"; then
    echo -e "${GREEN}✓ 푸시 성공${NC}"
else
    echo -e "${RED}✗ 푸시 실패${NC}"
    echo ""
    echo -e "${YELLOW}도움말: 레지스트리에 로그인해야 합니다.${NC}"
    echo "다음 명령어를 실행하세요:"
    echo "docker login ${REGISTRY}"
    exit 1
fi

echo ""
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}배포 완료!${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo "배포된 이미지: ${REGISTRY_IMAGE}"
echo ""