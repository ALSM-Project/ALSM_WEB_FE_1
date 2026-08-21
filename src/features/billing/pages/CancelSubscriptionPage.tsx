import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard } from 'lucide-react';
import { billingService } from '../services/billing.service';
import type { Subscription } from '../types/billing';
import { ROUTES } from '@/shared/constants/routes';
import { StatusBadge } from '@/shared/ui/Badge';
import { Button } from '@/shared/ui/Button';

export const CancelSubscriptionPage: React.FC = () => {
  const navigate = useNavigate();
  const [sub, setSub] = useState<Subscription | null>(null);
  const [reason, setReason] = useState<string>('Price is too high');
  const [feedback, setFeedback] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    billingService.getCurrentSubscription().then((data) => setSub(data));
  }, []);

  const handleCancelSubscription = async () => {
    setLoading(true);
    try {
      await billingService.cancelSubscription(reason, feedback);
      alert('Subscription cancellation submitted. Access remains active until Dec 31, 2026.');
      navigate(ROUTES.BILLING.PRICING);
    } finally {
      setLoading(false);
    }
  };

  if (!sub) return <div className="p-8 text-center text-slate-500">Loading subscription info...</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-2">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Billing & Subscription</h1>
        <p className="text-slate-500 text-sm mt-1">Manage your active plan, payment methods, and subscription status.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-sm">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Manage Plan</h3>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-lg text-slate-900">{sub.planName}</span>
              <StatusBadge status={sub.status} />
            </div>
            <p className="text-xs text-slate-500 mt-1">Next Billing Date: {sub.nextBillingDate} (${sub.amount}.00 / year)</p>
          </div>

          <Button variant="secondary" size="sm" onClick={() => navigate(ROUTES.BILLING.UPGRADE)} className="font-semibold">
            Upgrade Plan
          </Button>
        </div>

        <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div className="flex items-center space-x-3 text-xs font-medium">
            <CreditCard className="w-5 h-5 text-brand-600" />
            <span className="text-slate-800">Visa ending in {sub.paymentMethodMask}</span>
          </div>
          <button onClick={() => alert('Update method dialog')} className="text-xs text-brand-600 hover:underline font-semibold">
            Update Method
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 lg:p-8 space-y-6 shadow-sm">
        <div>
          <h3 className="text-xl font-bold text-slate-900">We're sorry to see you go</h3>
          <p className="text-xs text-slate-500 mt-1">
            Your access will remain active until current period end (Dec 31, 2026).
          </p>
        </div>

        <div className="space-y-4">
          <label className="block text-xs font-semibold text-slate-700">
            Please tell us why you are leaving:
          </label>

          <div className="space-y-2 text-xs font-medium text-slate-800">
            {[
              'Price is too high',
              'Missing required features',
              'Project completed',
              'Switching to another tool',
              'Other',
            ].map((r) => (
              <label
                key={r}
                onClick={() => setReason(r)}
                className={`flex items-center space-x-3 p-3.5 rounded-xl border cursor-pointer transition-colors ${
                  reason === r ? 'bg-brand-50 border-brand-300 shadow-xs' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="reason"
                  checked={reason === r}
                  onChange={() => setReason(r)}
                  className="text-brand-600 focus:ring-brand-600"
                />
                <span>{r}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
            Additional Feedback (Optional)
          </label>
          <textarea
            rows={3}
            placeholder="How could we improve?"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg p-3 text-xs focus:outline-none focus:ring-2 focus:ring-brand-600 placeholder:text-slate-400 shadow-xs"
          />
        </div>

        <div className="flex justify-between items-center pt-4 border-t border-slate-100">
          <Button variant="secondary" onClick={() => navigate(ROUTES.PROJECTS.SCREENS('proj-acme'))} className="font-semibold">
            Cancel
          </Button>
          <Button variant="danger" onClick={handleCancelSubscription} isLoading={loading} className="font-semibold">
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
};
export default CancelSubscriptionPage;
