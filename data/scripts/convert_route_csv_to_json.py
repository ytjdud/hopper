"""경기도 BMS 노선 경유정류소 CSV를 JSON으로 변환한다."""

import csv
import json
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.join(BASE_DIR, "..")
CSV_PATH = os.path.join(PROJECT_DIR, "raw", "경기도_BMS_노선_경유정류소_정보.csv")
JSON_PATH = os.path.join(PROJECT_DIR, "result", "route_stop_info.json")


def main():
    os.makedirs(os.path.dirname(JSON_PATH), exist_ok=True)

    rows = []
    with open(CSV_PATH, "r", encoding="cp949") as f:
        reader = csv.DictReader(f)
        for row in reader:
            rows.append(dict(row))

    with open(JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(rows, f, ensure_ascii=False, indent=2)

    print(f"변환 완료: {len(rows)}건 -> {JSON_PATH}")


if __name__ == "__main__":
    main()
