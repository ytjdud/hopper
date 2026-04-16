import type { Scenario, Settings } from '../data';

interface InputPanelProps {
  scenario: Scenario;
  settings: Settings;
  onCalculate: () => void;
}

export function InputPanel({
  scenario,
  settings,
  onCalculate,
}: InputPanelProps) {
  const { destination, desiredArrivalTime, selectedWalkingSpeed, selectedElevatorSpeed } =
    scenario.commute;

  const walkingSpeedLabel = settings.walkingSpeed[selectedWalkingSpeed].label;
  const elevatorSpeedLabel = settings.elevatorSpeed[selectedElevatorSpeed].label;

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
      {/* Destination */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          목적지
        </label>
        <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
          <p className="text-gray-900 font-medium">{destination}</p>
        </div>
      </div>

      {/* Desired Arrival Time */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          도착 목표 시간
        </label>
        <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
          <p className="text-gray-900 font-medium text-lg">{desiredArrivalTime}</p>
        </div>
      </div>

      {/* Walking Speed */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          도보 속도
        </label>
        <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
          <p className="text-gray-900 font-medium">{walkingSpeedLabel}</p>
        </div>
      </div>

      {/* Elevator Speed */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          엘리베이터 속도
        </label>
        <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
          <p className="text-gray-900 font-medium">{elevatorSpeedLabel}</p>
        </div>
      </div>

      {/* Calculate Button */}
      <button
        onClick={onCalculate}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors duration-200"
      >
        경로 계산
      </button>
    </div>
  );
}
