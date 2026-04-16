import * as Dialog from '@radix-ui/react-dialog';
import type { MovingPlan, Template } from '../data';
import type { CalculationResult } from '../utils/calculate';

interface Props {
  plan: MovingPlan;
  template: Template;
  result: CalculationResult;
  onClose: () => void;
}

const stepIcons: Record<string, string> = {
  '출발': '🏠',
  '정류장 도착': '🚏',
  '버스 탑승': '🚌',
  '버스 하차': '📍',
  '도착': '🏢',
};

export default function DetailedPlanDialog({ plan, template, result, onClose }: Props) {
  return (
    <Dialog.Root open onOpenChange={(open) => { if (!open) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 z-50" />
        <Dialog.Content className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl max-h-[80vh] overflow-auto">
          <div className="p-4">
            {/* Handle */}
            <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-4" />

            <Dialog.Title className="text-lg font-bold text-gray-900 mb-1">
              이동 계획 상세
            </Dialog.Title>
            <p className="text-sm text-gray-500 mb-1">{plan.date} · {template.name}</p>
            <p className="text-xs text-gray-400 mb-4">
              {template.origin} → {template.destination}
            </p>

            {/* Summary bar */}
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg mb-4">
              <div className="text-center">
                <p className="text-xs text-gray-500">출발</p>
                <p className="text-lg font-bold text-blue-700">{result.departureTime}</p>
              </div>
              <div className="flex-1 flex items-center justify-center">
                <div className="h-px flex-1 bg-blue-200" />
                <span className="px-2 text-xs text-blue-500">{result.busNumber}번</span>
                <div className="h-px flex-1 bg-blue-200" />
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500">도착</p>
                <p className="text-lg font-bold text-blue-700">{result.desiredArrivalTime}</p>
              </div>
            </div>

            {/* Timeline list */}
            <div className="space-y-0">
              {result.timeline.map((step, i) => (
                <div key={i} className="flex gap-3">
                  {/* Left: time + line */}
                  <div className="flex flex-col items-center w-14 shrink-0">
                    <span className="text-sm font-bold text-gray-800">{step.time}</span>
                    {i < result.timeline.length - 1 && (
                      <div className="w-px flex-1 bg-gray-200 my-1" />
                    )}
                  </div>

                  {/* Right: content */}
                  <div className={`flex-1 pb-4 ${i < result.timeline.length - 1 ? 'border-b border-gray-100' : ''}`}>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm">{stepIcons[step.title] ?? '📌'}</span>
                      <span className="text-sm font-medium text-gray-800">{step.title}</span>
                    </div>
                    {step.details && step.details.length > 0 && (
                      <div className="space-y-0.5 mt-1">
                        {step.details.map((d, j) => (
                          <p key={j} className="text-xs text-gray-500">{d}</p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Probability badge */}
            <div className="mt-4 flex items-center gap-2 p-3 bg-green-50 rounded-lg">
              <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded">
                {result.summary.stationArrivalProbability}%
              </span>
              <span className="text-xs text-gray-600">
                {result.stationArrivalTime} 정류장 도착 시 탑승 확률
              </span>
            </div>

            {/* Close */}
            <button
              onClick={onClose}
              className="w-full mt-4 py-3 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
            >
              닫기
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
