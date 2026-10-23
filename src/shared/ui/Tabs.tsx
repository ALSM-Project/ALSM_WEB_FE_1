import React from 'react';

export interface TabItem {
  id: string;
  label: string;
  count?: number;
  icon?: React.ReactNode;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
  variant?: 'segmented' | 'underline';
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  className = '',
  variant = 'segmented',
}) => {
  if (variant === 'underline') {
    return (
      <div className={`border-b border-[#D9E2EC] ${className}`}>
        <nav className="-mb-px flex space-x-6">
          {tabs.map((tab) => {
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onChange(tab.id)}
                className={`py-3 px-1 border-b-2 font-medium text-xs sm:text-sm flex items-center space-x-2 transition-colors cursor-pointer ${
                  isActive
                    ? 'border-[#0652CC] text-[#0652CC] font-bold'
                    : 'border-transparent text-[#6B778C] hover:text-[#091E42] hover:border-[#CBD5E1]'
                }`}
              >
                {tab.icon && <span className="w-4 h-4">{tab.icon}</span>}
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`ml-1.5 px-2 py-0.5 text-[11px] rounded font-semibold ${
                      isActive
                        ? 'bg-[#E8F1FF] text-[#0652CC]'
                        : 'bg-[#F1F5F9] text-[#6B778C]'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    );
  }

  // Segmented control (default)
  return (
    <div className={`flex items-center ${className}`}>
      <div className="inline-flex p-1 bg-[#F1F5F9] rounded-lg gap-1 border border-[#E2E8F0]">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center space-x-2 ${
                isActive
                  ? 'bg-white text-[#091E42] shadow-2xs border border-[#CBD5E1]/60'
                  : 'text-[#6B778C] hover:text-[#091E42] hover:bg-slate-200/50'
              }`}
            >
              {tab.icon && <span className="w-4 h-4">{tab.icon}</span>}
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`ml-1 px-1.5 py-0.5 text-[10px] rounded font-semibold ${
                    isActive
                      ? 'bg-[#E8F1FF] text-[#0652CC]'
                      : 'bg-slate-200 text-[#42526E]'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
export default Tabs;
