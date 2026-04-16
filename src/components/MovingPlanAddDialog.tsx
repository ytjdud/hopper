import { useState, useMemo } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import type { Template, MovingPlan, Waypoint } from '../data';
import { routes, settings } from '../data';
import { calculateTimeline } from '../utils/calculate';
import type { TimelineStep } from '../utils/calculate';
import WaypointRecommendDialog from './WaypointRecommendDialog';

interface Props {
  date: string;
  templates: Template[];
  onSave: (plan: Omit<MovingPlan, 'id'>) => void;
  onClose: () => void;
}

interface InsertedWaypoint {
  afterIndex: number;
  waypoint: Waypoint;
}

/** Parse "HH:MM" → minutes since midnight */
function timeToMin(t: string) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

export default function MovingPlanAddDialog({ date, templates, onSave, onClose }: Props) {
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? '');
  const [mode, setMode] = useState<'arrival' | 'departure'>('arrival');
  const [targetTime, setTargetTime] = useState('07:00');
  const [calculated, setCalculated] = useState(false);

  // Waypoint state
  const [insertedWaypoints, setInsertedWaypoints] = useState<InsertedWaypoint[]>([]);
  const [waypointDialog, setWaypointDialog] = useState<{
    afterIndex: number;
    fromStep: string;
    toStep: string;
    availableMinutes: number;
  } | null>(null);

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

  // Build merged timeline: original steps + inserted waypoints
  const mergedTimeline = useMemo(() => {
    if (!result) return [];
    type MergedStep = TimelineStep & { isWaypoint?: boolean; waypointData?: Waypoint; originalIndex?: number };
    const steps: MergedStep[] = result.timeline.map((s, i) => ({ ...s, originalIndex: i }));

    // Sort inserted waypoints by afterIndex descending so splicing doesn't shift indices
    const sorted = [...insertedWaypoints].sort((a, b) => b.afterIndex - a.afterIndex);
    sorted.forEach(({ afterIndex, waypoint }) => {
      // Compute waypoint time: midpoint between the two surrounding steps
      const prevStep = steps.find((s) => s.originalIndex === afterIndex);
      if (!prevStep) return;
      const prevMin = timeToMin(prevStep.time);
      const wpMin = prevMin + Math.floor(waypoint.estimatedMinutes / 2);
      const hh = String(Math.floor(wpMin / 60)).padStart(2, '0');
      const mm = String(wpMin % 60).padStart(2, '0');

      const wpStep: MergedStep = {
        time: `${hh}:${mm}`,
        title: waypoint.name,
        description: waypoint.description,
        details: [`${waypoint.categoryLabel} · 약 ${waypoint.estimatedMinutes}분 소요`],
        isWaypoint: true,
        waypointData: waypoint,
      };

      // Find insertion position
      const insertAt = steps.findIndex((s) => s.originalIndex === afterIndex) + 1;
      steps.splice(insertAt, 0, wpStep);
    });

    return steps;
  }, [result, insertedWaypoints]);

  const handleCalculate = () => {
    setCalculated(true);
    setInsertedWaypoints([]); // Reset waypoints on recalculate
  };

  const handleSave = () => {
    onSave({ templateId, date, mode, targetTime });
  };

  const handleOpenWaypointDialog = (afterIndex: number) => {
    if (!result) return;
    const fromStep = result.timeline[afterIndex];
    const toStep = result.timeline[afterIndex + 1];
    if (!fromStep || !toStep) return;

    const available = timeToMin(toStep.time) - timeToMin(fromStep.time);
    // Subtract already-inserted waypoints in this gap
    const usedMinutes = insertedWaypoints
      .filter((w) => w.afterIndex === afterIndex)
      .reduce((sum, w) => sum + w.waypoint.estimatedMinutes, 0);

    setWaypointDialog({
      afterIndex,
      fromStep: fromStep.title,
      toStep: toStep.title,
      availableMinutes: Math.max(0, available - usedMinutes),
    });
  };

  const handleWaypointSelect = (waypoint: Waypoint) => {
    if (!waypointDialog) return;
    setInsertedWaypoints((prev) => [
      ...prev,
      { afterIndex: waypointDialog.afterIndex, waypoint },
    ]);
    setWaypointDialog(null);
  };

  const handleRemoveWaypoint = (wpId: string) => {
    setInsertedWaypoints((prev) => prev.filter((w) => w.waypoint.id !== wpId));
  };

  const icons: Record<string, string> = {
    '출발': '🏠', '정류장 도착': '🚏', '버스 탑승': '🚌', '버스 하차': '📍', '도착': '🏢',
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
                onChange={(e) => { setTemplateId(e.target.value); setCalculated(false); setInsertedWaypoints([]); }}
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
                  <input type="radio" name="mode" value="arrival" checked={mode === 'arrival'}
                    onChange={() => { setMode('arrival'); setCalculated(false); }} className="sr-only" />
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                  도착 시각
                </label>
                <label className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm cursor-pointer transition-colors ${
                  mode === 'departure' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600'
                }`}>
                  <input type="radio" name="mode" value="departure" checked={mode === 'departure'}
                    onChange={() => { setMode('departure'); setCalculated(false); }} className="sr-only" />
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
              <input type="time" value={targetTime}
                onChange={(e) => { setTargetTime(e.target.value); setCalculated(false); }}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm" />
            </div>

            {/* Calculate button */}
            <button onClick={handleCalculate}
              className="w-full py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors mb-4">
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

                {/* Detailed timeline with waypoint insert buttons */}
                <div className="bg-white border border-gray-200 rounded-lg p-3 max-h-[35vh] overflow-y-auto">
                  <p className="text-xs font-semibold text-gray-700 mb-2">상세 경로</p>
                  <div className="space-y-0">
                    {mergedTimeline.map((step, i) => {
                      const isWp = 'isWaypoint' in step && step.isWaypoint;
                      // Determine if we should show the "add waypoint" button after this step
                      // Only show between original steps (not after waypoints, not after the last step)
                      const isOriginal = !isWp;
                      const nextStep = mergedTimeline[i + 1];
                      const showAddBtn = isOriginal && nextStep && i < mergedTimeline.length - 1;
                      // Find the original index for the add button
                      const origIdx = 'originalIndex' in step ? (step as any).originalIndex : undefined;

                      return (
                        <div key={i}>
                          {/* Step row */}
                          <div className="flex gap-2.5">
                            {/* Left: dot + line */}
                            <div className="flex flex-col items-center w-4 shrink-0">
                              <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                                isWp
                                  ? 'bg-amber-400'
                                  : i === 0
                                  ? 'bg-green-500'
                                  : !nextStep && !isWp
                                  ? 'bg-red-500'
                                  : 'bg-blue-500'
                              }`} />
                              {i < mergedTimeline.length - 1 && (
                                <div className={`w-0.5 flex-1 my-0.5 ${isWp ? 'bg-amber-200' : 'bg-gray-200'}`} />
                              )}
                            </div>

                            {/* Right: content */}
                            <div className="flex-1 pb-2">
                              <div className="flex items-center gap-1.5">
                                <span className={`text-sm font-bold ${isWp ? 'text-amber-600' : 'text-gray-900'}`}>{step.time}</span>
                                <span className="text-xs">{isWp ? (step as any).waypointData?.icon ?? '📍' : icons[step.title] ?? '📌'}</span>
                                <span className={`text-xs font-medium ${isWp ? 'text-amber-700' : 'text-gray-700'}`}>{step.title}</span>
                                {/* Remove button for waypoints */}
                                {isWp && (step as any).waypointData && (
                                  <button
                                    onClick={() => handleRemoveWaypoint((step as any).waypointData.id)}
                                    className="ml-auto text-gray-300 hover:text-red-400 transition-colors"
                                    title="경유지 제거"
                                  >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                  </button>
                                )}
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

                          {/* Add waypoint button — between original steps */}
                          {showAddBtn && origIdx !== undefined && origIdx < result.timeline.length - 1 && (
                            <div className="flex gap-2.5 my-0.5">
                              <div className="w-4 flex justify-center shrink-0">
                                <div className="w-0.5 h-full bg-gray-100" />
                              </div>
                              <button
                                onClick={() => handleOpenWaypointDialog(origIdx)}
                                className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-full text-[11px] text-amber-600 font-medium hover:bg-amber-100 transition-colors"
                              >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                                </svg>
                                경유지 추가
                              </button>
                            </div>
                          )}
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
                    {insertedWaypoints.length > 0 && (
                      <span className="px-2 py-0.5 bg-amber-50 border border-amber-200 text-[10px] text-amber-600 rounded">
                        경유지 {insertedWaypoints.length}곳 · +{insertedWaypoints.reduce((s, w) => s + w.waypoint.estimatedMinutes, 0)}분
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Save */}
            <button onClick={handleSave} disabled={!calculated}
              className="w-full py-3 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors">
              저장
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>

      {/* Waypoint recommendation dialog */}
      {waypointDialog && (
        <WaypointRecommendDialog
          fromStep={waypointDialog.fromStep}
          toStep={waypointDialog.toStep}
          availableMinutes={waypointDialog.availableMinutes}
          onSelect={handleWaypointSelect}
          onClose={() => setWaypointDialog(null)}
        />
      )}
    </Dialog.Root>
  );
}
