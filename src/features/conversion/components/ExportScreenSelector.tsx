import React from 'react';
import { CheckSquare, Square, AlertCircle, FileCode, AlertTriangle } from 'lucide-react';
import type { LegacyScreen } from '@/features/screens/types/screen';
import { StatusBadge } from '@/shared/ui/Badge';

export interface ExportScreenSelectorProps {
  screens: LegacyScreen[];
  selectedScreenIds: string[];
  onToggleScreen: (screenId: string) => void;
  onSelectAllConverted: () => void;
  onDeselectAll: () => void;
}

export const ExportScreenSelector: React.FC<ExportScreenSelectorProps> = ({
  screens,
  selectedScreenIds,
  onToggleScreen,
  onSelectAllConverted,
  onDeselectAll,
}) => {
  const convertedScreens = screens.filter((s) => s.status === 'Completed');
  const hasUnreadySelected = screens.some(
    (s) => selectedScreenIds.includes(s.id) && s.status !== 'Completed'
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            SCREEN SELECTION ({selectedScreenIds.length}/{screens.length})
          </label>
          <p className="text-xs text-slate-500">
            Choose modernized legacy screens to bundle into this package.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <button
            type="button"
            onClick={onSelectAllConverted}
            className="text-brand-600 hover:text-brand-700 font-semibold transition-colors flex items-center space-x-1"
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Select Ready ({convertedScreens.length})</span>
          </button>
          <span className="text-slate-300">•</span>
          <button
            type="button"
            onClick={onDeselectAll}
            className="text-slate-500 hover:text-slate-700 transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      {hasUnreadySelected && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start space-x-2.5 text-xs text-amber-800">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Notice:</span> One or more selected screens are still in review or processing. They will be included using the latest conversion candidate.
          </div>
        </div>
      )}

      <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 bg-white overflow-hidden shadow-2xs max-h-72 overflow-y-auto">
        {screens.map((screen) => {
          const isSelected = selectedScreenIds.includes(screen.id);

          return (
            <div
              key={screen.id}
              onClick={() => onToggleScreen(screen.id)}
              className={`p-3.5 flex items-center justify-between cursor-pointer transition-colors ${
                isSelected
                  ? 'bg-blue-50/40 hover:bg-blue-50/70'
                  : 'hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center space-x-3 min-w-0">
                <button
                  type="button"
                  aria-label={`Toggle screen ${screen.name}`}
                  className="text-brand-600 shrink-0 focus:outline-none"
                >
                  {isSelected ? (
                    <CheckSquare className="w-4 h-4 text-blue-600" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-300" />
                  )}
                </button>

                <div className="min-w-0">
                  <div className="flex items-center space-x-2">
                    <FileCode className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="text-xs font-bold text-slate-900 font-mono truncate">
                      {screen.name}
                    </span>
                    <span className="text-[10px] bg-slate-100 text-slate-600 font-mono font-medium px-1.5 py-0.2 rounded border border-slate-200">
                      {screen.sourceType}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">
                    {screen.path} • {screen.sizeKb} KB
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3 shrink-0">
                <StatusBadge status={screen.status} />
              </div>
            </div>
          );
        })}
      </div>

      {selectedScreenIds.length === 0 && (
        <p className="text-xs text-rose-600 flex items-center space-x-1.5 font-medium">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>Please select at least one screen to export.</span>
        </p>
      )}
    </div>
  );
};
