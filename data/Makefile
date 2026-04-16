VENV_DIR = venv
PYTHON   = $(VENV_DIR)/bin/python

.PHONY: help venv test fetch convert clean

help: ## 사용 가능한 명령어 목록
	@grep -E '^[a-z_-]+:.*##' $(MAKEFILE_LIST) | awk -F ':.*## ' '{printf "  make %-12s %s\n", $$1, $$2}'

venv: ## Python 가상환경 생성
	@test -d $(VENV_DIR) || python3 -m venv $(VENV_DIR)

test: venv ## API 호출 테스트 (getBusArrivalListv2, getBusArrivalItemv2)
	$(PYTHON) scripts/test_bus_api.py

fetch: venv ## 전체 정류장 도착 정보 일괄 수집
	$(PYTHON) scripts/fetch_all_bus_arrival.py

convert: venv ## 노선 경유 정류소 CSV → JSON 변환
	$(PYTHON) scripts/convert_route_csv_to_json.py

clean: ## 가상환경 + 테스트 결과 삭제
	rm -rf $(VENV_DIR) result/test
