import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Template, SpeedLevel } from '../data';
import { settings, routes, mapRoute } from '../data';

declare global {
  interface Window {
    naver: any;
  }
}

interface Props {
  onSave: (tpl: Omit<Template, 'id'>) => void;
}

export default function TemplateAddPage({ onSave }: Props) {
  const navigate = useNavigate();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const polylinesRef = useRef<any[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);

  const [name, setName] = useState('');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [walkingSpeed, setWalkingSpeed] = useState<SpeedLevel>('normal');
  const [elevatorSpeed, setElevatorSpeed] = useState<SpeedLevel>('normal');
  const [routeFound, setRouteFound] = useState(false);
  const [selectedRouteId, setSelectedRouteId] = useState(routes.routes[0].id);

  // Load Naver Maps script
  useEffect(() => {
    if (window.naver?.maps) { setMapLoaded(true); return; }
    const script = document.createElement('script');
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${import.meta.env.VITE_NCP_CLIENT_ID}`;
    script.async = true;
    script.onload = () => setMapLoaded(true);
    document.head.appendChild(script);
  }, []);

  // Initialize map once loaded (always visible)
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || !window.naver?.maps || mapInstanceRef.current) return;
    const { naver } = window;
    // Default center: midpoint between origin and destination
    const centerLat = (mapRoute.origin.lat + mapRoute.destination.lat) / 2;
    const centerLng = (mapRoute.origin.lng + mapRoute.destination.lng) / 2;
    mapInstanceRef.current = new naver.maps.Map(mapRef.current, {
      center: new naver.maps.LatLng(centerLat, centerLng),
      zoom: 12,
      mapTypeControl: false,
    });
  }, [mapLoaded]);

  // Helper: add a marker
  const addMarker = useCallback((lat: number, lng: number, title: string, color: string) => {
    if (!mapInstanceRef.current || !window.naver?.maps) return;
    const { naver } = window;
    const marker = new naver.maps.Marker({
      position: new naver.maps.LatLng(lat, lng),
      map: mapInstanceRef.current,
      title,
      icon: {
        content: `<div style="background:${color};color:#fff;padding:4px 10px;border-radius:12px;font-size:11px;font-weight:600;white-space:nowrap;box-shadow:0 2px 4px rgba(0,0,0,0.2)">${title}</div>`,
        anchor: new naver.maps.Point(30, 14),
      },
    });
    markersRef.current.push(marker);
    return marker;
  }, []);

  // React to origin input — show origin marker
  useEffect(() => {
    if (!mapInstanceRef.current || !window.naver?.maps) return;
    // Remove existing origin marker (first one if exists)
    const existingOrigin = markersRef.current.find((m) => m.getTitle() === '출발지');
    if (existingOrigin) {
      existingOrigin.setMap(null);
      markersRef.current = markersRef.current.filter((m) => m !== existingOrigin);
    }

    if (origin.trim()) {
      addMarker(mapRoute.origin.lat, mapRoute.origin.lng, '출발지', '#22C55E');
      mapInstanceRef.current.panTo(
        new window.naver.maps.LatLng(mapRoute.origin.lat, mapRoute.origin.lng)
      );
    }
  }, [origin, mapLoaded, addMarker]);

  // React to destination input — show destination marker
  useEffect(() => {
    if (!mapInstanceRef.current || !window.naver?.maps) return;
    const existingDest = markersRef.current.find((m) => m.getTitle() === '도착지');
    if (existingDest) {
      existingDest.setMap(null);
      markersRef.current = markersRef.current.filter((m) => m !== existingDest);
    }

    if (destination.trim()) {
      addMarker(mapRoute.destination.lat, mapRoute.destination.lng, '도착지', '#EF4444');

      // If both markers exist, fit bounds
      if (origin.trim()) {
        const { naver } = window;
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
        mapInstanceRef.current.fitBounds(bounds);
      } else {
        mapInstanceRef.current.panTo(
          new window.naver.maps.LatLng(mapRoute.destination.lat, mapRoute.destination.lng)
        );
      }
    }
  }, [destination, mapLoaded, origin, addMarker]);

  // Draw route on map when route is found and route selection changes
  useEffect(() => {
    if (!routeFound || !mapInstanceRef.current || !window.naver?.maps) return;
    const { naver } = window;

    // Clear previous polylines only
    polylinesRef.current.forEach((p) => p.setMap(null));
    polylinesRef.current = [];

    // Remove old bus stop markers
    markersRef.current
      .filter((m) => m.getTitle() === '버스정류장' || m.getTitle() === '하차정류장')
      .forEach((m) => m.setMap(null));
    markersRef.current = markersRef.current.filter(
      (m) => m.getTitle() !== '버스정류장' && m.getTitle() !== '하차정류장'
    );

    // Walk to stop (dashed)
    const walkToLine = new naver.maps.Polyline({
      map: mapInstanceRef.current,
      path: mapRoute.walkPath.map((p: any) => new naver.maps.LatLng(p.lat, p.lng)),
      strokeColor: '#3B82F6',
      strokeWeight: 4,
      strokeStyle: 'shortdash',
    });
    polylinesRef.current.push(walkToLine);

    // Bus route (solid)
    const busLine = new naver.maps.Polyline({
      map: mapInstanceRef.current,
      path: mapRoute.busPath.map((p: any) => new naver.maps.LatLng(p.lat, p.lng)),
      strokeColor: '#2563EB',
      strokeWeight: 5,
    });
    polylinesRef.current.push(busLine);

    // Walk from stop (dashed)
    const walkFromLine = new naver.maps.Polyline({
      map: mapInstanceRef.current,
      path: mapRoute.walkPathFromStop.map((p: any) => new naver.maps.LatLng(p.lat, p.lng)),
      strokeColor: '#3B82F6',
      strokeWeight: 4,
      strokeStyle: 'shortdash',
    });
    polylinesRef.current.push(walkFromLine);

    // Bus stop markers
    addMarker(mapRoute.busStop.lat, mapRoute.busStop.lng, '버스정류장', '#3B82F6');
    addMarker(mapRoute.destinationStop.lat, mapRoute.destinationStop.lng, '하차정류장', '#3B82F6');

    // Fit bounds to show entire route
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
    mapInstanceRef.current.fitBounds(bounds);
  }, [routeFound, selectedRouteId, addMarker]);

  const handleSearch = () => {
    setRouteFound(true);
  };

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      origin: origin || '강남역 주변',
      destination: destination || 'NHN Play Museum',
      routeId: selectedRouteId,
      walkingSpeed,
      elevatorSpeed,
    });
    navigate('/calendar');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-56px)] bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 shrink-0">
        <button onClick={() => navigate('/calendar')} className="text-sm text-gray-500">
          ← 돌아가기
        </button>
        <span className="text-sm font-semibold text-gray-800">새 템플릿</span>
        <div className="w-16" />
      </div>

      {/* Map — always visible */}
      <div ref={mapRef} className="h-[35vh] shrink-0 bg-gray-200 relative">
        {!mapLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="text-center">
              <div className="w-10 h-10 mx-auto mb-2 bg-blue-100 rounded-full flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
                  <line x1="8" y1="2" x2="8" y2="18" />
                  <line x1="16" y1="6" x2="16" y2="22" />
                </svg>
              </div>
              <p className="text-xs text-gray-400">지도를 불러오는 중...</p>
            </div>
          </div>
        )}
      </div>

      {/* Scrollable form area */}
      <div className="flex-1 overflow-auto">
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">템플릿 이름</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 출근 (NHN Play Museum)"
              className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">출발지</label>
            <input
              type="text"
              value={origin}
              onChange={(e) => { setOrigin(e.target.value); setRouteFound(false); }}
              placeholder="강남역 주변"
              className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">목적지</label>
            <input
              type="text"
              value={destination}
              onChange={(e) => { setDestination(e.target.value); setRouteFound(false); }}
              placeholder="NHN Play Museum"
              className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            onClick={handleSearch}
            disabled={!origin.trim() || !destination.trim()}
            className="w-full py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            경로 찾기
          </button>

          {/* Route selection & settings — shown after search */}
          {routeFound && (
            <div className="space-y-4 pt-2 border-t border-gray-200">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">노선 선택</label>
                <select
                  value={selectedRouteId}
                  onChange={(e) => setSelectedRouteId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm"
                >
                  {routes.routes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.busNumber}번 · 평균 {r.avgRideMinutes}분 소요
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">보행 속도</label>
                  <select
                    value={walkingSpeed}
                    onChange={(e) => setWalkingSpeed(e.target.value as SpeedLevel)}
                    className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm"
                  >
                    {(Object.entries(settings.walkingSpeed) as [SpeedLevel, any][]).map(([key, val]) => (
                      <option key={key} value={key}>{val.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">엘리베이터</label>
                  <select
                    value={elevatorSpeed}
                    onChange={(e) => setElevatorSpeed(e.target.value as SpeedLevel)}
                    className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm"
                  >
                    {(Object.entries(settings.elevatorSpeed) as [SpeedLevel, any][]).map(([key, val]) => (
                      <option key={key} value={key}>{val.label} ({val.description})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
                <p className="text-xs text-blue-700 font-medium">
                  {routes.routes.find((r) => r.id === selectedRouteId)?.busNumber}번 버스
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {routes.routes.find((r) => r.id === selectedRouteId)?.departure} → {routes.routes.find((r) => r.id === selectedRouteId)?.arrival}
                  · 평균 {routes.routes.find((r) => r.id === selectedRouteId)?.avgRideMinutes}분
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Save button */}
      <div className="p-4 bg-white border-t border-gray-200 shrink-0">
        <button
          onClick={handleSave}
          disabled={!name.trim() || !routeFound}
          className="w-full py-3 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          저장
        </button>
      </div>
    </div>
  );
}
