import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Check, Info } from 'lucide-react';
import { billingService } from '../services/billing.service';
import { ROUTES } from '@/shared/constants/routes';
import { Button } from '@/shared/ui/Button';

const formatVnd = (amount: number) => new Intl.NumberFormat('vi-VN').format(amount) + '₫';

export const UpgradeSubscriptionPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleConfirmUpgrade = async () => {
    setLoading(true);
    try {
      await billingService.upgradePlan('PROFESSIONAL');
      alert('Subscription upgraded to Professional Tier!');
      navigate(ROUTES.BILLING.SUBSCRIPTION);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 py-6">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Upgrade Subscription</h1>
        <p className="text-slate-500 text-sm mt-1">Upgrade your tier for higher screen limits and priority validation capabilities.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">CURRENT PLAN</span>
          <div>
            <h3 className="text-xl font-bold text-slate-900">Starter</h3>
            <p className="text-2xl font-extrabold text-slate-700 mt-1">{formatVnd(99_000)} <span className="text-xs font-normal text-slate-500">/tháng</span></p>
          </div>
          <ul className="space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-3 font-medium">
            <li>• 5 Projects</li>
            <li>• 20 Screens/mo</li>
          </ul>
        </div>

        <div className="bg-brand-50 border-2 border-brand-600 rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-700">TARGET PLAN</span>
            <span className="bg-brand-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">Pro Tier</span>
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">PROFESSIONAL</h3>
            <p className="text-3xl font-extrabold text-brand-600 mt-1">{formatVnd(499_000)} <span className="text-xs font-normal text-slate-500">/tháng</span></p>
          </div>
          <ul className="space-y-2 text-xs text-slate-800 border-t border-brand-200/80 pt-3 font-medium">
            <li className="flex items-center space-x-2">
              <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Unlimited Projects</span>
            </li>
            <li className="flex items-center space-x-2">
              <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>100 Screens/mo</span>
            </li>
            <li className="flex items-center space-x-2">
              <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Priority Support</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">PRORATED BILLING SUMMARY</h3>

        <div className="space-y-2 text-xs font-medium text-slate-700">
          <div className="flex justify-between">
            <span className="text-slate-500">Credit remaining from current plan:</span>
            <span className="text-[#079455] font-bold font-mono">-{formatVnd(42_500)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Professional Plan (prorated remainder of month):</span>
            <span className="text-slate-900 font-bold font-mono">{formatVnd(499_000)}</span>
          </div>
          <div className="border-t border-slate-100 pt-3 flex justify-between items-center text-sm">
            <span className="text-slate-900 font-bold">Due today for upgrade:</span>
            <span className="text-brand-600 font-extrabold text-base font-mono">{formatVnd(456_500)}</span>
          </div>
        </div>

        <div className="bg-brand-50 border border-brand-200 p-4 rounded-xl text-xs text-brand-700 flex items-start space-x-2.5 font-medium">
          <Info className="w-4 h-4 text-brand-600 flex-shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Your new limits activate immediately upon confirmation. Next billing cycle will be at the full rate.
          </p>
        </div>
      </div>

      <div className="flex justify-between items-center pt-4 border-t border-slate-100">
        <Button variant="secondary" onClick={() => navigate(ROUTES.BILLING.PRICING)} className="font-semibold">
          Cancel
        </Button>
        <Button onClick={handleConfirmUpgrade} isLoading={loading} className="space-x-2 font-semibold px-8 shadow-xs">
          <span>Confirm Upgrade</span>
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
export default UpgradeSubscriptionPage;
