import type { CalculationResult } from '../utils/calculate';

interface SummaryCardProps {
  result: CalculationResult;
}

export function SummaryCard({ result }: SummaryCardProps) {
  return (
    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow-md p-6 border border-blue-200 space-y-4">
      <h2 className="text-lg font-bold text-gray-900">
        {result.desiredArrivalTime}까지 도착하려면,
      </h2>

      {/* Station Arrival Info */}
      <div className="bg-white rounded-lg p-4 border border-blue-200">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
          </svg>
          <div className="flex-1">
            <p className="text-gray-700 text-sm mb-1">정류장 도착 시간</p>
            <p className="text-2xl font-bold text-blue-600">
              {result.summary.stationArrivalTime}
            </p>
            <p className="text-gray-600 text-xs mt-1">
              정류장에 도착해야 합니다
            </p>
          </div>
          <div className="bg-amber-100 text-amber-800 px-2 py-1 rounded text-xs font-semibold">
            {result.summary.stationArrivalProbability}% 확률
          </div>
        </div>
      </div>

      {/* Departure Info */}
      <div className="bg-white rounded-lg p-4 border border-amber-200">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
          </svg>
          <div className="flex-1">
            <p className="text-gray-700 text-sm mb-1">집 출발 시간</p>
            <p className="text-2xl font-bold text-amber-600">
              {result.summary.departureTime}
            </p>
            <div className="mt-2 text-xs text-gray-600 space-y-1">
              {result.summary.departureDetails.map((detail, idx) => (
                <p key={idx} className="flex items-center gap-1">
                  <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                  {detail}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
