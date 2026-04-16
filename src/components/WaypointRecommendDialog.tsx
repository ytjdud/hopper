import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import type { Waypoint } from '../data';
import { waypoints } from '../data';

interface Props {
  /** The two timeline step titles between which the waypoint is being inserted */
  fromStep: string;
  toStep: string;
  /** Available minutes between the two steps */
  availableMinutes: number;
  onSelect: (waypoint: Waypoint) => void;
  onClose: () => void;
}

const categories = [
  { key: 'all', label: '전체' },
  { key: 'cafe', label: '카페' },
  { key: 'drugstore', label: '드러그스토어' },
  { key: 'convenience', label: '편의점' },
  { key: 'bookstore', label: '서점' },
  { key: 'store', label: '생활용품' },
];

export default function WaypointRecommendDialog({
  fromStep,
  toStep,
  availableMinutes,
  onSelect,
  onClose,
}: Props) {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filtered = waypoints.filter((wp) => {
    if (selectedCategory !== 'all' && wp.category !== selectedCategory) return false;
    // Only show waypoints that fit within available time
    return wp.estimatedMinutes <= availableMinutes;
  });

  const tooLong = waypoints.filter(
    (wp) =>
      wp.estimatedMinutes > availableMinutes &&
      (selectedCategory === 'all' || wp.category === selectedCategory)
  );

  return (
    <Dialog.Root open onOpenChange={(open) => { if (!open) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-[60]" />
        <Dialog.Content className="fixed bottom-0 left-0 right-0 z-[60] bg-white rounded-t-2xl max-h-[80vh] overflow-auto animate-slideUp">
          <div className="p-4">
            {/* Handle */}
            <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-4" />

            <Dialog.Title className="text-lg font-bold text-gray-900 mb-1">
              경유지 추천
            </Dialog.Title>
            <p className="text-sm text-gray-500 mb-1">
              <span className="font-medium text-gray-700">{fromStep}</span>
              {' → '}
              <span className="font-medium text-gray-700">{toStep}</span>
              {' 구간'}
            </p>
            <p className="text-xs text-blue-600 mb-4">
              여유 시간 약 <span className="font-bold">{availableMinutes}분</span> — 이 시간 안에 들를 수 있는 장소를 추천합니다.
            </p>

            {/* Category filter */}
            <div className="flex gap-1.5 overflow-x-auto pb-3 mb-3 -mx-4 px-4">
              {categories.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => setSelectedCategory(cat.key)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                    selectedCategory === cat.key
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Recommended list */}
            {filtered.length > 0 ? (
              <div className="space-y-2 mb-3">
                {filtered.map((wp) => (
                  <button
                    key={wp.id}
                    onClick={() => onSelect(wp)}
                    className="w-full text-left p-3 bg-gray-50 border border-gray-100 rounded-lg hover:bg-blue-50 hover:border-blue-200 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{wp.icon}</span>
                        <div>
                          <p className="text-sm font-medium text-gray-800">{wp.name}</p>
                          <p className="text-xs text-gray-500">{wp.description}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-2">
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded">
                          약 {wp.estimatedMinutes}분
                        </span>
                        <p className="text-[10px] text-gray-400 mt-0.5">{wp.categoryLabel}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center">
                <p className="text-sm text-gray-400">여유 시간 내에 들를 수 있는 장소가 없습니다.</p>
              </div>
            )}

            {/* Too long - greyed out */}
            {tooLong.length > 0 && (
              <div className="mb-3">
                <p className="text-[10px] text-gray-400 mb-1.5">시간 초과 (여유 시간 부족)</p>
                <div className="space-y-1.5 opacity-50">
                  {tooLong.map((wp) => (
                    <div key={wp.id} className="p-2.5 bg-gray-50 border border-gray-100 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{wp.icon}</span>
                          <span className="text-xs text-gray-500">{wp.name}</span>
                        </div>
                        <span className="px-2 py-0.5 bg-red-50 text-red-400 text-[10px] rounded">
                          {wp.estimatedMinutes}분 필요
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={onClose}
              className="w-full py-3 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
            >
              닫기
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
