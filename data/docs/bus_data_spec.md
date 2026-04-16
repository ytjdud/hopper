## 버스 도착 정보 데이터 리스트

아래 데이터는 경기도 버스 정류장 전체 데이터야.
경로: /Users/nhn/Desktop/project/workshop/gyeonggido_bus.json
```bash
  {
    "SIGUN_NM": "가평군",
    "STTN_NM_INFO": "3반상회앞",
    "STTN_ENG_NM_INFO": "3-ban Market",
    "STTN_ID": "239000307",
    "STTN_MANAGE_ID": "44655",
    "CNTR_CARTRK_DIV": "노변정류장",
    "JURISD_INST_NM": "경기도 가평군",
    "LOCPLC_LOC": "경기도 가평군 가평읍",
    "WGS84_LAT": "37.81125",
    "WGS84_LOGT": "127.5214667"
  }
```

이 json 데이터에서 `STTN_ID`로 아래 OpenAPI를 호출하면 돼.

경로: /Users/nhn/Desktop/project/workshop/test_bus_api.py

호출하고, api별 데이터를 data/경로에 넣어줘.
(api별 .json 파일 1개어야 해.)
