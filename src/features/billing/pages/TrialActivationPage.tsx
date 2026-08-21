import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import { ROUTES } from '@/shared/constants/routes';
import { Button } from '@/shared/ui/Button';

export const TrialActivationPage: React.FC = () => {
  const navigate = useNavigate();
  const [activated, setActivated] = useState(false);

  const handleActivate = () => {
    setActivated(true);
    setTimeout(() => {
      navigate(ROUTES.PROJECTS.SCREENS('proj-acme'));
    }, 1200);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 py-8">
      <div className="text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-brand-50 border border-brand-200 flex items-center justify-center mx-auto text-brand-600 shadow-xs">
          <Sparkles className="w-6 h-6" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Activate Your Trial</h1>
        <p className="text-brand-600 font-semibold text-sm">Professional Trial — $0 Due Today</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-8 space-y-6 shadow-sm">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Included in your 14-day trial:</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-medium text-slate-800">
          <div className="flex items-center space-x-2.5 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>Unlimited Projects</span>
          </div>
          <div className="flex items-center space-x-2.5 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>100 Screens / mo</span>
          </div>
          <div className="flex items-center space-x-2.5 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>AI-assisted structural mapping</span>
          </div>
          <div className="flex items-center space-x-2.5 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>Full platform access</span>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-6 space-y-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Trial Timeline</h4>
          <div className="relative pl-6 space-y-6 border-l-2 border-slate-200 text-xs">
            <div className="relative">
              <span className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-brand-600 border-4 border-white shadow-xs"></span>
              <p className="font-bold text-slate-900">Day 1</p>
              <p className="text-slate-500">Full Pro features unlocked immediately</p>
            </div>
            <div className="relative">
              <span className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-slate-300 border-4 border-white"></span>
              <p className="font-bold text-slate-900">Day 12</p>
              <p className="text-slate-500">Trial expiration reminder email sent</p>
            </div>
            <div className="relative">
              <span className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-slate-300 border-4 border-white"></span>
              <p className="font-bold text-slate-900">Day 14</p>
              <p className="text-slate-500">Billing starts unless cancelled</p>
            </div>
          </div>
        </div>

        {activated ? (
          <div className="bg-[#ECFDF3] border border-[#ABEFC6] text-[#079455] p-4 rounded-xl text-center text-sm font-bold flex items-center justify-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-[#079455]" />
            <span>Trial Activated! Redirecting to Workspace...</span>
          </div>
        ) : (
          <div className="pt-4 space-y-3">
            <Button onClick={handleActivate} className="w-full py-3 space-x-2 text-base font-semibold shadow-xs">
              <span>Activate Free Trial</span>
              <ArrowRight className="w-5 h-5" />
            </Button>
            <p className="text-center text-xs text-slate-500">No credit card required</p>
          </div>
        )}
      </div>
    </div>
  );
};
export default TrialActivationPage;
