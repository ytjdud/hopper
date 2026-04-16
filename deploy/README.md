# 배포 (NHN Cloud Registry)

`hopper` 앱의 Docker 이미지를 빌드하고 NHN Cloud Registry에 푸시하는 스크립트 모음.

---

## 디렉토리 구조

```
deploy/
├── deploy.sh            ← 빌드 → 태그 → 푸시 자동화 스크립트
├── Makefile             ← make 명령어 래퍼
├── Dockerfile           ← (TODO) Docker 이미지 정의
└── docker-compose.yml   ← (TODO) 로컬 개발 환경 정의
```

---

## 사전 준비

### 1. Docker 로그인

```bash
docker login d612a575-kr1-registry.container.nhncloud.com
```

### 2. Dockerfile 작성

현재 `Dockerfile`이 비어있습니다. 앱에 맞게 작성 후 배포하세요.

---

## 배포

```bash
cd deploy

# 기본 버전(1.0.0)으로 배포
make deploy

# 특정 버전으로 배포
make deploy-version VERSION=2.0.0
```

내부적으로 `deploy.sh`가 다음 3단계를 수행합니다:

1. `docker build --platform linux/amd64` — 이미지 빌드
2. `docker tag` — 레지스트리 경로로 태그
3. `docker push` — NHN Cloud Registry에 푸시

### 레지스트리 정보

```
레지스트리: d612a575-kr1-registry.container.nhncloud.com
이미지 경로: hopper/hopper:<version>
```

---

## Make 명령어

| 명령 | 설명 |
|------|------|
| `make deploy` | 기본 버전(1.0.0)으로 빌드 + 푸시 |
| `make deploy-version VERSION=x.x.x` | 지정 버전으로 빌드 + 푸시 |
| `make run` | 로컬에서 Go 서버 실행 (`go run ./cmd/server`) |

---

## TODO

- [ ] `Dockerfile` 작성
- [ ] `docker-compose.yml` 로컬 개발 환경 구성
- [ ] Makefile의 `build`, `docker-build`, `compose-*` 타겟 구현
