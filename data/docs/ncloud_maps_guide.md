# NCloud Dynamic Map + 버스 도착 정보 연동 가이드

## 1. 개요

경기도 버스 정류장 데이터(`gyeonggido_bus.json`)와 버스 도착 정보 API 응답 데이터를 NCloud Dynamic Map 위에 시각화한다.

### 데이터 흐름

```
gyeonggido_bus.json (정류장 위치)
        │
        ▼
  Dynamic Map에 마커 표시
        │
        ▼
  마커 클릭 시 도착 정보 표시
        │
        ▼
  data/bus_arrival_by_station.json (도착 정보)
```

### 사용 데이터

| 파일 | 내용 | 핵심 필드 |
|------|------|-----------|
| `gyeonggido_bus.json` | 정류장 위치 | `STTN_ID`, `STTN_NM_INFO`, `WGS84_LAT`, `WGS84_LOGT` |
| `data/bus_arrival_by_station.json` | 정류장별 도착 정보 | `stationId`, `body.response.msgBody.busArrivalList` |
| `data/route_stop_info.json` | 노선 경유 정류소 | `ROUTE_ID`, `STTN_ID`, `STTN_ORDR` |

---

## 2. NCloud Maps 인증 설정

### 2-1. Client ID 발급

1. [NCloud 콘솔](https://console.ncloud.com) 접속
2. **AI/Application Service > Maps** 메뉴 이동
3. Application 등록 후 **Client ID** (`ncpKeyId`) 발급

### 2-2. 인증 방식

- Web Dynamic Map: 스크립트 URL에 `ncpKeyId` 파라미터로 전달
- REST API (Static Map, Geocoding 등): 요청 헤더에 포함
  - `x-ncp-apigw-api-key-id`: Client ID
  - `x-ncp-apigw-api-key`: Client Secret

---

## 3. Dynamic Map 기본 사용법

### 3-1. 스크립트 로드

```html
<!-- 동기 로드 -->
<script type="text/javascript"
  src="https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=YOUR_CLIENT_ID">
</script>

<!-- 비동기 로드 -->
<script type="text/javascript"
  src="https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=YOUR_CLIENT_ID&callback=initMap">
</script>
```

### 3-2. 지도 초기화

```html
<div id="map" style="width:100%; height:600px;"></div>

<script>
var map = new naver.maps.Map('map', {
    center: new naver.maps.LatLng(37.5, 127.0),  // 경기도 중심 부근
    zoom: 10
});
</script>
```

### 3-3. 인증 실패 처리

```javascript
window.navermap_authFailure = function () {
    alert('NCloud Maps 인증에 실패했습니다. ncpKeyId를 확인하세요.');
};
```

---

## 4. 버스 정류장 데이터 연동

### 4-1. 정류장 마커 표시

`gyeonggido_bus.json`의 `WGS84_LAT`, `WGS84_LOGT`를 사용하여 마커를 생성한다.

```javascript
// 정류장 데이터 로드
fetch('./gyeonggido_bus.json')
  .then(res => res.json())
  .then(stations => {
      stations.forEach(function(station) {
          var marker = new naver.maps.Marker({
              position: new naver.maps.LatLng(
                  parseFloat(station.WGS84_LAT),
                  parseFloat(station.WGS84_LOGT)
              ),
              map: map,
              title: station.STTN_NM_INFO
          });

          // 마커에 정류장 정보 연결 (클릭 시 사용)
          marker.set('stationId', station.STTN_ID);
          marker.set('stationName', station.STTN_NM_INFO);
      });
  });
```

> **주의**: 34,585개 마커를 한 번에 생성하면 성능 문제가 발생한다.
> 아래 5장의 최적화 기법을 반드시 적용할 것.

### 4-2. InfoWindow로 도착 정보 표시

마커 클릭 시 해당 정류장의 버스 도착 정보를 InfoWindow에 표시한다.

```javascript
var infoWindow = new naver.maps.InfoWindow({
    maxWidth: 300,
    backgroundColor: '#fff',
    borderColor: '#333',
    borderWidth: 1,
    disableAnchor: false
});

// 도착 정보 데이터를 stationId 기준으로 매핑
var arrivalMap = {};  // { stationId: arrivalData }

fetch('./data/bus_arrival_by_station.json')
  .then(res => res.json())
  .then(arrivals => {
      arrivals.forEach(function(item) {
          arrivalMap[item.stationId] = item.body;
      });
  });

// 마커 클릭 이벤트
function attachClickEvent(marker) {
    naver.maps.Event.addListener(marker, 'click', function() {
        var stationId = marker.get('stationId');
        var stationName = marker.get('stationName');
        var arrival = arrivalMap[stationId];

        var content = buildInfoContent(stationName, arrival);

        infoWindow.setContent(content);
        infoWindow.open(map, marker);
    });
}

function buildInfoContent(stationName, arrivalBody) {
    var html = '<div style="padding:10px; min-width:200px;">';
    html += '<strong>' + stationName + '</strong><hr>';

    if (!arrivalBody) {
        html += '<p>도착 정보 없음</p>';
        html += '</div>';
        return html;
    }

    var msgBody = arrivalBody.response
        ? arrivalBody.response.msgBody
        : arrivalBody.msgBody;

    if (!msgBody || !msgBody.busArrivalList) {
        html += '<p>운행 정보 없음</p>';
        html += '</div>';
        return html;
    }

    var list = msgBody.busArrivalList;
    if (!Array.isArray(list)) list = [list];

    list.forEach(function(bus) {
        html += '<div style="margin-bottom:6px;">';
        html += '<b>' + (bus.routeName || '-') + '</b>';
        html += ' → ' + (bus.routeDestName || '-');
        if (bus.predictTime1) {
            html += '<br>도착예정: ' + bus.predictTime1 + '분';
        } else {
            html += '<br><span style="color:#999;">운행정보 없음</span>';
        }
        html += '</div>';
    });

    html += '</div>';
    return html;
}
```

### 4-3. 노선 경유 정류소 활용

`route_stop_info.json`으로 특정 노선의 경유 정류소를 순서대로 연결하여 Polyline으로 표시할 수 있다.

```javascript
// 특정 노선의 경유 정류소를 순서대로 추출
function getRouteStops(routeData, routeId, stationMap) {
    return routeData
        .filter(function(r) { return r.ROUTE_ID === routeId; })
        .sort(function(a, b) { return parseInt(a.STTN_ORDR) - parseInt(b.STTN_ORDR); })
        .map(function(r) {
            var station = stationMap[r.STTN_ID];
            if (!station) return null;
            return new naver.maps.LatLng(
                parseFloat(station.WGS84_LAT),
                parseFloat(station.WGS84_LOGT)
            );
        })
        .filter(Boolean);
}

// Polyline으로 노선 경로 표시
var polyline = new naver.maps.Polyline({
    map: map,
    path: getRouteStops(routeData, '239000032', stationMap),
    strokeColor: '#FF0000',
    strokeWeight: 3,
    strokeOpacity: 0.8
});
```

---

## 5. 성능 최적화

34,585개 정류장을 동시에 표시하면 브라우저가 느려진다. 아래 방법을 사용한다.

### 5-1. 지도 영역 내 마커만 표시

현재 지도 화면에 보이는 정류장만 마커로 그린다.

```javascript
function updateMarkers(map, stations, markers) {
    var bounds = map.getBounds();

    stations.forEach(function(station, i) {
        var lat = parseFloat(station.WGS84_LAT);
        var lng = parseFloat(station.WGS84_LOGT);
        var position = new naver.maps.LatLng(lat, lng);

        if (bounds.hasPoint(position)) {
            if (!markers[i]) {
                markers[i] = new naver.maps.Marker({
                    position: position,
                    map: map,
                    title: station.STTN_NM_INFO
                });
                attachClickEvent(markers[i]);
            } else {
                markers[i].setMap(map);
            }
        } else {
            if (markers[i]) {
                markers[i].setMap(null);
            }
        }
    });
}

// 지도 이동/줌 시 마커 갱신
naver.maps.Event.addListener(map, 'idle', function() {
    updateMarkers(map, stations, markers);
});
```

### 5-2. 줌 레벨별 필터링

줌 레벨이 낮을 때(넓은 영역)는 마커를 간략하게, 줌 레벨이 높을 때(좁은 영역)는 상세하게 표시한다.

```javascript
naver.maps.Event.addListener(map, 'zoom_changed', function(zoom) {
    if (zoom < 12) {
        // 시군 대표 정류장만 표시
        hideAllMarkers();
    } else {
        // 전체 표시
        updateMarkers(map, stations, markers);
    }
});
```

---

## 6. 전체 구현 예시 (HTML)

```html
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>경기도 버스 정류장 도착 정보</title>
    <style>
        html, body { margin: 0; padding: 0; height: 100%; }
        #map { width: 100%; height: 100%; }
    </style>
</head>
<body>
    <div id="map"></div>

    <script src="https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=YOUR_CLIENT_ID"></script>
    <script>
        var map = new naver.maps.Map('map', {
            center: new naver.maps.LatLng(37.5, 127.0),
            zoom: 11
        });

        var infoWindow = new naver.maps.InfoWindow({ maxWidth: 300 });
        var markers = [];
        var stations = [];
        var arrivalMap = {};

        // 1) 데이터 로드
        Promise.all([
            fetch('./gyeonggido_bus.json').then(r => r.json()),
            fetch('./data/bus_arrival_by_station.json').then(r => r.json())
        ]).then(function(results) {
            stations = results[0];
            results[1].forEach(function(item) {
                arrivalMap[item.stationId] = item.body;
            });

            // 2) 초기 마커 표시
            updateMarkers();
        });

        // 3) 지도 이동 시 마커 갱신
        naver.maps.Event.addListener(map, 'idle', updateMarkers);

        function updateMarkers() {
            var bounds = map.getBounds();
            var zoom = map.getZoom();
            if (zoom < 12) {
                markers.forEach(function(m) { if (m) m.setMap(null); });
                return;
            }
            stations.forEach(function(station, i) {
                var pos = new naver.maps.LatLng(
                    parseFloat(station.WGS84_LAT),
                    parseFloat(station.WGS84_LOGT)
                );
                if (bounds.hasPoint(pos)) {
                    if (!markers[i]) {
                        markers[i] = new naver.maps.Marker({
                            position: pos,
                            map: map,
                            title: station.STTN_NM_INFO
                        });
                        markers[i].set('stationId', station.STTN_ID);
                        markers[i].set('stationName', station.STTN_NM_INFO);
                        naver.maps.Event.addListener(markers[i], 'click', function() {
                            openInfo(markers[i]);
                        });
                    } else {
                        markers[i].setMap(map);
                    }
                } else if (markers[i]) {
                    markers[i].setMap(null);
                }
            });
        }

        function openInfo(marker) {
            var id = marker.get('stationId');
            var name = marker.get('stationName');
            var arrival = arrivalMap[id];
            var html = '<div style="padding:10px;min-width:200px;">';
            html += '<strong>' + name + '</strong> (' + id + ')<hr>';
            if (arrival && arrival.response && arrival.response.msgBody) {
                var list = arrival.response.msgBody.busArrivalList;
                if (!Array.isArray(list)) list = [list];
                list.forEach(function(bus) {
                    html += '<b>' + (bus.routeName||'-') + '</b> → ' + (bus.routeDestName||'-');
                    html += bus.predictTime1
                        ? '<br>도착: ' + bus.predictTime1 + '분<br>'
                        : '<br><span style="color:#999">운행정보 없음</span><br>';
                });
            } else {
                html += '<p>도착 정보 없음</p>';
            }
            html += '</div>';
            infoWindow.setContent(html);
            infoWindow.open(map, marker);
        }
    </script>
</body>
</html>
```

---

## 7. API 레퍼런스 요약

### naver.maps.Map

```javascript
new naver.maps.Map(elementId, {
    center: LatLng,   // 지도 중심 좌표
    zoom: Number      // 줌 레벨 (1~21)
})
```

### naver.maps.Marker

```javascript
new naver.maps.Marker({
    position: LatLng,     // 필수. 마커 위치
    map: Map,             // 표시할 지도
    title: String,        // 마우스 오버 툴팁
    icon: String|Object,  // 커스텀 아이콘
    clickable: Boolean,   // 클릭 허용 (기본 true)
    draggable: Boolean,   // 드래그 허용 (기본 false)
    animation: Animation  // DROP, BOUNCE
})
```

### naver.maps.InfoWindow

```javascript
new naver.maps.InfoWindow({
    content: String|HTMLElement,  // 표시할 내용
    maxWidth: Number,             // 최대 너비(px)
    backgroundColor: String,     // 배경색 (기본 #fff)
    borderColor: String,         // 테두리 색 (기본 #333)
    disableAutoPan: Boolean,     // 자동 패닝 끄기
    disableAnchor: Boolean       // 말풍선 꼬리 끄기
})
// 메서드
infoWindow.open(map, marker);  // 열기
infoWindow.close();            // 닫기
infoWindow.setContent(html);   // 내용 변경
```

### naver.maps.Event

```javascript
naver.maps.Event.addListener(target, eventName, handler);
// 주요 이벤트: 'click', 'idle', 'zoom_changed', 'bounds_changed'
```

---

## 참고 링크

- NCloud Maps 개요: https://api.ncloud-docs.com/docs/application-maps-overview
- Dynamic Map 문서: https://api.ncloud-docs.com/docs/application-maps-dynamic
- JS API v3 가이드: https://navermaps.github.io/maps.js.ncp/docs/
- Marker API: https://navermaps.github.io/maps.js.ncp/docs/naver.maps.Marker.html
- InfoWindow API: https://navermaps.github.io/maps.js.ncp/docs/naver.maps.InfoWindow.html
