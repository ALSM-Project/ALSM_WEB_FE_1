import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Search,
  Filter,
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Download,
  ExternalLink,
  PenTool,
  CreditCard,
  ShieldCheck,
  Building,
  Layers,
  XCircle,
} from 'lucide-react';
import { Button } from '@/shared/ui/Button';
import { billingService } from '@/features/billing/services/billing.service';
import { env } from '@/shared/constants/env';

type ContractTab =
  | 'ALL'
  | 'PENDING_SIGNATURE'
  | 'PENDING_PAYMENT'
  | 'PAYMENT_VERIFICATION'
  | 'ACTIVE'
  | 'COMPLETED';

interface EnterpriseContractItem {
  id: string;
  contractNumber: string;
  title?: string;
  serviceMode?: 'SELF_SERVICE' | 'WE_CONVERT_FOR_YOU' | 'HYBRID' | string;
  plan?: string;
  status?: string;
  contractStatus?: string;
  totalValue?: number;
  currency?: string;
  effectiveDate?: string;
  expirationDate?: string;
  createdAt?: string;
  customer?: {
    legalName?: string;
    taxId?: string;
    contactEmail?: string;
    representativeName?: string;
    representativeTitle?: string;
  };
  signingProcess?: {
    customerSigningStatus?: string;
    alsmSigningStatus?: string;
    customerSignedAt?: string;
    alsmSignedAt?: string;
    signerEmail?: string;
    signerName?: string;
  };
  signingStatus?: {
    alsm?: boolean;
    customer?: boolean;
  };
  customerSigningStatus?: string;
  invoiceId?: string | null;
  invoiceNumber?: string | null;
  paymentStatus?: string;
  scopeOfWork?: {
    maxScreens?: number;
    maxPrograms?: number;
    deliverables?: string[];
  };
}

export const CustomerContractsPage: React.FC = () => {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<ContractTab>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [serviceModeFilter, setServiceModeFilter] = useState<string>('ALL');
  const [contracts, setContracts] = useState<EnterpriseContractItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchContracts = async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      setError(null);
      const res = await billingService.getContracts({
        tab: activeTab === 'ALL' ? undefined : activeTab,
        search: searchTerm.trim() || undefined,
        serviceMode: serviceModeFilter === 'ALL' ? undefined : serviceModeFilter,
      });

      const items = Array.isArray(res) ? res : res?.items || [];
      setContracts(items);
    } catch (err: any) {
      console.error('[CustomerContractsPage] Failed to fetch contracts:', err);
      setError(err?.message || 'Failed to load enterprise contracts. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, [activeTab, serviceModeFilter]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchContracts(true);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchContracts();
  };

  // Helper to determine the normalized contract status
  const getNormalizedContractStatus = (c: any): string => {
    if (c.contractStatus && (c.contractStatus === 'Active' || c.contractStatus === 'Completed')) return c.contractStatus;
    const rawStatus = (c.status || '').toUpperCase();
    if (rawStatus === 'ACTIVE') return 'Active';
    if (rawStatus === 'COMPLETED') return 'Completed';
    if (rawStatus === 'CANCELLED' || rawStatus === 'TERMINATED') return 'Cancelled';

    const isSigned =
      c.signingProcess?.customerSigningStatus === 'SIGNED' ||
      c.signingStatus?.customer === true ||
      c.customerSigningStatus === 'SIGNED' ||
      rawStatus === 'ACTIVE';

    const payStatus = (c.paymentStatus || '').toUpperCase();
    if (!isSigned) return 'Pending Signature';
    if (payStatus === 'PAYMENT_VERIFIED' || payStatus === 'PAID' || rawStatus === 'ACTIVE') {
      return 'Active';
    }
    if (payStatus === 'PAYMENT_SUBMITTED') return 'Payment Verification';
    return 'Pending Payment';
  };

  // Helper to determine normalized payment status
  const getNormalizedPaymentStatus = (c: any): string => {
    const raw = (c.paymentStatus || '').toUpperCase();
    const rawStatus = (c.status || '').toUpperCase();
    const contractStatus = (c.contractStatus || '').toUpperCase();

    if (
      raw === 'PAID' ||
      raw === 'PAYMENT_VERIFIED' ||
      rawStatus === 'ACTIVE' ||
      contractStatus === 'ACTIVE' ||
      rawStatus === 'COMPLETED'
    ) {
      return 'Payment Verified';
    }
    if (raw === 'PAYMENT_SUBMITTED') return 'Payment Submitted';
    if (raw === 'PAYMENT_FAILED' || raw === 'FAILED') return 'Payment Failed';
    if (raw === 'REFUNDED') return 'Refunded';
    if (raw === 'NOT_REQUIRED') return 'Not Required';

    const isSigned =
      c.signingProcess?.customerSigningStatus === 'SIGNED' ||
      c.signingStatus?.customer === true ||
      c.customerSigningStatus === 'SIGNED';

    if (!isSigned) return 'Pending Payment';
    return 'Pending Payment';
  };

  // Client-side filtering fallback
  const filteredContracts = useMemo(() => {
    return contracts.filter((c) => {
      // Filter by search
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const num = (c.contractNumber || '').toLowerCase();
        const title = (c.title || '').toLowerCase();
        const customer = (c.customer?.legalName || '').toLowerCase();
        const rep = (c.customer?.representativeName || '').toLowerCase();
        if (!num.includes(term) && !title.includes(term) && !customer.includes(term) && !rep.includes(term)) {
          return false;
        }
      }

      // Filter by tab
      const status = getNormalizedContractStatus(c);
      if (activeTab === 'PENDING_SIGNATURE' && status !== 'Pending Signature' && status !== 'Draft') return false;
      if (activeTab === 'PENDING_PAYMENT' && status !== 'Pending Payment') return false;
      if (activeTab === 'PAYMENT_VERIFICATION' && status !== 'Payment Verification') return false;
      if (activeTab === 'ACTIVE' && status !== 'Active') return false;
      if (activeTab === 'COMPLETED' && status !== 'Completed') return false;

      return true;
    });
  }, [contracts, searchTerm, activeTab]);

  // Compute stats across all loaded contracts
  const stats = useMemo(() => {
    let total = contracts.length;
    let pendingSign = 0;
    let pendingPay = 0;
    let paymentVerification = 0;
    let active = 0;
    let completed = 0;

    contracts.forEach((c) => {
      const status = getNormalizedContractStatus(c);
      if (status === 'Pending Signature' || status === 'Draft') pendingSign++;
      else if (status === 'Pending Payment') pendingPay++;
      else if (status === 'Payment Verification') paymentVerification++;
      else if (status === 'Active') active++;
      else if (status === 'Completed') completed++;
    });

    return { total, pendingSign, pendingPay, paymentVerification, active, completed };
  }, [contracts]);

  const formatCurrency = (val?: number, cur: string = 'VND') => {
    if (typeof val !== 'number') return '0 ' + cur;
    return `${val.toLocaleString('en-US')} ${cur}`;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const getServiceModeBadge = (mode?: string) => {
    switch (mode) {
      case 'WE_CONVERT_FOR_YOU':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            Managed Modernization Services
          </span>
        );
      case 'HYBRID':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            Hybrid SOW
          </span>
        );
      case 'SELF_SERVICE':
      case 'SELF_SERVICE_CONVERSION':
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            Platform-Based Modernization
          </span>
        );
    }
  };

  const renderContractStatusBadge = (contract: EnterpriseContractItem) => {
    const status = getNormalizedContractStatus(contract);
    switch (status) {
      case 'Draft':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            Draft
          </span>
        );
      case 'Pending Signature':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
            Pending Signature
          </span>
        );
      case 'Signed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
            Signed
          </span>
        );
      case 'Pending Payment':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200">
            <CreditCard className="w-3.5 h-3.5 text-orange-600" />
            Pending Payment
          </span>
        );
      case 'Payment Verification':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <Clock className="w-3.5 h-3.5 text-purple-600 animate-spin" />
            Payment Verification
          </span>
        );
      case 'Active':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Active
          </span>
        );
      case 'Completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
            Completed
          </span>
        );
      case 'Cancelled':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            Cancelled
          </span>
        );
    }
  };

  const renderPaymentStatusBadge = (contract: EnterpriseContractItem) => {
    const status = getNormalizedPaymentStatus(contract);
    switch (status) {
      case 'Payment Verified':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Payment Verified
          </span>
        );
      case 'Payment Submitted':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <Clock className="w-3.5 h-3.5 text-purple-600" />
            Payment Submitted
          </span>
        );
      case 'Payment Failed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            Payment Failed
          </span>
        );
      case 'Refunded':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            Refunded
          </span>
        );
      case 'Not Required':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            Not Required
          </span>
        );
      case 'Pending Payment':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            Pending Payment
          </span>
        );
    }
  };

  const handleDownloadPdf = (contractId: string) => {
    const apiBase = env.apiBaseUrl.replace(/\/+$/, '');
    const pdfUrl = `${apiBase}/api/v1/enterprise-contracts/${contractId}/pdf`;
    window.open(pdfUrl, '_blank');
  };

  const tabs: { key: ContractTab; label: string; count?: number }[] = [
    { key: 'ALL', label: 'All Contracts', count: stats.total },
    { key: 'PENDING_SIGNATURE', label: 'Pending Signature', count: stats.pendingSign },
    { key: 'PENDING_PAYMENT', label: 'Pending Payment', count: stats.pendingPay },
    { key: 'PAYMENT_VERIFICATION', label: 'Payment Verification', count: stats.paymentVerification },
    { key: 'ACTIVE', label: 'Active', count: stats.active },
    { key: 'COMPLETED', label: 'Completed', count: stats.completed },
  ];

  return (
    <div className="w-full space-y-6">
      {/* Header section with ALSM Theme */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Contract & Subscription</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing || loading}
            className="flex items-center gap-1.5 text-slate-700 hover:text-blue-600 border-slate-300"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* KPI Stats Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Contracts</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{stats.total}</span>
            <span className="text-xs text-slate-500">agreements</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Signature</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <PenTool className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-600">{stats.pendingSign}</span>
            <span className="text-xs text-amber-700 font-medium">requires e-sign</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Payment</span>
            <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-orange-600">{stats.pendingPay}</span>
            <span className="text-xs text-orange-700 font-medium">invoice ready</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Web 3 Access</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-emerald-600">{stats.active + stats.completed}</span>
              <span className="text-xs text-emerald-700 font-medium">provisioned</span>
            </div>
          </div>
          {(stats.active + stats.completed > 0) && (
            <a
              href="http://localhost:3003"
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open Web 3 Portal</span>
            </a>
          )}
        </div>
      </div>

      {/* Tabs and Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4 shadow-xs">
        {/* Tab Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-100 scrollbar-none">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-[#244A70] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <span>{tab.label}</span>
                {typeof tab.count === 'number' && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-xs font-bold ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search & Mode Filters */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by contract #, organization..."
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-400"
            />
          </form>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <Filter className="w-3.5 h-3.5" />
              <span>Service Mode:</span>
            </div>
            <select
              value={serviceModeFilter}
              onChange={(e) => setServiceModeFilter(e.target.value)}
              className="text-xs sm:text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Modes</option>
              <option value="SELF_SERVICE">Platform-Based Modernization</option>
              <option value="WE_CONVERT_FOR_YOU">Managed Modernization Services</option>
              <option value="HYBRID">Hybrid SOW</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content: Table / Card View */}
      {loading ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-xs">
          <div className="inline-block animate-spin text-blue-600 mb-3">
            <RefreshCw className="w-8 h-8" />
          </div>
          <p className="text-sm font-medium text-slate-600">Loading contracts and subscriptions...</p>
        </div>
      ) : error ? (
        <div className="bg-white border border-rose-200 rounded-xl p-8 text-center shadow-xs">
          <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900">Unable to load contract data</h3>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-md mx-auto">{error}</p>
          <Button size="sm" onClick={() => fetchContracts()} className="mt-4 bg-[#244A70] hover:bg-[#1B3856] text-white">
            Retry
          </Button>
        </div>
      ) : filteredContracts.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-xs">
          <div className="w-14 h-14 bg-slate-100 text-[#244A70] rounded-2xl flex items-center justify-center mx-auto mb-3">
            <FileText className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No contracts found</h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto">
            No agreements match the selected status or filters. You can select a modernization package to generate a new agreement.
          </p>
          <div className="mt-5 flex items-center justify-center gap-3">
            <Button
              size="sm"
              onClick={() => navigate('/billing/upgrade')}
              className="bg-[#244A70] hover:bg-[#1B3856] text-white font-medium"
            >
              Select Modernization Package
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setActiveTab('ALL');
                setSearchTerm('');
                setServiceModeFilter('ALL');
              }}
              className="border-slate-300 text-slate-700"
            >
              Clear Filters
            </Button>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4">Contract Number</th>
                  <th className="py-3.5 px-4">Service & Quota</th>
                  <th className="py-3.5 px-4">Effective Date</th>
                  <th className="py-3.5 px-4">Contract Value</th>
                  <th className="py-3.5 px-4">Contract Status</th>
                  <th className="py-3.5 px-4">Payment Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredContracts.map((contract) => {
                  const isSigned =
                    contract.signingProcess?.customerSigningStatus === 'SIGNED' ||
                    contract.signingStatus?.customer === true ||
                    contract.customerSigningStatus === 'SIGNED' ||
                    contract.status === 'Active' ||
                    contract.status === 'ACTIVE' ||
                    contract.contractStatus === 'Active' ||
                    contract.contractStatus === 'ACTIVE';

                  return (
                    <tr key={contract.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Contract Number */}
                      <td className="py-4 px-4 align-top">
                        <div className="space-y-1">
                          <span className="font-mono font-bold text-slate-900 block">
                            {contract.contractNumber || 'CTR-DRAFT'}
                          </span>
                          <div className="flex items-center gap-1.5">
                            {getServiceModeBadge(contract.serviceMode)}
                          </div>
                          {contract.customer?.legalName && (
                            <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                              <Building className="w-3 h-3 text-slate-400" />
                              {contract.customer.legalName}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Service Name & Quota */}
                      <td className="py-4 px-4 align-top">
                        <div className="space-y-1">
                          <span className="font-semibold text-slate-800 block">
                            {contract.title || contract.plan || 'Enterprise Modernization Agreement'}
                          </span>
                          <div className="text-xs text-slate-500 flex items-center gap-1">
                            <Layers className="w-3.5 h-3.5 text-slate-400" />
                            <span>
                              {contract.scopeOfWork?.maxScreens
                                ? `${contract.scopeOfWork.maxScreens} screens`
                                : 'Standard Screens'}
                              {contract.scopeOfWork?.maxPrograms
                                ? ` • ${contract.scopeOfWork.maxPrograms} programs`
                                : ''}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Contract Date */}
                      <td className="py-4 px-4 align-top">
                        <div className="space-y-0.5">
                          <span className="text-slate-800 block font-medium">
                            {formatDate(contract.effectiveDate || contract.createdAt)}
                          </span>
                          {contract.expirationDate && (
                            <span className="text-[11px] text-slate-500 block">
                              Expires: {formatDate(contract.expirationDate)}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Contract Value */}
                      <td className="py-4 px-4 align-top">
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-900 block">
                            {formatCurrency(contract.totalValue, contract.currency || 'VND')}
                          </span>
                          <span className="text-[11px] text-slate-500 block">Includes VAT (if applicable)</span>
                        </div>
                      </td>

                      {/* Contract Status */}
                      <td className="py-4 px-4 align-top">{renderContractStatusBadge(contract)}</td>

                      {/* Payment Status */}
                      <td className="py-4 px-4 align-top">{renderPaymentStatusBadge(contract)}</td>

                      {/* Actions */}
                      <td className="py-4 px-4 align-top text-right">
                        <div className="flex flex-col items-end gap-1.5">
                          {!isSigned ? (
                            <Button
                              size="sm"
                              onClick={() => navigate(`/contracts/${contract.id}`)}
                              className="bg-[#244A70] hover:bg-[#1B3856] text-white font-semibold text-xs px-3 py-1.5 shadow-xs flex items-center gap-1"
                            >
                              <PenTool className="w-3.5 h-3.5" />
                              <span>Review & Sign</span>
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/contracts/${contract.id}`)}
                              className="text-slate-700 hover:text-blue-600 border-slate-300 text-xs px-2.5 py-1 flex items-center gap-1"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>View Contract & Payment</span>
                            </Button>
                          )}

                          {contract.status === 'Active' && (
                            <a
                              href="http://localhost:3003"
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1 cursor-pointer"
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span>Launch Web 3</span>
                            </a>
                          )}

                          <button
                            onClick={() => handleDownloadPdf(contract.id)}
                            className="text-xs text-slate-500 hover:text-blue-600 flex items-center gap-1 mt-0.5 cursor-pointer"
                          >
                            <Download className="w-3 h-3" />
                            <span>Download PDF</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Stacked Card View */}
          <div className="lg:hidden divide-y divide-slate-100">
            {filteredContracts.map((contract) => {
              const isSigned = contract.signingProcess?.customerSigningStatus === 'SIGNED';

              return (
                <div key={contract.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono font-bold text-slate-900 block text-sm">
                        {contract.contractNumber || 'CTR-DRAFT'}
                      </span>
                      <span className="text-xs text-slate-700 font-medium block mt-0.5">
                        {contract.title || contract.plan || 'Enterprise Agreement'}
                      </span>
                    </div>
                    {getServiceModeBadge(contract.serviceMode)}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y border-slate-100">
                    <div>
                      <span className="text-slate-500 block">Effective Date:</span>
                      <span className="font-medium text-slate-800">
                        {formatDate(contract.effectiveDate || contract.createdAt)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Contract Value:</span>
                      <span className="font-bold text-slate-900">
                        {formatCurrency(contract.totalValue, contract.currency || 'VND')}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {renderContractStatusBadge(contract)}
                    {renderPaymentStatusBadge(contract)}
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    {!isSigned ? (
                      <Button
                        size="sm"
                        onClick={() => navigate(`/contracts/${contract.id}`)}
                        className="bg-[#244A70] hover:bg-[#1B3856] text-white font-semibold text-xs flex-1 flex items-center justify-center gap-1"
                      >
                        <PenTool className="w-3.5 h-3.5" />
                        <span>Review & Sign</span>
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/contracts/${contract.id}`)}
                        className="text-slate-700 hover:text-blue-600 border-slate-300 text-xs flex-1 flex items-center justify-center gap-1"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>View Contract & Payment</span>
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownloadPdf(contract.id)}
                      className="text-slate-600 hover:text-blue-600 text-xs px-2.5"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
