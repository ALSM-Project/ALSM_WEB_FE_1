import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Search, Plus, FileCode, ArrowRight, Layers, AlertTriangle, CheckCircle2, XCircle, Play, Stethoscope } from 'lucide-react';
import { screenService } from '../services/screen.service';
import type { LegacyScreen } from '../types/screen';
import { ROUTES } from '@/shared/constants/routes';
import { Tabs } from '@/shared/ui/Tabs';
import { StatusBadge } from '@/shared/ui/Badge';
import { Button } from '@/shared/ui/Button';
import { Breadcrumb } from '@/shared/navigation/Breadcrumb';

export const ScreensListPage: React.FC = () => {
  const { projectId = 'proj-acme' } = useParams();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('screens');
  const [screens, setScreens] = useState<LegacyScreen[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [frameworkFilter, setFrameworkFilter] = useState('ALL');

  useEffect(() => {
    screenService.getScreens(projectId).then((data) => setScreens(data));
  }, [projectId]);

  const filteredScreens = screens.filter((screen) => {
    const matchesSearch = screen.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || screen.status.toUpperCase() === statusFilter.toUpperCase();
    const matchesFramework = frameworkFilter === 'ALL' || screen.framework.toUpperCase() === frameworkFilter.toUpperCase();
    return matchesSearch && matchesStatus && matchesFramework;
  });

  return (
    <div className="space-y-6 py-2">
      {/* Breadcrumb Navigation */}
      <Breadcrumb
        items={[
          { label: 'Projects', href: '#' },
          { label: 'Acme Corp Modernization', href: '#' },
          { label: 'Screens' },
        ]}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Screens</h1>
          <p className="text-sm text-slate-500 mt-1">Manage, convert, and inspect legacy screens for Acme Corp Modernization.</p>
        </div>

        <div className="flex items-center space-x-3">
          <Button
            variant="secondary"
            onClick={() => navigate(ROUTES.PROJECTS.BULK_CONVERT(projectId))}
            className="space-x-2 text-sm"
          >
            <Play className="w-4 h-4 text-brand-600" />
            <span>Bulk Convert</span>
          </Button>
          <Button
            onClick={() => navigate(ROUTES.PROJECTS.UPLOAD(projectId))}
            className="space-x-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Upload File</span>
          </Button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 p-5 rounded-xl flex items-center space-x-4 shadow-sm">
          <div className="p-3 bg-brand-50 text-brand-600 rounded-lg border border-brand-100">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Total Screens</p>
            <p className="text-2xl font-extrabold text-slate-900 font-sans mt-0.5">48</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-xl flex items-center space-x-4 shadow-sm">
          <div className="p-3 bg-[#ECFDF3] text-[#079455] rounded-lg border border-[#ABEFC6]">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Converted</p>
            <p className="text-2xl font-extrabold text-[#079455] font-sans mt-0.5">36</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-xl flex items-center space-x-4 shadow-sm">
          <div className="p-3 bg-[#FFFAEB] text-[#DC6803] rounded-lg border border-[#FEDF89]">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Review Required</p>
            <p className="text-2xl font-extrabold text-[#DC6803] font-sans mt-0.5">3</p>
          </div>
        </div>

        <Link
          to={ROUTES.PROJECTS.DIAGNOSTICS(projectId)}
          className="bg-white border border-slate-200 hover:border-rose-300 p-5 rounded-xl flex items-center space-x-4 shadow-sm transition-all group cursor-pointer"
        >
          <div className="p-3 bg-[#FEF3F2] text-[#D92D20] rounded-lg border border-[#FECDCA] group-hover:scale-105 transition-transform">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Failed (Diagnostics)</p>
            <p className="text-2xl font-extrabold text-[#D92D20] font-sans mt-0.5 flex items-center gap-1.5">
              <span>1</span>
              <span className="text-xs font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">View Logs &rarr;</span>
            </p>
          </div>
        </Link>
      </div>

      <Tabs
        tabs={[
          { id: 'screens', label: 'Screens List', count: 48 },
          { id: 'programs', label: 'Programs', count: 12 },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* Filter Row */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search screens..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-brand-600 text-slate-900 placeholder:text-slate-400"
          />
        </div>

        <div className="flex space-x-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-slate-300 text-slate-700 text-xs font-medium rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-600"
          >
            <option value="ALL">Status: All</option>
            <option value="COMPLETED">Completed</option>
            <option value="PROCESSING">Processing</option>
            <option value="REVIEW REQUIRED">Review Required</option>
            <option value="FAILED">Failed</option>
          </select>

          <select
            value={frameworkFilter}
            onChange={(e) => setFrameworkFilter(e.target.value)}
            className="bg-white border border-slate-300 text-slate-700 text-xs font-medium rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-600"
          >
            <option value="ALL">Framework: All</option>
            <option value="REACT">React</option>
            <option value="VUE">Vue</option>
          </select>
        </div>
      </div>

      {/* Enterprise Data Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-200">
              <tr>
                <th className="p-4">Screen Name</th>
                <th className="p-4">Source Type</th>
                <th className="p-4">Status</th>
                <th className="p-4">Framework</th>
                <th className="p-4">Last Updated</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredScreens.map((screen) => (
                <tr key={screen.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-mono text-sm font-semibold text-slate-900 flex items-center space-x-2.5">
                    <FileCode className="w-4 h-4 text-brand-600 flex-shrink-0" />
                    <Link
                      to={ROUTES.PROJECTS.CONVERT(projectId, screen.id)}
                      className="hover:text-brand-600 hover:underline"
                    >
                      {screen.name}
                    </Link>
                  </td>
                  <td className="p-4 text-slate-600 font-semibold">{screen.sourceType}</td>
                  <td className="p-4">
                    <StatusBadge status={screen.status} />
                  </td>
                  <td className="p-4 text-slate-700 font-medium">{screen.framework}</td>
                  <td className="p-4 text-slate-500">{screen.lastUpdated}</td>
                  <td className="p-4 text-right space-x-2">
                    {screen.status === 'Failed' ? (
                      <Link
                        to={ROUTES.PROJECTS.DIAGNOSTICS(projectId)}
                        className="inline-flex items-center space-x-1 text-xs text-rose-700 font-semibold bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-200 hover:bg-rose-100 transition-colors"
                      >
                        <Stethoscope className="w-3.5 h-3.5" />
                        <span>Diagnostics</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    ) : (
                      <Link
                        to={ROUTES.PROJECTS.CONVERT(projectId, screen.id)}
                        className="inline-flex items-center space-x-1 text-xs text-brand-600 font-medium hover:text-brand-700 bg-brand-50 px-3 py-1.5 rounded-lg border border-brand-200 transition-colors"
                      >
                        <span>Studio</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-slate-50 px-4 py-3 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500 font-medium">
          <span>Showing 1-{filteredScreens.length} of 48 screens</span>
          <div className="flex space-x-1">
            <button className="px-3 py-1 rounded-lg bg-white border border-slate-200 text-slate-400 cursor-not-allowed">Prev</button>
            <button className="px-3 py-1 rounded-lg bg-brand-600 text-white font-semibold shadow-xs">1</button>
            <button className="px-3 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100">2</button>
            <button className="px-3 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100">3</button>
            <button className="px-3 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default ScreensListPage;
