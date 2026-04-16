import { useEffect, useRef, useState } from 'react';
import { mapRoute, routes, settings, scenario } from '../data';
import { calculateTimeline } from '../utils/calculate';

declare global {
  interface Window {
    naver: any;
  }
}

export default function MapPage() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Calculate current timeline for info bar
  const route = routes.routes.find((r) => r.id === scenario.commute.selectedRouteId) ?? routes.routes[0];
  const result = calculateTimeline(scenario, settings, route);

  useEffect(() => {
    // Load Naver Maps script
    if (window.naver?.maps) {
      setMapLoaded(true);
      return;
    }
    const script = document.createElement('script');
    script.src =
      `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${import.meta.env.VITE_NCP_CLIENT_ID}`;
    script.async = true;
    script.onload = () => setMapLoaded(true);
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (!mapLoaded || !mapRef.current || !window.naver?.maps) return;

    const { naver } = window;
    const center = new naver.maps.LatLng(mapRoute.origin.lat, mapRoute.origin.lng);

    const map = new naver.maps.Map(mapRef.current, {
      center,
      zoom: 13,
      mapTypeControl: false,
    });

    // Walk path (origin → bus stop): dashed blue
    new naver.maps.Polyline({
      map,
      path: mapRoute.walkPath.map((p: any) => new naver.maps.LatLng(p.lat, p.lng)),
      strokeColor: '#3B82F6',
      strokeWeight: 4,
      strokeStyle: 'shortdash',
    });

    // Bus path: solid blue
    new naver.maps.Polyline({
      map,
      path: mapRoute.busPath.map((p: any) => new naver.maps.LatLng(p.lat, p.lng)),
      strokeColor: '#2563EB',
      strokeWeight: 5,
    });

    // Walk path from stop: dashed blue
    new naver.maps.Polyline({
      map,
      path: mapRoute.walkPathFromStop.map((p: any) => new naver.maps.LatLng(p.lat, p.lng)),
      strokeColor: '#3B82F6',
      strokeWeight: 4,
      strokeStyle: 'shortdash',
    });

    // Markers
    const markerData = [
      { pos: mapRoute.origin, title: '출발', color: '#22C55E' },
      { pos: mapRoute.busStop, title: '버스 정류장', color: '#3B82F6' },
      { pos: mapRoute.destinationStop, title: '하차 정류장', color: '#3B82F6' },
      { pos: mapRoute.destination, title: '도착', color: '#EF4444' },
    ];

    markerData.forEach(({ pos, title, color }) => {
      new naver.maps.Marker({
        position: new naver.maps.LatLng(pos.lat, pos.lng),
        map,
        title,
        icon: {
          content: `<div style="background:${color};color:#fff;padding:4px 8px;border-radius:12px;font-size:11px;font-weight:600;white-space:nowrap;box-shadow:0 2px 4px rgba(0,0,0,0.2)">${title}</div>`,
          anchor: new naver.maps.Point(30, 14),
        },
      });
    });

    // Fit bounds
    const bounds = new naver.maps.LatLngBounds(
      new naver.maps.LatLng(
        Math.min(mapRoute.origin.lat, mapRoute.destination.lat) - 0.005,
        Math.min(mapRoute.origin.lng, mapRoute.destination.lng) - 0.005
      ),
      new naver.maps.LatLng(
        Math.max(mapRoute.origin.lat, mapRoute.destination.lat) + 0.005,
        Math.max(mapRoute.origin.lng, mapRoute.destination.lng) + 0.005
      )
    );
    map.fitBounds(bounds);
  }, [mapLoaded]);

  return (
    <div className="flex flex-col h-[calc(100vh-56px)]">
      {/* Map area */}
      <div ref={mapRef} className="flex-1 bg-gray-200 relative">
        {!mapLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 bg-blue-100 rounded-full flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
                  <line x1="8" y1="2" x2="8" y2="18" />
                  <line x1="16" y1="6" x2="16" y2="22" />
                </svg>
              </div>
              <p className="text-sm text-gray-500">지도를 불러오는 중...</p>
              <p className="text-xs text-gray-400 mt-1">Naver Map API 키를 설정하세요</p>
            </div>
          </div>
        )}
      </div>

      {/* Route Detail Panel (bottom sheet) */}
      <div className="h-[45vh] flex flex-col bg-white border-t border-gray-200">
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-100 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded">
                {route.busNumber}번
              </span>
              <span className="text-sm font-medium text-gray-700">
                {mapRoute.origin.label} → {mapRoute.destination.label}
              </span>
            </div>
            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded">
              {result.summary.stationArrivalProbability}% 탑승 확률
            </span>
          </div>
        </div>

        {/* Scrollable timeline */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          <div className="space-y-0">
            {result.timeline.map((step, i) => {
              const icons: Record<string, string> = {
                '출발': '🏠', '정류장 도착': '🚏', '버스 탑승': '🚌', '버스 하차': '📍', '도착': '🏢',
              };
              return (
                <div key={i} className="flex gap-3">
                  {/* Left: vertical line */}
                  <div className="flex flex-col items-center w-5 shrink-0">
                    <div className={`w-3 h-3 rounded-full shrink-0 ${
                      i === 0 ? 'bg-green-500' : i === result.timeline.length - 1 ? 'bg-red-500' : 'bg-blue-500'
                    }`} />
                    {i < result.timeline.length - 1 && (
                      <div className="w-0.5 flex-1 bg-gray-200 my-1" />
                    )}
                  </div>

                  {/* Right: content */}
                  <div className={`flex-1 pb-5 ${i < result.timeline.length - 1 ? '' : ''}`}>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-lg font-bold text-gray-900">{step.time}</span>
                      <span className="text-sm">{icons[step.title] ?? '📌'}</span>
                      <span className="text-sm font-medium text-gray-700">{step.title}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-0.5">{step.description}</p>
                    {step.details && step.details.length > 0 && (
                      <div className="mt-1 space-y-0.5">
                        {step.details.map((d, j) => (
                          <p key={j} className="text-xs text-gray-400">{d}</p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Additional info */}
          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs font-medium text-gray-500 mb-1">소요 시간 상세</p>
            <div className="flex flex-wrap gap-2">
              {result.summary.departureDetails.map((d, i) => (
                <span key={i} className="px-2 py-1 bg-white border border-gray-200 text-xs text-gray-600 rounded">
                  {d}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
