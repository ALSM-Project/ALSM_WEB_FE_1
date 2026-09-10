import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Mail, CreditCard, Lock, Check } from 'lucide-react';
import { ROUTES } from '@/shared/constants/routes';
import { Button } from '@/shared/ui/Button';

export const TrialActivationPage: React.FC = () => {
  const navigate = useNavigate();
  const [activated, setActivated] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleActivate = () => {
    setLoading(true);
    setTimeout(() => {
      setActivated(true);
      setLoading(false);
      setTimeout(() => {
        navigate(ROUTES.PROJECTS.SCREENS('proj-acme'));
      }, 1500);
    }, 600);
  };

  return (
    <div className="py-8 px-4 flex items-center justify-center">
      <div className="max-w-md w-full bg-white border border-slate-200/90 rounded-2xl p-8 shadow-xs space-y-6">
        {/* Title Header & Badge */}
        <div className="text-center space-y-2.5">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Activate Your Trial</h1>
          <div>
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>Professional Trial — $0 Due Today</span>
            </span>
          </div>
        </div>

        {/* Feature List */}
        <div className="space-y-3.5 pt-2 pl-2">
          <div className="flex items-center space-x-3 text-sm font-semibold text-slate-800">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 fill-emerald-100" />
            <span>Unlimited Projects</span>
          </div>
          <div className="flex items-center space-x-3 text-sm font-semibold text-slate-800">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 fill-emerald-100" />
            <span>100 Screens/mo</span>
          </div>
          <div className="flex items-center space-x-3 text-sm font-semibold text-slate-800">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 fill-emerald-100" />
            <span>AI-assisted structural mapping</span>
          </div>
          <div className="flex items-center space-x-3 text-sm font-semibold text-slate-800">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 fill-emerald-100" />
            <span>Full platform access</span>
          </div>
        </div>

        {/* Timeline Section */}
        <div className="space-y-3 pt-2">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Timeline</h3>

          <div className="relative flex items-center justify-between pt-1">
            {/* Step 1 Node */}
            <div className="flex flex-col items-center text-center z-10 w-24">
              <div className="w-7 h-7 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                <Check className="w-4 h-4 stroke-[3]" />
              </div>
              <span className="text-xs font-bold text-brand-600 mt-2">Day 1</span>
              <span className="text-[11px] text-slate-500 mt-0.5 leading-tight">Full platform access</span>
            </div>

            {/* Connecting Line 1 */}
            <div className="h-0.5 flex-1 bg-slate-200 -mt-8"></div>

            {/* Step 2 Node */}
            <div className="flex flex-col items-center text-center z-10 w-24">
              <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-300 text-slate-500 flex items-center justify-center text-xs">
                <Mail className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold text-slate-500 mt-2">Day 12</span>
              <span className="text-[11px] text-slate-500 mt-0.5 leading-tight">Trial expiration reminder</span>
            </div>

            {/* Connecting Line 2 */}
            <div className="h-0.5 flex-1 bg-slate-200 -mt-8"></div>

            {/* Step 3 Node */}
            <div className="flex flex-col items-center text-center z-10 w-24">
              <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-300 text-slate-500 flex items-center justify-center text-xs">
                <CreditCard className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold text-slate-500 mt-2">Day 14</span>
              <span className="text-[11px] text-slate-500 mt-0.5 leading-tight">Billing starts unless cancelled</span>
            </div>
          </div>
        </div>

        {/* Action Button & Lock Notice */}
        {activated ? (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-center text-xs font-bold flex items-center justify-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Trial Activated! Redirecting to Workspace...</span>
          </div>
        ) : (
          <div className="space-y-2.5 pt-2">
            <Button
              onClick={handleActivate}
              isLoading={loading}
              className="w-full py-3.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl text-sm transition-colors shadow-xs"
            >
              Activate Free Trial
            </Button>
            <div className="flex items-center justify-center space-x-1.5 text-xs text-slate-400 font-medium">
              <Lock className="w-3.5 h-3.5" />
              <span>No credit card required</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrialActivationPage;
