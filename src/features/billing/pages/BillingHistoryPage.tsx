import React, { useState, useEffect } from 'react';
import { Search, Download, FileText, CreditCard } from 'lucide-react';
import { billingService } from '../services/billing.service';
import type { Invoice } from '../types/billing';
import { StatusBadge } from '@/shared/ui/Badge';

const formatVnd = (amount: number) => new Intl.NumberFormat('vi-VN').format(amount) + '₫';
const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('vi-VN', { year: 'numeric', month: 'short', day: 'numeric' });
};

export const BillingHistoryPage: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    billingService.getInvoices().then((data) => setInvoices(data));
  }, []);

  const filteredInvoices = invoices.filter((inv) =>
    (inv.invoiceNumber || inv.id).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 py-2">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Billing History</h1>
        <p className="text-slate-500 text-sm mt-1">View and download your past invoices</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search invoices..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-600 shadow-xs"
          />
        </div>

        <select className="bg-white border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-600 shadow-xs">
          <option>All time</option>
          <option>2026</option>
          <option>2025</option>
        </select>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-200">
              <tr>
                <th className="p-4">Invoice</th>
                <th className="p-4">Plan</th>
                <th className="p-4">Billing Period</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Payment</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-mono font-bold text-slate-900 flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-brand-600 flex-shrink-0" />
                    <span>{inv.invoiceNumber || inv.id}</span>
                  </td>
                  <td className="p-4 text-slate-700 font-medium">{inv.planName}</td>
                  <td className="p-4 text-slate-500 font-medium">
                    {formatDate(inv.billingPeriodStart)} – {formatDate(inv.billingPeriodEnd)}
                  </td>
                  <td className="p-4 font-bold text-slate-900 font-mono">{formatVnd(inv.amountVnd)}</td>
                  <td className="p-4 text-slate-600 flex items-center space-x-1.5 font-medium">
                    <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                    <span>{inv.paymentMethod || 'Pending'}</span>
                  </td>
                  <td className="p-4">
                    <StatusBadge status={inv.status === 'PAID' ? 'Paid' : inv.status === 'PENDING' ? 'Pending' : inv.status} />
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => alert(`Downloading PDF invoice ${inv.invoiceNumber || inv.id}...`)}
                      className="px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-semibold rounded-lg transition-colors inline-flex items-center space-x-1 shadow-xs"
                      title="Download PDF"
                    >
                      <Download className="w-3.5 h-3.5 text-slate-500" />
                      <span>PDF</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-slate-50 px-4 py-3 border-t border-slate-200 text-xs text-slate-500 font-medium">
          Showing 1 to {filteredInvoices.length} of {invoices.length} results
        </div>
      </div>
    </div>
  );
};
export default BillingHistoryPage;
