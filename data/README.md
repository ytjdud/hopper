# 경기도 버스 도착 정보 데이터 수집

경기도 버스 정류장 마스터 데이터 + 공공데이터포털 실시간 도착 정보 API를 활용하여,
지도 기반 버스 경로 추천 서비스에 필요한 데이터를 수집·가공하는 스크립트 모음.

---

## 디렉토리 구조

```
mochisukiii/data/
│
├── .env                 ← API 키 (git 미추적, 아래 설정 방법 참고)
├── Makefile             ← 실행 명령어 모음 (make help 로 확인)
├── README.md
│
├── scripts/             ← 실행 스크립트
│   ├── test_bus_api.py              API 호출 테스트
│   ├── fetch_all_bus_arrival.py     전체 정류장 도착 정보 일괄 수집
│   └── convert_route_csv_to_json.py 노선 경유 정류소 CSV → JSON 변환
│
├── raw/                 ← 원본 데이터 (수정 금지)
│   ├── gyeonggido_bus.json              정류장 마스터 (12,909건)
│   └── 경기도_BMS_노선_경유정류소_정보.csv  노선 경유 정류소 (CSV)
│
├── result/              ← 스크립트 실행 결과물
│   ├── bus_arrival_by_station.json  정류소별 전체 노선 도착 정보
│   ├── bus_arrival_by_route.json    특정 노선 도착 상세 정보
│   ├── route_stop_info.json         노선 경유 정류소 (CSV → JSON)
│   └── test/                        테스트 실행 결과 (타임스탬프별)
│
└── docs/                ← 참고 문서
    ├── bus_data_spec.md             버스 데이터 필드 명세
    ├── openapi_task.md              OpenAPI 연동 작업 정의서
    └── ncloud_maps_guide.md         NCloud 지도 연동 가이드
```

---

## 시작하기

### 1. `.env` 설정

```bash
# mochisukiii/data/.env
SERVICE_KEY=여기에_본인의_서비스키_입력
```

> 키 발급: [공공데이터포털](https://www.data.go.kr/) → **경기도 버스도착정보 조회 서비스** 활용 신청

### 2. 실행

```bash
cd mochisukiii/data
make test      # API 호출 테스트 (빠른 확인)
make fetch     # 전체 정류장 도착 정보 일괄 수집
make convert   # 노선 경유 정류소 CSV → JSON 변환
```

> `make` 실행 시 Python 가상환경(`venv/`)이 없으면 자동 생성됩니다.

### 3. 전체 명령어

```
make help      사용 가능한 명령어 목록
make test      API 호출 테스트
make fetch     전체 정류장 도착 정보 일괄 수집
make convert   노선 경유 정류소 CSV → JSON 변환
make clean     가상환경 + 테스트 결과 삭제
```

---

## API 정보

| API | 호출 키 | 결과 파일 |
|-----|---------|-----------|
| `getBusArrivalListv2` | `stationId` | `bus_arrival_by_station.json` |
| `getBusArrivalItemv2` | `stationId` + `routeId` + `staOrder` | `bus_arrival_by_route.json` |

---

## 개선 포인트

- [ ] API rate limit(429) 재시도 로직
- [ ] `fetch` 중간 체크포인트 — 실패 시 이어서 수집
- [ ] 결과 데이터 불필요 필드 소거
- [ ] 지도 API 연동 (Kakao / Naver / T Map)
