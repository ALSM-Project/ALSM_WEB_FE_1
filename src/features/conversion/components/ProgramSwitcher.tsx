import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  ChevronDown,
  CheckCircle2,
  FileCode,
  Layers,
  ArrowRight,
  Code2,
  X,
  Clock,
} from 'lucide-react';
import { conversionService } from '../services/conversion.service';
import type { LegacyScreen } from '@/features/screens/types/screen';
import { ROUTES } from '@/shared/constants/routes';

export interface ProgramSwitcherProps {
  projectId: string;
  currentScreenId: string;
  currentScreenName?: string;
  targetMode?: 'result' | 'review';
}

export const ProgramSwitcher: React.FC<ProgramSwitcherProps> = ({
  projectId,
  currentScreenId,
  currentScreenName,
  targetMode = 'result',
}) => {
  const navigate = useNavigate();
  const [screens, setScreens] = useState<LegacyScreen[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'COMPLETED' | 'FAILED'>('ALL');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    if (projectId) {
      conversionService
        .getScreens(projectId)
        .then((data) => {
          if (!cancelled) {
            setScreens(data);
          }
        })
        .catch(() => {});
    }
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentIndex = useMemo(() => {
    return screens.findIndex((s) => s.id === currentScreenId);
  }, [screens, currentScreenId]);

  const currentProgram = screens[currentIndex];
  const displayName = currentScreenName || currentProgram?.name || currentScreenId;

  const filteredScreens = useMemo(() => {
    return screens.filter((s) => {
      const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase());
      const sNorm = (s.status || '').toUpperCase();
      const isCompleted = sNorm.includes('COMPLETED') || sNorm.includes('CONVERTED') || sNorm.includes('READY');
      const isFailed = sNorm.includes('FAIL') || sNorm.includes('DEAD');

      if (statusFilter === 'COMPLETED') return matchesSearch && isCompleted;
      if (statusFilter === 'FAILED') return matchesSearch && isFailed;
      return matchesSearch;
    });
  }, [screens, search, statusFilter]);

  const completedCount = useMemo(() => {
    return screens.filter((s) => {
      const sNorm = (s.status || '').toUpperCase();
      return sNorm.includes('COMPLETED') || sNorm.includes('CONVERTED') || sNorm.includes('READY');
    }).length;
  }, [screens]);

  const handleSelectProgram = (screenId: string) => {
    setDropdownOpen(false);
    setModalOpen(false);
    if (targetMode === 'review') {
      navigate(ROUTES.PROJECTS.REVIEW(projectId, screenId));
    } else {
      navigate(ROUTES.PROJECTS.RESULT(projectId, screenId));
    }
  };

  return (
    <div className="flex items-center space-x-2.5">
      {/* 1. Quick Switcher Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setDropdownOpen((prev) => !prev)}
          className="flex items-center space-x-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-900 text-xs font-semibold shadow-xs transition-colors"
          title="Switch to another program in this project"
        >
          <Code2 className="w-3.5 h-3.5 text-blue-600" />
          <span className="font-mono text-slate-800 max-w-[180px] truncate">{displayName}</span>
          {screens.length > 0 && (
            <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded font-mono">
              {currentIndex >= 0 ? `${currentIndex + 1}/${screens.length}` : `${screens.length} total`}
            </span>
          )}
          <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
        </button>

        {dropdownOpen && (
          <div className="absolute left-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden text-xs">
            {/* Search header */}
            <div className="p-2.5 border-b border-slate-100 bg-slate-50/70">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search program (e.g. COACT, COCRD)..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900"
                  autoFocus
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 px-0.5">
                <span>{screens.length} total programs</span>
                <span className="text-emerald-700 font-medium">{completedCount} converted</span>
              </div>
            </div>

            {/* Program list */}
            <div className="max-h-64 overflow-y-auto divide-y divide-slate-50">
              {filteredScreens.length === 0 ? (
                <div className="p-4 text-center text-slate-400 text-xs">
                  No programs found matching &ldquo;{search}&rdquo;
                </div>
              ) : (
                filteredScreens.map((item) => {
                  const isSelected = item.id === currentScreenId;
                  const itemNorm = (item.status || '').toUpperCase();
                  const isDone = itemNorm.includes('COMPLETED') || itemNorm.includes('CONVERTED') || itemNorm.includes('READY');
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelectProgram(item.id)}
                      className={`w-full text-left px-3.5 py-2.5 flex items-center justify-between transition-colors ${
                        isSelected
                          ? 'bg-blue-50/70 font-semibold text-blue-900'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <FileCode className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-blue-600' : 'text-slate-400'}`} />
                        <span className="font-mono text-xs truncate">{item.name}</span>
                      </div>
                      <div className="flex items-center space-x-2 shrink-0">
                        {isDone ? (
                          <span className="inline-flex items-center text-[10px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                            Completed
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-[10px] font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                            {item.status || 'Pending'}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Dropdown footer: All programs modal link */}
            <div className="p-2 border-t border-slate-100 bg-slate-50 text-center">
              <button
                type="button"
                onClick={() => {
                  setDropdownOpen(false);
                  setModalOpen(true);
                }}
                className="text-[11px] font-semibold text-blue-700 hover:text-blue-800 flex items-center justify-center space-x-1.5 mx-auto"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>View All {screens.length} Programs Summary &rarr;</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 2. All Programs Summary Button */}
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50/60 hover:bg-blue-100/70 text-blue-800 text-xs font-semibold transition-colors"
      >
        <Layers className="w-3.5 h-3.5 text-blue-600" />
        <span>All Programs Summary ({screens.length || '34'})</span>
      </button>

      {/* 3. Project Overview Summary Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 shadow-xs">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Project Modernization Artifacts Summary</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Inspect all converted legacy programs, generated Spring Boot classes, and review findings.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* KPI Cards Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-6 bg-slate-50/60 border-b border-slate-100">
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Total Programs</span>
                <span className="text-xl font-bold text-slate-900 mt-0.5 block">{screens.length}</span>
                <span className="text-[10px] text-slate-400">100% indexed source files</span>
              </div>
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Transpiled Output</span>
                <span className="text-xl font-bold text-emerald-700 mt-0.5 block">
                  {completedCount} / {screens.length}
                </span>
                <span className="text-[10px] text-emerald-600 font-medium">Ready for deployment</span>
              </div>
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Target Architecture</span>
                <span className="text-base font-bold text-blue-900 mt-0.5 block">Java 17 + Spring Boot</span>
                <span className="text-[10px] text-blue-600 font-medium">Batch Job &amp; Tasklet Suite</span>
              </div>
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Current Program</span>
                <span className="text-xs font-bold font-mono text-slate-800 mt-1 block truncate">{displayName}</span>
                <span className="text-[10px] text-blue-700 font-medium">Active in inspector</span>
              </div>
            </div>

            {/* Search & Filter Toolbar */}
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter programs..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center space-x-1.5">
                <button
                  type="button"
                  onClick={() => setStatusFilter('ALL')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    statusFilter === 'ALL'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All ({screens.length})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('COMPLETED')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    statusFilter === 'COMPLETED'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Completed ({completedCount})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('FAILED')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    statusFilter === 'FAILED'
                      ? 'bg-rose-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Failed ({screens.length - completedCount})
                </button>
              </div>
            </div>

            {/* Programs Table */}
            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider sticky top-0 z-10">
                    <th className="py-2.5 px-4">Program File</th>
                    <th className="py-2.5 px-4">Dialect / Type</th>
                    <th className="py-2.5 px-4">Modernized Target</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-normal">
                  {filteredScreens.map((item) => {
                    const isSelected = item.id === currentScreenId;
                    const itemNorm = (item.status || '').toUpperCase();
                    const isDone = itemNorm.includes('COMPLETED') || itemNorm.includes('CONVERTED') || itemNorm.includes('READY');
                    return (
                      <tr
                        key={item.id}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          isSelected ? 'bg-blue-50/50' : ''
                        }`}
                      >
                        <td className="py-3 px-4 font-mono font-semibold text-slate-900 flex items-center space-x-2">
                          <FileCode className="w-3.5 h-3.5 text-blue-600" />
                          <span>{item.name}</span>
                          {isSelected && (
                            <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.2 rounded">
                              Current
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-600 font-medium">
                          {item.sourceType || 'COBOL'}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          <span className="font-medium text-slate-800">Spring Batch Tasklet</span>
                          <span className="text-[11px] text-slate-400 block font-mono">Job &amp; Model</span>
                        </td>
                        <td className="py-3 px-4">
                          {isDone ? (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Completed</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                              <Clock className="w-3 h-3 text-amber-600" />
                              <span>{item.status || 'Pending'}</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right space-x-2">
                          <button
                            type="button"
                            onClick={() => handleSelectProgram(item.id)}
                            className="inline-flex items-center space-x-1 px-2.5 py-1 rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium shadow-2xs transition-colors"
                          >
                            <span>Inspect Code</span>
                            <ArrowRight className="w-3 h-3 text-slate-400" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setModalOpen(false);
                              navigate(ROUTES.PROJECTS.REVIEW(projectId, item.id));
                            }}
                            className="inline-flex items-center space-x-1 px-2.5 py-1 rounded border border-blue-200 bg-blue-50/60 hover:bg-blue-100 text-blue-700 text-xs font-semibold shadow-2xs transition-colors"
                          >
                            <span>Findings</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Showing {filteredScreens.length} of {screens.length} modernized programs in project.
              </span>
              <div className="flex items-center space-x-2.5">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setModalOpen(false);
                    navigate(ROUTES.PROJECTS.EXPORT(projectId));
                  }}
                  className="px-4 py-2 rounded-lg bg-[#244A70] hover:bg-[#1B3856] text-white text-xs font-bold shadow-xs transition-colors inline-flex items-center space-x-1.5"
                >
                  <span>Export All Modernized Programs</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
