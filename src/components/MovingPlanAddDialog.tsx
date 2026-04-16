import { useState, useMemo } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import type { Template, MovingPlan } from '../data';
import { routes, settings } from '../data';
import { calculateTimeline } from '../utils/calculate';

interface Props {
  date: string;
  templates: Template[];
  onSave: (plan: Omit<MovingPlan, 'id'>) => void;
  onClose: () => void;
}

export default function MovingPlanAddDialog({ date, templates, onSave, onClose }: Props) {
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? '');
  const [mode, setMode] = useState<'arrival' | 'departure'>('arrival');
  const [targetTime, setTargetTime] = useState('07:00');
  const [calculated, setCalculated] = useState(false);

  const selectedTemplate = templates.find((t) => t.id === templateId);

  const result = useMemo(() => {
    if (!calculated || !selectedTemplate) return null;
    const route = routes.routes.find((r) => r.id === selectedTemplate.routeId) ?? routes.routes[0];
    const fakeScenario = {
      user: { name: '', age: 0, occupation: '', floor: 8 },
      commute: {
        destination: selectedTemplate.destination,
        desiredArrivalTime: targetTime,
        selectedWalkingSpeed: selectedTemplate.walkingSpeed,
        selectedElevatorSpeed: selectedTemplate.elevatorSpeed,
        selectedRouteId: selectedTemplate.routeId,
      },
    };
    return calculateTimeline(fakeScenario, settings, route);
  }, [calculated, selectedTemplate, targetTime]);

  const handleCalculate = () => {
    setCalculated(true);
  };

  const handleSave = () => {
    onSave({ templateId, date, mode, targetTime });
  };

  return (
    <Dialog.Root open onOpenChange={(open) => { if (!open) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 z-50" />
        <Dialog.Content className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl max-h-[85vh] overflow-auto animate-slideUp">
          <div className="p-4">
            {/* Handle */}
            <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-4" />

            <Dialog.Title className="text-lg font-bold text-gray-900 mb-1">
              이동 계획 추가
            </Dialog.Title>
            <p className="text-sm text-gray-500 mb-4">{date}</p>

            {/* Template select */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-500 mb-1">템플릿 선택</label>
              <select
                value={templateId}
                onChange={(e) => { setTemplateId(e.target.value); setCalculated(false); }}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm"
              >
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            {/* Mode radio */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-500 mb-2">기준 시각</label>
              <div className="flex gap-3">
                <label className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm cursor-pointer transition-colors ${
                  mode === 'arrival' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600'
                }`}>
                  <input
                    type="radio"
                    name="mode"
                    value="arrival"
                    checked={mode === 'arrival'}
                    onChange={() => { setMode('arrival'); setCalculated(false); }}
                    className="sr-only"
                  />
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                  도착 시각
                </label>
                <label className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm cursor-pointer transition-colors ${
                  mode === 'departure' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600'
                }`}>
                  <input
                    type="radio"
                    name="mode"
                    value="departure"
                    checked={mode === 'departure'}
                    onChange={() => { setMode('departure'); setCalculated(false); }}
                    className="sr-only"
                  />
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                  출발 시각
                </label>
              </div>
            </div>

            {/* Time input */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-500 mb-1">
                {mode === 'arrival' ? '도착 희망 시각' : '출발 희망 시각'}
              </label>
              <input
                type="time"
                value={targetTime}
                onChange={(e) => { setTargetTime(e.target.value); setCalculated(false); }}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm"
              />
            </div>

            {/* Calculate button */}
            <button
              onClick={handleCalculate}
              className="w-full py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors mb-4"
            >
              시간 계산
            </button>

            {/* Result */}
            {result && (
              <div className="mb-4 space-y-3">
                {/* Summary bar */}
                <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                  <div className="text-center">
                    <p className="text-[10px] text-gray-500">출발</p>
                    <p className="text-lg font-bold text-blue-700">{result.departureTime}</p>
                  </div>
                  <div className="flex-1 flex items-center justify-center">
                    <div className="h-px flex-1 bg-blue-200" />
                    <span className="px-2 text-xs text-blue-500">{result.busNumber}번</span>
                    <div className="h-px flex-1 bg-blue-200" />
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-gray-500">도착</p>
                    <p className="text-lg font-bold text-blue-700">{result.desiredArrivalTime}</p>
                  </div>
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-semibold rounded">
                    {result.summary.stationArrivalProbability}%
                  </span>
                </div>

                {/* Detailed timeline */}
                <div className="bg-white border border-gray-200 rounded-lg p-3 max-h-[30vh] overflow-y-auto">
                  <p className="text-xs font-semibold text-gray-700 mb-2">상세 경로</p>
                  <div className="space-y-0">
                    {result.timeline.map((step, i) => {
                      const icons: Record<string, string> = {
                        '출발': '🏠', '정류장 도착': '🚏', '버스 탑승': '🚌', '버스 하차': '📍', '도착': '🏢',
                      };
                      return (
                        <div key={i} className="flex gap-2.5">
                          {/* Left: dot + line */}
                          <div className="flex flex-col items-center w-4 shrink-0">
                            <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                              i === 0 ? 'bg-green-500' : i === result.timeline.length - 1 ? 'bg-red-500' : 'bg-blue-500'
                            }`} />
                            {i < result.timeline.length - 1 && (
                              <div className="w-0.5 flex-1 bg-gray-200 my-0.5" />
                            )}
                          </div>

                          {/* Right: content */}
                          <div className="flex-1 pb-3">
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-bold text-gray-900">{step.time}</span>
                              <span className="text-xs">{icons[step.title] ?? '📌'}</span>
                              <span className="text-xs font-medium text-gray-700">{step.title}</span>
                            </div>
                            {step.details && step.details.length > 0 && (
                              <div className="mt-0.5">
                                {step.details.map((d, j) => (
                                  <p key={j} className="text-[11px] text-gray-400">{d}</p>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Detail tags */}
                  <div className="mt-2 pt-2 border-t border-gray-100 flex flex-wrap gap-1.5">
                    {result.summary.departureDetails.map((d, i) => (
                      <span key={i} className="px-2 py-0.5 bg-gray-50 border border-gray-200 text-[10px] text-gray-500 rounded">
                        {d}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Save */}
            <button
              onClick={handleSave}
              disabled={!calculated}
              className="w-full py-3 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              저장
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
