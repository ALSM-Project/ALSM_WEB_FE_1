import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ArrowRight } from 'lucide-react';
import { mockSubscriptionPlans } from '@/mocks/billing.mock';
import { ROUTES } from '@/shared/constants/routes';
import { Button } from '@/shared/ui/Button';

const formatVnd = (amount: number) => {
  if (amount === 0) return 'Custom pricing';
  return new Intl.NumberFormat('vi-VN').format(amount) + '₫';
};

export const PricingPage: React.FC = () => {
  const navigate = useNavigate();
  const [isAnnual, setIsAnnual] = useState(true);

  return (
    <div className="space-y-10 py-6 max-w-6xl mx-auto">
      <div className="text-center space-y-3">
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">Simple, transparent pricing</h1>
        <p className="text-slate-500 max-w-2xl mx-auto text-sm md:text-base">
          Accelerate your legacy modernization journey with plans designed for engineering teams of all sizes.
        </p>

        <div className="flex items-center justify-center space-x-3 pt-4">
          <span className={`text-xs font-semibold ${!isAnnual ? 'text-slate-900' : 'text-slate-500'}`}>Monthly</span>
          <button
            onClick={() => setIsAnnual(!isAnnual)}
            className="w-12 h-6 bg-slate-200 rounded-full p-1 transition-colors relative focus:outline-none"
          >
            <div
              className={`w-4 h-4 rounded-full bg-brand-600 transition-transform ${
                isAnnual ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
          <div className="flex items-center space-x-2">
            <span className={`text-xs font-semibold ${isAnnual ? 'text-slate-900' : 'text-slate-500'}`}>Annual</span>
            <span className="bg-[#ECFDF3] text-[#079455] text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-[#ABEFC6]">
              SAVE 20%
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
        {mockSubscriptionPlans.map((plan) => {
          const price = isAnnual ? plan.annualPrice : plan.monthlyPrice;
          return (
            <div
              key={plan.id}
              className={`rounded-2xl p-8 flex flex-col justify-between transition-all bg-white relative ${
                plan.isPopular
                  ? 'border-2 border-brand-600 shadow-md'
                  : 'border border-slate-200 shadow-sm hover:border-slate-300'
              }`}
            >
              {plan.isPopular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-brand-600 text-white text-[11px] font-bold uppercase tracking-wider px-3.5 py-0.5 rounded-full shadow-xs">
                  MOST POPULAR
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed min-h-[36px]">{plan.description}</p>
                </div>

                <div>
                  {plan.id === 'ENTERPRISE' ? (
                    <div className="space-y-1">
                      <p className="text-3xl font-extrabold text-slate-900">Custom pricing</p>
                      <p className="text-xs text-slate-500">Contact for quote</p>
                    </div>
                  ) : (
                    <div className="flex items-baseline space-x-1">
                      <span className="text-3xl font-extrabold text-slate-900">{formatVnd(price)}</span>
                      <span className="text-xs font-medium text-slate-500">/tháng</span>
                    </div>
                  )}
                </div>

                {/* Primary CTA placed directly below price according to Figma */}
                <div>
                  {plan.id === 'PROFESSIONAL' ? (
                    <Button
                      onClick={() => navigate(ROUTES.BILLING.TRIAL)}
                      className="w-full py-2.5 space-x-2 text-sm shadow-xs font-semibold"
                    >
                      <span>Start Free Trial</span>
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  ) : plan.id === 'STARTER' ? (
                    <Button
                      variant="outline"
                      onClick={() => navigate(ROUTES.BILLING.PAYMENT)}
                      className="w-full py-2.5 text-sm font-semibold"
                    >
                      Get Started
                    </Button>
                  ) : (
                    <Button
                      variant="secondary"
                      onClick={() => alert('Contacting sales...')}
                      className="w-full py-2.5 text-sm font-semibold"
                    >
                      Contact Sales
                    </Button>
                  )}
                </div>

                <div className="border-t border-slate-100 pt-6 space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Included Features</p>
                  <ul className="space-y-3 text-xs text-slate-600">
                    {plan.features.map((feat, idx) => (
                      <li key={idx} className="flex items-center space-x-2.5">
                        <Check className="w-4 h-4 text-[#079455] flex-shrink-0" />
                        <span className="text-slate-700">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-center text-xs text-slate-500">
        Secure payment via QR bank transfer. Cancel anytime. Read our FAQ.
      </p>
    </div>
  );
};
export default PricingPage;
