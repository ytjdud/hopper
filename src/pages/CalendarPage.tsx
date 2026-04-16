import { useState, useMemo } from 'react';
import type { Template, MovingPlan } from '../data';
import { routes, settings } from '../data';
import { calculateTimeline } from '../utils/calculate';
import MovingPlanAddDialog from '../components/MovingPlanAddDialog';
import DetailedPlanDialog from '../components/DetailedPlanDialog';
import TemplatesList from '../components/TemplatesList';
import { useNavigate } from 'react-router-dom';

interface Props {
  templates: Template[];
  plans: MovingPlan[];
  onAddPlan: (plan: Omit<MovingPlan, 'id'>) => void;
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export default function CalendarPage({ templates, plans, onAddPlan }: Props) {
  const navigate = useNavigate();
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const [showPlanDialog, setShowPlanDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');

  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<MovingPlan | null>(null);

  const [showTemplates, setShowTemplates] = useState(false);

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfWeek(year, month);
  const weekdays = ['일', '월', '화', '수', '목', '금', '토'];

  const plansByDate = useMemo(() => {
    const map: Record<string, MovingPlan[]> = {};
    plans.forEach((p) => {
      if (!map[p.date]) map[p.date] = [];
      map[p.date].push(p);
    });
    return map;
  }, [plans]);

  const prevMonth = () => {
    if (month === 0) { setYear(year - 1); setMonth(11); }
    else setMonth(month - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setYear(year + 1); setMonth(0); }
    else setMonth(month + 1);
  };

  const handleDayClick = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayPlans = plansByDate[dateStr];

    if (dayPlans && dayPlans.length > 0) {
      // Click existing plan → show detail
      setSelectedPlan(dayPlans[0]);
      setShowDetailDialog(true);
    } else {
      // Empty day → add plan
      setSelectedDate(dateStr);
      setShowPlanDialog(true);
    }
  };

  const handlePlanAdded = (plan: Omit<MovingPlan, 'id'>) => {
    onAddPlan(plan);
    setShowPlanDialog(false);
  };

  // Compute detail for selected plan
  const selectedPlanDetail = useMemo(() => {
    if (!selectedPlan) return null;
    const tpl = templates.find((t) => t.id === selectedPlan.templateId);
    if (!tpl) return null;
    const route = routes.routes.find((r) => r.id === tpl.routeId) ?? routes.routes[0];
    const fakeScenario = {
      user: { name: '', age: 0, occupation: '', floor: 8 },
      commute: {
        destination: tpl.destination,
        desiredArrivalTime: selectedPlan.targetTime,
        selectedWalkingSpeed: tpl.walkingSpeed,
        selectedElevatorSpeed: tpl.elevatorSpeed,
        selectedRouteId: tpl.routeId,
      },
    };
    return {
      template: tpl,
      result: calculateTimeline(fakeScenario, settings, route),
    };
  }, [selectedPlan, templates]);

  return (
    <div className="flex flex-col h-[calc(100vh-56px)] bg-gray-50">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
        <button
          onClick={() => navigate('/templates/new')}
          className="flex items-center gap-1 text-sm text-blue-600 font-medium"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          템플릿 추가
        </button>

        <div className="flex items-center gap-3">
          <button onClick={prevMonth} className="p-1 text-gray-500 hover:text-gray-700">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
          <span className="text-sm font-semibold text-gray-800">
            {year}년 {month + 1}월
          </span>
          <button onClick={nextMonth} className="p-1 text-gray-500 hover:text-gray-700">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
          </button>
        </div>

        <button
          onClick={() => setShowTemplates(true)}
          className="p-2 text-gray-500 hover:text-gray-700"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      </div>

      {/* Calendar grid */}
      <div className="flex-1 overflow-auto px-2 py-2">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 mb-1">
          {weekdays.map((d, i) => (
            <div key={d} className={`text-center text-xs font-medium py-1 ${i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-gray-400'}`}>
              {d}
            </div>
          ))}
        </div>

        {/* Days */}
        <div className="grid grid-cols-7 gap-px">
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} className="h-16" />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayPlans = plansByDate[dateStr] || [];
            const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
            const dayOfWeek = (firstDay + i) % 7;

            return (
              <button
                key={day}
                onClick={() => handleDayClick(day)}
                className={`h-16 rounded-lg flex flex-col items-center pt-1 transition-colors ${
                  isToday ? 'bg-blue-50 border border-blue-200' : 'bg-white hover:bg-gray-50 border border-gray-100'
                }`}
              >
                <span className={`text-xs font-medium ${
                  isToday ? 'text-blue-600' : dayOfWeek === 0 ? 'text-red-400' : dayOfWeek === 6 ? 'text-blue-400' : 'text-gray-700'
                }`}>
                  {day}
                </span>
                {dayPlans.length > 0 && (
                  <div className="mt-1 flex flex-col gap-0.5">
                    {dayPlans.slice(0, 2).map((p) => {
                      const tpl = templates.find((t) => t.id === p.templateId);
                      return (
                        <span key={p.id} className="text-[9px] px-1 py-0.5 bg-blue-100 text-blue-700 rounded truncate max-w-[50px]">
                          {tpl?.name?.slice(0, 6) ?? '계획'}
                        </span>
                      );
                    })}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Dialogs */}
      {showPlanDialog && (
        <MovingPlanAddDialog
          date={selectedDate}
          templates={templates}
          onSave={handlePlanAdded}
          onClose={() => setShowPlanDialog(false)}
        />
      )}

      {showDetailDialog && selectedPlan && selectedPlanDetail && (
        <DetailedPlanDialog
          plan={selectedPlan}
          template={selectedPlanDetail.template}
          result={selectedPlanDetail.result}
          onClose={() => { setShowDetailDialog(false); setSelectedPlan(null); }}
        />
      )}

      {showTemplates && (
        <TemplatesList
          templates={templates}
          onClose={() => setShowTemplates(false)}
        />
      )}
    </div>
  );
}
