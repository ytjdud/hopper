"""경기도 전체 정류장에 대해 버스 도착 정보 API를 호출하고 결과를 저장한다."""

import json
import os
import sys
import time
import urllib.request
import urllib.parse

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
PROJECT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
DATA_DIR = os.path.join(PROJECT_DIR, "result")
BUS_JSON = os.path.join(PROJECT_DIR, "raw", "gyeonggido_bus.json")


def call_api(endpoint, params):
    params["serviceKey"] = SERVICE_KEY
    params["format"] = "json"
    query_string = urllib.parse.urlencode(params, safe="=/+")
    url = f"{BASE_URL}{endpoint}?{query_string}"

    try:
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req, timeout=10) as resp:
            return resp.status, json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        return e.code, {"error": str(e)}
    except Exception as e:
        return None, {"error": str(e)}


def extract_arrival_items(body):
    """API 1 응답에서 busArrivalList를 리스트로 반환한다."""
    try:
        msg_body = body.get("response", body).get("msgBody", {})
        items = msg_body.get("busArrivalList", [])
        if isinstance(items, dict):
            items = [items]
        return items
    except Exception:
        return []


def main():
    os.makedirs(DATA_DIR, exist_ok=True)

    with open(BUS_JSON, "r", encoding="utf-8") as f:
        stations = json.load(f)

    station_ids = list({s["STTN_ID"] for s in stations})
    total = len(station_ids)
    print(f"총 정류장 수 (중복 제거): {total}")

    # === API 1: getBusArrivalListv2 ===
    api1_results = []
    api2_params_list = []
    errors = 0

    for i, sttn_id in enumerate(station_ids):
        status, body = call_api("/getBusArrivalListv2", {"stationId": sttn_id})

        if status == 200:
            result_code = body.get("response", {}).get("msgHeader", {}).get("resultCode")
            api1_results.append({
                "stationId": sttn_id,
                "resultCode": result_code,
                "body": body,
            })
            # API 2 호출에 필요한 파라미터 수집
            for item in extract_arrival_items(body):
                route_id = item.get("routeId")
                sta_order = item.get("staOrder")
                if route_id and sta_order:
                    api2_params_list.append({
                        "stationId": sttn_id,
                        "routeId": str(route_id),
                        "staOrder": str(sta_order),
                    })
        else:
            errors += 1
            api1_results.append({
                "stationId": sttn_id,
                "resultCode": None,
                "body": body,
            })

        if (i + 1) % 100 == 0 or (i + 1) == total:
            print(f"[API 1] {i+1}/{total} 완료 (에러: {errors})", flush=True)

    # API 1 결과 저장
    with open(os.path.join(DATA_DIR, "bus_arrival_by_station.json"), "w", encoding="utf-8") as f:
        json.dump(api1_results, f, ensure_ascii=False, indent=2)
    print(f"[API 1] 저장 완료: result/bus_arrival_by_station.json ({len(api1_results)}건)")

    # === API 2: getBusArrivalItemv2 ===
    api2_total = len(api2_params_list)
    print(f"\n[API 2] 호출 대상: {api2_total}건")

    api2_results = []
    errors2 = 0

    for i, params in enumerate(api2_params_list):
        status, body = call_api("/getBusArrivalItemv2", dict(params))

        if status == 200:
            api2_results.append({
                "stationId": params["stationId"],
                "routeId": params["routeId"],
                "staOrder": params["staOrder"],
                "body": body,
            })
        else:
            errors2 += 1
            api2_results.append({
                "stationId": params["stationId"],
                "routeId": params["routeId"],
                "staOrder": params["staOrder"],
                "body": body,
            })

        if (i + 1) % 100 == 0 or (i + 1) == api2_total:
            print(f"[API 2] {i+1}/{api2_total} 완료 (에러: {errors2})", flush=True)

    # API 2 결과 저장
    with open(os.path.join(DATA_DIR, "bus_arrival_by_route.json"), "w", encoding="utf-8") as f:
        json.dump(api2_results, f, ensure_ascii=False, indent=2)
    print(f"[API 2] 저장 완료: result/bus_arrival_by_route.json ({len(api2_results)}건)")

    print("\n완료!")


if __name__ == "__main__":
    main()
