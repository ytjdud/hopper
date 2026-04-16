"""버스 정류장 도착 정보 OpenAPI 호출 테스트"""

import json
import os
import urllib.request
import urllib.parse
from datetime import datetime


BASE_URL = "https://apis.data.go.kr/6410000/busarrivalservice/v2"
ENV_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".env")

def _load_env(path):
    env = {}
    with open(path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                env[k.strip()] = v.strip()
    return env

_env = _load_env(ENV_PATH)
SERVICE_KEY = _env["SERVICE_KEY"]
RESULT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "result", "test")


def call_api(endpoint, params):
    """OpenAPI를 호출하고 결과를 반환한다."""
    params["serviceKey"] = SERVICE_KEY
    params["format"] = "json"
    query_string = urllib.parse.urlencode(params, safe="=/+")
    url = f"{BASE_URL}{endpoint}?{query_string}"

    print(f"[REQUEST] {url}\n")

    try:
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req, timeout=10) as resp:
            http_status = resp.status
            body = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        http_status = e.code
        body = {"error": str(e)}
    except Exception as e:
        http_status = None
        body = {"error": str(e)}

    return http_status, body


def check_result(http_status, body):
    """정상 동작 여부를 판정한다. HTTP 200 + resultCode 0 이면 정상."""
    result_code = None
    result_message = None

    if isinstance(body, dict):
        # 응답이 response 객체로 감싸진 경우 처리
        inner = body.get("response", body)
        msg_header = inner.get("msgHeader", {})
        result_code = msg_header.get("resultCode")
        result_message = msg_header.get("resultMessage")

    is_ok = (http_status == 200 and result_code == 0)

    return {
        "http_status": http_status,
        "result_code": result_code,
        "result_message": result_message,
        "is_success": is_ok,
    }


def test_get_bus_arrival_list():
    """API 1) 정류소에 정차하는 모든 노선의 도착 예정 버스 정보 조회"""
    print("=" * 60)
    print("API 1) getBusArrivalListv2 - 정류소 전체 노선 도착 정보 조회")
    print("=" * 60)

    params = {"stationId": "239000307"}
    http_status, body = call_api("/getBusArrivalListv2", params)
    verdict = check_result(http_status, body)

    print(f"HTTP Status : {verdict['http_status']}")
    print(f"resultCode  : {verdict['result_code']}")
    print(f"resultMessage: {verdict['result_message']}")
    print(f"정상 동작 여부  : {'성공' if verdict['is_success'] else '실패'}")
    print()

    return {
        "api": "bus_arrival_by_station",
        "request_params": {"stationId": "239000307", "format": "json"},
        "verdict": verdict,
        "response_body": body,
    }


def test_get_bus_arrival_item():
    """API 2) 정류소에 정차하는 특정 노선의 도착 정보 조회"""
    print("=" * 60)
    print("API 2) getBusArrivalItemv2 - 특정 노선 도착 정보 조회")
    print("=" * 60)

    # API 1 결과에서 확인한 실제 노선 정보 사용
    params = {
        "stationId": "239000307",
        "routeId": "239000032",
        "staOrder": "15",
    }
    http_status, body = call_api("/getBusArrivalItemv2", params)
    verdict = check_result(http_status, body)

    print(f"HTTP Status : {verdict['http_status']}")
    print(f"resultCode  : {verdict['result_code']}")
    print(f"resultMessage: {verdict['result_message']}")
    print(f"정상 동작 여부  : {'성공' if verdict['is_success'] else '실패'}")
    print()

    return {
        "api": "bus_arrival_by_route",
        "request_params": {
            "stationId": "239000307",
            "routeId": "239000032",
            "staOrder": "15",
            "format": "json",
        },
        "verdict": verdict,
        "response_body": body,
    }


def save_result(result):
    """API별 테스트 결과를 개별 JSON 파일로 저장한다."""
    api_name = result["api"]
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    output_path = os.path.join(RESULT_DIR, f"{api_name}_{timestamp}.json")

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(
            {"test_time": datetime.now().isoformat(), **result},
            f,
            ensure_ascii=False,
            indent=2,
        )

    print(f"  -> 저장: {output_path}")
    return output_path


def main():
    os.makedirs(RESULT_DIR, exist_ok=True)

    results = []
    results.append(test_get_bus_arrival_list())
    results.append(test_get_bus_arrival_item())

    # API별 결과를 개별 파일로 저장
    print("=" * 60)
    print("[결과 파일 저장]")
    for r in results:
        save_result(r)
    print("=" * 60)

    # 전체 요약
    print("\n[테스트 요약]")
    for r in results:
        status = "PASS" if r["verdict"]["is_success"] else "FAIL"
        print(f"  {r['api']}: {status}")


if __name__ == "__main__":
    main()
