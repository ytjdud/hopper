# 버스 정류장 데이터 Read 

OpenAPI 호출 실행 테스트 후 결과를 /test_result directory에 생성해줘.

1. 가상 환경 생성
2. py 생성
3. 가상 환경에서 py 실행
4. 가상 환경 생성, 실행, 테스트까지 한 번에 가능한 make 파일 작성

## OpenAPI 호출 실행
### OpenAPI 정보
- End Point: https://apis.data.go.kr/6410000/busarrivalservice/v2
- 인증키(Decoding): 9Ltn7KQla1o8GgKRc8jXe4oo0/EGJ2YO2MmivQ323K1fqKAYvI/v/1AnYgfdoSK0XWMpHzL3iodQyVG1FfZaiA==

### API 1) 정류소에 정차하는 모든 노선의 도착 예정 버스 정보(위치, 도착시간, 빈자리, 저상버스 등)를 조회

#### Endpoint
```bash
GET /getBusArrivalListv2
```
정류소에 정차하는 모든 노선의 도착 예정 버스 정보(위치, 도착시간, 빈자리, 저상버스 등)를 조회합니다.

#### Request
Query Parameters
| Name       | Type   | Required | Description        |
| ---------- | ------ | -------- | ------------------ |
| serviceKey | string | ✅        | 인증키 (공공데이터포털 발급)   |
| stationId  | string | ✅        | 정류소 ID             |
| format     | string | ✅        | 응답 포맷 (json / xml) |

#### Response Code
Status Code
| Code | Description     |
| ---- | --------------- |
| 0    | 정상 처리           |
| 1    | 시스템 에러          |
| 2    | 필수 파라미터 누락      |
| 4    | 결과 없음           |
| 200  | 성공 (HTTP 응답 코드) |

#### Response Body (JSON)
```bash
{
  "comMsgHeader": "string",
  "msgHeader": {
    "resultMessage": "string",
    "queryTime": "string",
    "resultCode": 0
  },
  "msgBody": {
    "busArrivalList": {
      "stateCd1": 0,
      "stateCd2": 0,
      "crowded1": 0,
      "crowded2": 0,
      "flag": "string",
      "locationNo1": 0,
      "locationNo2": 0,
      "lowPlate1": 0,
      "lowPlate2": 0,
      "plateNo1": "string",
      "plateNo2": "string",
      "predictTime1": 0,
      "predictTime2": 0,
      "predictTimeSec1": 0,
      "predictTimeSec2": 0,
      "remainSeatCnt1": 0,
      "remainSeatCnt2": 0,
      "routeDestId": 0,
      "routeDestName": "string",
      "routeId": 0,
      "routeName": "string",
      "routeTypeCd": 0,
      "staOrder": 0,
      "stationId": 0,
      "stationNm1": "string",
      "stationNm2": "string",
      "taglessCd1": 0,
      "taglessCd2": 0,
      "turnSeq": 0,
      "vehId1": 0,
      "vehId2": 0
    }
  }
}
```

#### Field Description (busArrivalList)
| Field           | Type   | Description         |
| --------------- | ------ | ------------------- |
| routeName       | string | 노선 번호               |
| routeDestName   | string | 종점 이름               |
| predictTime1    | int    | 첫 번째 버스 도착 예정 시간(분) |
| predictTime2    | int    | 두 번째 버스 도착 예정 시간(분) |
| predictTimeSec1 | int    | 첫 번째 버스 도착 예정 시간(초) |
| predictTimeSec2 | int    | 두 번째 버스 도착 예정 시간(초) |
| locationNo1     | int    | 첫 번째 버스 현재 위치       |
| locationNo2     | int    | 두 번째 버스 현재 위치       |
| remainSeatCnt1  | int    | 첫 번째 버스 잔여 좌석 수     |
| remainSeatCnt2  | int    | 두 번째 버스 잔여 좌석 수     |
| crowded1        | int    | 첫 번째 버스 혼잡도         |
| crowded2        | int    | 두 번째 버스 혼잡도         |
| lowPlate1       | int    | 첫 번째 저상버스 여부        |
| lowPlate2       | int    | 두 번째 저상버스 여부        |
| stateCd1        | int    | 첫 번째 버스 상태 코드       |
| stateCd2        | int    | 두 번째 버스 상태 코드       |
| plateNo1        | string | 첫 번째 차량 번호          |
| plateNo2        | string | 두 번째 차량 번호          |

아래 Request로 정상 동작 여부를 출력해줘.
#### Example Request
```bash
GET /getBusArrivalListv2?serviceKey=YOUR_KEY&stationId=12345&format=json
```

### API 2) 정류소(ID)에 정차하는 특정 노선(ID)의 도착 정보를 조회

#### End Point
```bash
GET /getBusArrivalItemv2
```
정류소(ID)에 정차하는 특정 노선(ID)의 도착 정보를 조회합니다.

#### Request
Query Parameters
| Name       | Type   | Required | Description        |
| ---------- | ------ | -------- | ------------------ |
| serviceKey | string | ✅        | 인증키 (공공데이터포털 발급)   |
| stationId  | string | ✅        | 정류소 ID             |
| routeId    | string | ✅        | 노선 ID              |
| staOrder   | string | ✅        | 노선 내 정류소 순번        |
| format     | string | ✅        | 응답 포맷 (json / xml) |

#### Response Code
Status Code
| Code | Description  |
| ---- | ------------ |
| 0    | 정상 처리        |
| 1    | 시스템 에러       |
| 2    | 필수 파라미터 누락   |
| 4    | 결과 없음        |
| 200  | 성공 (HTTP 코드) |

#### Response Body (JSON)
```bash
{
  "comMsgHeader": "string",
  "msgHeader": {
    "resultMessage": "string",
    "queryTime": "string",
    "resultCode": 0
  },
  "msgBody": {
    "busArrivalItem": {
      "predictTimeSec1": 0,
      "predictTimeSec2": 0,
      "crowded1": 0,
      "crowded2": 0,
      "flag": "string",
      "locationNo1": 0,
      "locationNo2": 0,
      "lowPlate1": 0,
      "lowPlate2": 0,
      "plateNo1": "string",
      "plateNo2": "string",
      "predictTime1": 0,
      "predictTime2": 0,
      "remainSeatCnt1": 0,
      "remainSeatCnt2": 0,
      "routeDestId": 0,
      "routeDestName": "string",
      "routeId": 0,
      "routeName": "string",
      "routeTypeCd": 0,
      "staOrder": 0,
      "stationId": 0,
      "stationNm1": "string",
      "stationNm2": "string",
      "taglessCd1": 0,
      "taglessCd2": 0,
      "turnSeq": 0,
      "vehId1": 0,
      "vehId2": 0
    }
  }
}
```

#### Field Description (busArrivalItem)
| Field           | Type   | Description         |
| --------------- | ------ | ------------------- |
| routeName       | string | 노선 번호               |
| routeDestName   | string | 종점 이름               |
| predictTime1    | int    | 첫 번째 버스 도착 예정 시간(분) |
| predictTime2    | int    | 두 번째 버스 도착 예정 시간(분) |
| predictTimeSec1 | int    | 첫 번째 버스 도착 예정 시간(초) |
| predictTimeSec2 | int    | 두 번째 버스 도착 예정 시간(초) |
| locationNo1     | int    | 첫 번째 버스 현재 위치       |
| locationNo2     | int    | 두 번째 버스 현재 위치       |
| remainSeatCnt1  | int    | 첫 번째 버스 잔여 좌석 수     |
| remainSeatCnt2  | int    | 두 번째 버스 잔여 좌석 수     |
| crowded1        | int    | 첫 번째 버스 혼잡도         |
| crowded2        | int    | 두 번째 버스 혼잡도         |
| lowPlate1       | int    | 첫 번째 저상버스 여부        |
| lowPlate2       | int    | 두 번째 저상버스 여부        |
| plateNo1        | string | 첫 번째 차량 번호          |
| plateNo2        | string | 두 번째 차량 번호          |
| vehId1          | int    | 첫 번째 차량 ID          |
| vehId2          | int    | 두 번째 차량 ID          |
| stationId       | int    | 정류소 ID              |
| staOrder        | int    | 정류소 순번              |

#### Example Request
```bash
GET /getBusArrivalItemv2?serviceKey=YOUR_KEY&stationId=12345&routeId=100100118&staOrder=10&format=json
```

정상 동작 조건은 다음 2개를 만족해야 한다.

1. HTTP Status Code = 200
2. Response 내부

```bash
msgHeader.resultCode = 0
```
즉,
```bash
HTTP 200 + resultCode 0 → 정상
```
그 외
- resultCode 1 → 서버 에러
- resultCode 2 → 파라미터 누락
- resultCode 4 → 데이터 없음