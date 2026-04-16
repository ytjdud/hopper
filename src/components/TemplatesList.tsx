import * as Dialog from '@radix-ui/react-dialog';
import type { Template } from '../data';

interface Props {
  templates: Template[];
  onClose: () => void;
}

export default function TemplatesList({ templates, onClose }: Props) {
  return (
    <Dialog.Root open onOpenChange={(open) => { if (!open) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 z-50" />
        <Dialog.Content className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl max-h-[70vh] overflow-auto">
          <div className="p-4">
            {/* Handle */}
            <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-4" />

            <Dialog.Title className="text-lg font-bold text-gray-900 mb-4">
              저장된 템플릿
            </Dialog.Title>

            {templates.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">저장된 템플릿이 없습니다.</p>
            ) : (
              <div className="space-y-2">
                {templates.map((tpl) => (
                  <div
                    key={tpl.id}
                    className="p-3 bg-gray-50 border border-gray-100 rounded-lg"
                  >
                    <p className="text-sm font-medium text-gray-800">{tpl.name}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-xs text-gray-500">{tpl.origin}</span>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2">
                        <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
                      </svg>
                      <span className="text-xs text-gray-500">{tpl.destination}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

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
