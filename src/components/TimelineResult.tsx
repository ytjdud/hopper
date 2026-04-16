import type { CalculationResult } from '../utils/calculate';

interface TimelineResultProps {
  result: CalculationResult;
}

type IconType = React.FC<{ className: string }>;

const icons: IconType[] = [
  ({ className }) => (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
    </svg>
  ),
  ({ className }) => (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
    </svg>
  ),
  ({ className }) => (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M18 18.5a1.5 1.5 0 01-3 0m-2 0a1.5 1.5 0 01-3 0m-2 0a1.5 1.5 0 01-3 0M3 6.5h18v9H3z" />
    </svg>
  ),
  ({ className }) => (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
    </svg>
  ),
  ({ className }) => (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
    </svg>
  ),
];

export function TimelineResult({ result }: TimelineResultProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-lg font-bold text-gray-900 mb-6">이동 일정</h2>

      {/* Vertical Timeline */}
      <div className="space-y-0">
        {result.timeline.map((step, index) => {
          const Icon = icons[index] || icons[4];
          const isLast = index === result.timeline.length - 1;

          return (
            <div key={index} className="flex gap-4 pb-6">
              {/* Timeline line and icon */}
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 z-10 relative">
                  <Icon className="w-5 h-5 text-white" />
                </div>
                {!isLast && (
                  <div className="w-0.5 h-16 bg-blue-200 mt-2"></div>
                )}
              </div>

              {/* Timeline content */}
              <div className="flex-1 pt-1">
                <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                  {step.title}
                </h3>
                <p className="text-xl font-bold text-gray-900 mt-1">
                  {step.description}
                </p>
                {step.details && step.details.length > 0 && (
                  <div className="mt-2 text-xs text-gray-600 space-y-1">
                    {step.details.map((detail, idx) => (
                      <p key={idx} className="flex items-center gap-2">
                        <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                        {detail}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Box */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="bg-gray-50 rounded-lg p-4 text-sm">
          <p className="text-gray-700">
            <span className="font-semibold">{result.busNumber}번 버스</span>를 이용하면 목표
            시간인 <span className="font-semibold">{result.desiredArrivalTime}</span>에
            도착할 수 있습니다.
          </p>
        </div>
      </div>
    </div>
  );
}
