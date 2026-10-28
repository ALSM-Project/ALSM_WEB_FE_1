import React, { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  Download,
  Eye,
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
  DollarSign,
  Calendar,
  Building,
  Mail,
  Receipt,
  XCircle,
} from 'lucide-react';
import { Card, Button, Input, Modal } from '@/shared/ui';
import { billingService } from '../services/billing.service';
import type { Invoice } from '../types/billing';

export const InvoicesPage: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const data = await billingService.getInvoices({
        status: statusFilter === 'ALL' ? undefined : statusFilter.toUpperCase(),
        search: searchTerm || undefined,
      });
      setInvoices(data);
    } catch (err) {
      console.error('Failed to load invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [statusFilter]);

  const handleDownloadPdf = async (invoice: Invoice) => {
    try {
      setDownloadingId(invoice.id);
      const blob = await billingService.downloadReceiptPdf(invoice.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const invNum = invoice.invoiceNumber || invoice.id;
      a.download = `Invoice-${invNum}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Failed to download invoice receipt:', err);
    } finally {
      setDownloadingId(null);
    }
  };

  const filteredInvoices = invoices.filter((inv) => {
    const term = searchTerm.toLowerCase();
    const invNum = (inv.invoiceNumber || inv.id || '').toLowerCase();
    const org = (inv.organizationName || '').toLowerCase();
    const email = (inv.customerEmail || '').toLowerCase();
    const itemDesc = (inv.items || []).map((it) => it.description.toLowerCase()).join(' ');

    const matchesSearch = invNum.includes(term) || org.includes(term) || email.includes(term) || itemDesc.includes(term);
    const invStatus = (inv.status || '').toUpperCase();
    const matchesStatus =
      statusFilter === 'ALL' ||
      invStatus === statusFilter.toUpperCase() ||
      (statusFilter === 'PAID' && invStatus === 'PAID') ||
      (statusFilter === 'PENDING' && invStatus === 'PENDING') ||
      (statusFilter === 'FAILED' && (invStatus === 'FAILED' || invStatus === 'OVERDUE'));

    return matchesSearch && matchesStatus;
  });

  const totalBilled = invoices.reduce((acc, i) => acc + (i.amount || 0), 0);
  const totalPaid = invoices
    .filter((i) => (i.status || '').toUpperCase() === 'PAID')
    .reduce((acc, i) => acc + (i.amount || 0), 0);
  const totalOutstanding = invoices
    .filter((i) => {
      const s = (i.status || '').toUpperCase();
      return s === 'PENDING' || s === 'OVERDUE' || s === 'FAILED';
    })
    .reduce((acc, i) => acc + (i.amount || 0), 0);

  const renderStatusBadge = (status: string) => {
    const s = (status || '').toUpperCase();
    switch (s) {
      case 'PAID':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Paid
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5" />
            Pending
          </span>
        );
      case 'OVERDUE':
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertCircle className="w-3.5 h-3.5" />
            {s === 'OVERDUE' ? 'Overdue' : 'Failed'}
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <XCircle className="w-3.5 h-3.5" />
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            {status}
          </span>
        );
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const formatCurrency = (amount: number, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5EAF0] pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-[#091E42] tracking-tight flex items-center gap-2.5">
            <FileText className="w-7 h-7 text-[#0652CC]" />
            Invoices & Billing History
          </h1>
          <p className="text-sm text-[#6B778C] mt-1">
            View, audit, and download official enterprise billing receipts and itemized statements.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchInvoices}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs text-[#091E42] border-[#D9E2EC] hover:bg-[#F7F9FC]"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#0652CC]' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card variant="default" padding="md" className="border-[#E5EAF0] bg-white shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#6B778C]">Total Invoiced</p>
              <h3 className="text-2xl font-extrabold text-[#091E42] mt-1">
                {formatCurrency(totalBilled)}
              </h3>
              <p className="text-[11px] text-[#6B778C] mt-0.5">Lifetime statements across all periods</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-[#E8F1FF] flex items-center justify-center text-[#0652CC]">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <Card variant="default" padding="md" className="border-[#E5EAF0] bg-white shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Settled & Paid</p>
              <h3 className="text-2xl font-extrabold text-emerald-800 mt-1">
                {formatCurrency(totalPaid)}
              </h3>
              <p className="text-[11px] text-emerald-600 mt-0.5">Fully reconciled payments</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <Card variant="default" padding="md" className="border-[#E5EAF0] bg-white shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-amber-700">Outstanding / Due</p>
              <h3 className="text-2xl font-extrabold text-amber-800 mt-1">
                {formatCurrency(totalOutstanding)}
              </h3>
              <p className="text-[11px] text-amber-600 mt-0.5">Awaiting processing or settlement</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
              <Clock className="w-6 h-6" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card variant="default" padding="md" className="border-[#E5EAF0] bg-white shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#6B778C] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <Input
              type="text"
              placeholder="Search by invoice #, organization, or item..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 text-xs py-2 bg-[#F7F9FC] border-[#D9E2EC] focus:bg-white"
            />
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {(['ALL', 'PAID', 'PENDING', 'FAILED'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === st
                    ? 'bg-[#0652CC] text-white shadow-2xs'
                    : 'bg-[#F7F9FC] text-[#42526E] hover:bg-[#E8F1FF] hover:text-[#0652CC] border border-[#E5EAF0]'
                }`}
              >
                {st === 'ALL' ? 'All Invoices' : st.charAt(0) + st.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Invoices Table Card */}
      <Card variant="default" padding="none" className="border-[#E5EAF0] bg-white shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-center">
            <RefreshCw className="w-8 h-8 text-[#0652CC] animate-spin mb-3" />
            <p className="text-sm font-semibold text-[#091E42]">Loading invoice records...</p>
            <p className="text-xs text-[#6B778C] mt-1">Fetching billing data from verified backend</p>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="py-16 px-4 text-center">
            <Receipt className="w-12 h-12 text-[#97A0AF] mx-auto mb-3" />
            <h3 className="text-base font-bold text-[#091E42]">No invoices found</h3>
            <p className="text-xs text-[#6B778C] mt-1 max-w-sm mx-auto">
              {searchTerm || statusFilter !== 'ALL'
                ? 'No billing records match your current search and status filter criteria.'
                : 'There are currently no active or historical invoices for this account.'}
            </p>
            {(searchTerm || statusFilter !== 'ALL') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('ALL');
                }}
                className="mt-4 text-xs"
              >
                Reset Filters
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#F7F9FC] border-b border-[#E5EAF0] text-[#6B778C] font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4">Invoice #</th>
                  <th className="py-3.5 px-4">Issue Date</th>
                  <th className="py-3.5 px-4">Due Date</th>
                  <th className="py-3.5 px-4">Description / Items</th>
                  <th className="py-3.5 px-4 text-right">Amount</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5EAF0]">
                {filteredInvoices.map((inv) => {
                  const invNum = inv.invoiceNumber || inv.id;
                  const firstItem = inv.items && inv.items[0] ? inv.items[0].description : 'Enterprise Modernization Services';
                  const moreItemsCount = (inv.items?.length || 0) - 1;

                  return (
                    <tr
                      key={inv.id}
                      className="hover:bg-[#F7F9FC]/80 transition-colors group cursor-pointer"
                      onClick={() => setSelectedInvoice(inv)}
                    >
                      <td className="py-3.5 px-4 font-bold text-[#091E42]">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-[#0652CC] shrink-0" />
                          <span>{invNum}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-[#42526E]">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-[#6B778C]" />
                          <span>{formatDate(inv.issueDate || inv.date)}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-[#42526E]">
                        <span>{formatDate(inv.dueDate)}</span>
                      </td>
                      <td className="py-3.5 px-4 text-[#091E42] max-w-xs truncate font-medium">
                        <span>{firstItem}</span>
                        {moreItemsCount > 0 && (
                          <span className="ml-1.5 text-[10px] bg-[#E8F1FF] text-[#0652CC] font-bold px-1.5 py-0.5 rounded">
                            +{moreItemsCount} more
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right font-extrabold text-[#091E42]">
                        {formatCurrency(inv.amount, inv.currency)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {renderStatusBadge(inv.status)}
                      </td>
                      <td
                        className="py-3.5 px-4 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedInvoice(inv)}
                            className="p-1.5 text-[#42526E] hover:text-[#0652CC] hover:bg-[#E8F1FF] rounded-lg transition-colors"
                            title="View Itemized Breakdown"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDownloadPdf(inv)}
                            disabled={downloadingId === inv.id}
                            className="p-1.5 text-[#0652CC] hover:bg-[#E8F1FF] rounded-lg transition-colors disabled:opacity-50"
                            title="Download Official Receipt PDF"
                          >
                            {downloadingId === inv.id ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              <Download className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Invoice Detail Modal */}
      {selectedInvoice && (
        <Modal
          isOpen={!!selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          title={`Invoice ${selectedInvoice.invoiceNumber || selectedInvoice.id}`}
          maxWidth="2xl"
        >
          <div className="space-y-6 text-xs text-[#091E42]">
            {/* Meta Information Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#F7F9FC] p-4 rounded-2xl border border-[#E5EAF0]">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[#6B778C]">
                  <Building className="w-4 h-4 text-[#0652CC]" />
                  <span className="font-semibold text-[#091E42]">
                    {selectedInvoice.organizationName || 'ALSM Enterprise Client'}
                  </span>
                </div>
                {selectedInvoice.customerEmail && (
                  <div className="flex items-center gap-2 text-[#6B778C]">
                    <Mail className="w-4 h-4 text-[#0652CC]" />
                    <span>{selectedInvoice.customerEmail}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[#6B778C]">Status:</span>
                  {renderStatusBadge(selectedInvoice.status)}
                </div>
              </div>

              <div className="space-y-1.5 sm:text-right">
                <div>
                  <span className="text-[#6B778C]">Issue Date: </span>
                  <span className="font-bold text-[#091E42]">
                    {formatDate(selectedInvoice.issueDate || selectedInvoice.date)}
                  </span>
                </div>
                <div>
                  <span className="text-[#6B778C]">Due Date: </span>
                  <span className="font-bold text-[#091E42]">
                    {formatDate(selectedInvoice.dueDate)}
                  </span>
                </div>
                {selectedInvoice.paidAt && (
                  <div>
                    <span className="text-emerald-700 font-medium">Paid On: </span>
                    <span className="font-bold text-emerald-800">
                      {formatDate(selectedInvoice.paidAt)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Line Items Table */}
            <div>
              <h4 className="font-bold text-sm text-[#091E42] mb-3">Itemized Billing Breakdown</h4>
              <div className="border border-[#E5EAF0] rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#F7F9FC] border-b border-[#E5EAF0] text-[#6B778C] font-bold text-[11px] uppercase">
                      <th className="py-2.5 px-3">Item / Service</th>
                      <th className="py-2.5 px-3 text-center">Qty</th>
                      <th className="py-2.5 px-3 text-right">Unit Price</th>
                      <th className="py-2.5 px-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5EAF0]">
                    {(selectedInvoice.items && selectedInvoice.items.length > 0) ? (
                      selectedInvoice.items.map((item, idx) => (
                        <tr key={item.id || idx} className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-3 font-medium text-[#091E42]">{item.description}</td>
                          <td className="py-2.5 px-3 text-center text-[#6B778C]">{item.quantity}</td>
                          <td className="py-2.5 px-3 text-right text-[#42526E]">
                            {formatCurrency(item.unitPrice, selectedInvoice.currency)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-[#091E42]">
                            {formatCurrency(item.total, selectedInvoice.currency)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="py-2.5 px-3 font-medium text-[#091E42]">
                          ALSM Enterprise Modernization Services & Conversion Quota
                        </td>
                        <td className="py-2.5 px-3 text-center text-[#6B778C]">1</td>
                        <td className="py-2.5 px-3 text-right text-[#42526E]">
                          {formatCurrency(selectedInvoice.amount, selectedInvoice.currency)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-[#091E42]">
                          {formatCurrency(selectedInvoice.amount, selectedInvoice.currency)}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totals Summary */}
            <div className="flex justify-end">
              <div className="w-full sm:w-64 space-y-2 border-t border-[#E5EAF0] pt-3">
                <div className="flex justify-between text-[#6B778C]">
                  <span>Subtotal:</span>
                  <span className="font-semibold text-[#091E42]">
                    {formatCurrency(selectedInvoice.subtotal || selectedInvoice.amount * 0.9, selectedInvoice.currency)}
                  </span>
                </div>
                <div className="flex justify-between text-[#6B778C]">
                  <span>Tax / VAT (10%):</span>
                  <span className="font-semibold text-[#091E42]">
                    {formatCurrency(selectedInvoice.tax || selectedInvoice.amount * 0.1, selectedInvoice.currency)}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-extrabold text-[#091E42] border-t border-[#E5EAF0] pt-2">
                  <span>Grand Total:</span>
                  <span className="text-[#0652CC]">
                    {formatCurrency(selectedInvoice.amount, selectedInvoice.currency)}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-[#E5EAF0]">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedInvoice(null)}
                className="text-xs"
              >
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleDownloadPdf(selectedInvoice)}
                disabled={downloadingId === selectedInvoice.id}
                className="flex items-center gap-2 text-xs bg-[#0652CC] hover:bg-[#0655FF] text-white"
              >
                {downloadingId === selectedInvoice.id ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                Download Receipt PDF
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default InvoicesPage;
