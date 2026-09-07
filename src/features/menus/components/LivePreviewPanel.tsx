import React from 'react';
import { Cpu, ChevronRight, Layers, Bell } from 'lucide-react';
import { MenuItem } from '../types/menu';
import { findMenuItemInTree } from '../utils/navigationTreeUtils';
import { DynamicIcon } from '@/components/Sidebar/IconResolver';
import { Card } from '@/shared/ui';

export interface LivePreviewPanelProps {
  sidebarNav: MenuItem[];
  selectedItemId: string | null;
}

export const LivePreviewPanel: React.FC<LivePreviewPanelProps> = ({
  sidebarNav,
  selectedItemId,
}) => {
  const selectedItem = selectedItemId ? findMenuItemInTree(sidebarNav, selectedItemId) : null;

  // Build ancestral path list for Current Path representation below
  const getAncestralPath = (items: MenuItem[], targetId: string, path: string[] = []): string[] | null => {
    for (const item of items) {
      const currentPath = [...path, item.label];
      if (item.id === targetId) return currentPath;
      if (item.children && item.children.length > 0) {
        const found = getAncestralPath(item.children, targetId, currentPath);
        if (found) return found;
      }
    }
    return null;
  };

  const breadcrumbChain = selectedItemId ? getAncestralPath(sidebarNav, selectedItemId) || [selectedItem?.label || 'Dashboard'] : ['Dashboard'];

  return (
    <Card variant="default" padding="md" className="h-full flex flex-col justify-between">
      <div>
        <div className="pb-3 mb-3 border-b border-[#E5EAF0]">
          <span className="text-[10px] font-semibold tracking-wider text-[#0652CC] uppercase">
            Live Preview
          </span>
          <h2 className="text-base font-bold text-[#091E42]">Application Shell Preview</h2>
          <p className="text-xs text-[#6B778C] mt-0.5">
            Real-time preview of runtime navigation consuming the single source of truth.
          </p>
        </div>

        {/* Miniature ALSM Shell Frame */}
        <div className="border border-[#D9E2EC] rounded-xl overflow-hidden shadow-xs bg-[#F7F9FC]">
          {/* Miniature App Header */}
          <div className="bg-white border-b border-[#D9E2EC] px-3 py-2 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 rounded bg-[#0652CC] flex items-center justify-center text-white font-bold">
                <Cpu className="w-3 h-3" />
              </div>
              <span className="text-xs font-extrabold text-[#091E42]">ALSM</span>
            </div>

            {/* Header Breadcrumb */}
            <div className="flex items-center space-x-1 text-[10px] text-[#6B778C]">
              {breadcrumbChain.map((crumb, idx) => (
                <React.Fragment key={idx}>
                  {idx > 0 && <ChevronRight className="w-2.5 h-2.5 text-[#D9E2EC]" />}
                  <span className={idx === breadcrumbChain.length - 1 ? 'font-semibold text-[#091E42]' : 'text-[#42526E]'}>
                    {crumb}
                  </span>
                </React.Fragment>
              ))}
            </div>

            <div className="flex items-center space-x-2">
              <Bell className="w-3 h-3 text-[#6B778C]" />
              <div className="w-5 h-5 rounded-full bg-[#E8F1FF] text-[9px] font-bold text-[#0652CC] flex items-center justify-center">
                AV
              </div>
            </div>
          </div>

          {/* Miniature Body (Sidebar + Content) */}
          <div className="flex h-64">
            {/* Miniature Dark Navy Sidebar */}
            <div className="w-36 bg-[#091E42] text-white p-2 flex flex-col space-y-1 overflow-y-auto shrink-0 border-r border-[#020817]">
              {sidebarNav
                .filter((item) => item.isVisible !== false)
                .map((item) => {
                  const isSelected = selectedItemId === item.id;
                  const hasChildren = item.children && item.children.length > 0;

                  return (
                    <div key={item.id} className="flex flex-col">
                      <div
                        className={`flex items-center space-x-1.5 px-2 py-1 rounded text-[10px] transition-colors ${
                          isSelected
                            ? 'bg-[#0652CC] text-white font-semibold'
                            : 'text-[#94A3B8] hover:bg-[#0652CC]/20'
                        }`}
                      >
                        <DynamicIcon name={item.icon} className="w-3 h-3 shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </div>

                      {/* Render Children indented if present */}
                      {hasChildren && (
                        <div className="ml-2 pl-1 border-l border-[#0652CC]/30 space-y-0.5 mt-0.5">
                          {item.children
                            ?.filter((c) => c.isVisible !== false)
                            .map((child) => {
                              const isChildSelected = selectedItemId === child.id;
                              return (
                                <div
                                  key={child.id}
                                  className={`flex items-center space-x-1 px-1.5 py-0.5 rounded text-[9px] ${
                                    isChildSelected
                                      ? 'bg-[#0652CC] text-white font-semibold'
                                      : 'text-[#64748B] hover:text-white'
                                  }`}
                                >
                                  <DynamicIcon name={child.icon} className="w-2.5 h-2.5 shrink-0" />
                                  <span className="truncate">{child.label}</span>
                                </div>
                              );
                            })}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>

            {/* Miniature Page Content Area */}
            <div className="flex-1 p-3 bg-white flex flex-col items-center justify-center text-center">
              <div className="w-8 h-8 rounded-full bg-[#E8F1FF] flex items-center justify-center mb-2">
                <Layers className="w-4 h-4 text-[#0652CC]" />
              </div>
              <span className="text-xs font-bold text-[#091E42]">
                {selectedItem ? selectedItem.label : 'Dashboard'}
              </span>
              <span className="text-[10px] text-[#6B778C] mt-0.5">
                {selectedItem?.path || '/'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Current Path Bar Below Preview */}
      <div className="mt-4 pt-3 border-t border-[#E5EAF0]">
        <span className="text-[11px] font-semibold text-[#091E42]">Current Path</span>
        <div className="flex items-center flex-wrap gap-1 mt-1">
          {breadcrumbChain.map((crumb, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <span className="text-xs text-[#6B778C] font-bold">&gt;</span>}
              <span className="px-2 py-0.5 text-[11px] rounded bg-[#E8F1FF] text-[#0652CC] font-semibold">
                {crumb}
              </span>
            </React.Fragment>
          ))}
        </div>
      </div>
    </Card>
  );
};

export default LivePreviewPanel;
