import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ArrowRight, Sparkles, Building2, HelpCircle, Loader2 } from 'lucide-react';
import { ROUTES } from '@/shared/constants/routes';
import { billingService } from '../services/billing.service';
import type { SubscriptionPlan } from '../types/billing';
import './PricingPage.css';

interface PlanDetail {
  id: string;
  name: string;
  description: string;
  monthlyPrice: string;
  annualPrice: string;
  monthlyPeriod: string;
  annualPeriod: string;
  isPopular?: boolean;
  trialText: string;
  ctaText: string;
  ctaVariant: 'primary' | 'outline' | 'secondary';
  route: string;
  specs: { label: string; highlight?: boolean }[];
  features: string[];
}

const FAQS = [
  {
    question: 'Can I change my plan later?',
    answer: 'Yes! You can upgrade or downgrade your plan at any time from your billing dashboard. Prorated credits will be applied automatically.',
  },
  {
    question: 'How does the 14-day free trial work?',
    answer: 'You get full access to the Starter or Professional plan for 14 days without requiring a credit card upfront. Convert your codebase with zero risk.',
  },
  {
    question: 'What legacy formats are supported by ALSM?',
    answer: 'ALSM natively parses IBM BMS screen maps, DSPF definitions, and legacy COBOL program logic, converting them into modern React interfaces and Java microservices.',
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We support credit cards, automated QR bank transfers, invoice billing, and purchase orders for enterprise clients.',
  },
];

export const PricingPage: React.FC = () => {
  const navigate = useNavigate();
  const [isYearly, setIsYearly] = useState(true);
  const [plans, setPlans] = useState<PlanDetail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    billingService
      .getSubscriptionPlans()
      .then((fetchedPlans: SubscriptionPlan[]) => {
        if (!isMounted) return;
        if (fetchedPlans && fetchedPlans.length > 0) {
          const formatted: PlanDetail[] = fetchedPlans.map((p) => {
            const isEnterprise = p.id === 'ENTERPRISE';
            const formatPrice = (val: number) => {
              if (isEnterprise || val === 0) return 'Contact Sales';
              return `${val.toLocaleString('vi-VN')}₫`;
            };
            return {
              id: p.id,
              name: p.name,
              description: p.description,
              monthlyPrice: formatPrice(p.monthlyPrice),
              annualPrice: formatPrice(p.annualPrice),
              monthlyPeriod: isEnterprise ? '' : '/ month',
              annualPeriod: isEnterprise ? '' : '/ year',
              isPopular: p.isPopular,
              trialText: p.trialText || (isEnterprise ? 'Proof of concept on request' : '14-day free trial'),
              ctaText: p.ctaText || (isEnterprise ? 'Contact Sales' : 'Start 14-Day Free Trial'),
              ctaVariant: p.ctaVariant || (p.isPopular ? 'primary' : 'outline'),
              route: isEnterprise ? ROUTES.PUBLIC.CONTACT : ROUTES.BILLING.TRIAL,
              specs: p.specs || (isEnterprise ? [
                { label: 'Unlimited projects', highlight: true },
                { label: 'Unlimited screens', highlight: true },
                { label: 'Unlimited COBOL programs', highlight: true },
                { label: 'Unlimited storage', highlight: true },
              ] : p.id === 'PROFESSIONAL' ? [
                { label: 'Unlimited projects', highlight: true },
                { label: '100 screens / month', highlight: true },
                { label: '20 COBOL programs / month', highlight: true },
                { label: '50 GB storage', highlight: false },
              ] : [
                { label: '1 project', highlight: false },
                { label: '10 screens / month', highlight: false },
                { label: '0 COBOL programs', highlight: false },
                { label: '5 GB storage', highlight: false },
              ]),
              features: p.features || [],
            };
          });
          setPlans(formatted);
        } else {
          setPlans([]);
        }
      })
      .catch((err) => {
        console.warn('Failed to load subscription plans from MongoDB API:', err);
        if (isMounted) setPlans([]);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="alsm-pricing-page max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* ─── Header ─── */}
      <div className="alsm-pricing-header">
        <span className="alsm-pricing-badge">PRICING</span>
        <h1 className="alsm-pricing-title">Choose your plan</h1>
        <p className="alsm-pricing-subtitle">
          Flexible plans for teams modernizing legacy applications.
        </p>

        {/* ─── Billing Toggle ─── */}
        <div className="alsm-pricing-toggle-container">
          <span
            className={`alsm-pricing-toggle-label ${!isYearly ? 'active' : ''}`}
            onClick={() => setIsYearly(false)}
          >
            Monthly
          </span>
          <button
            type="button"
            className={`alsm-pricing-toggle-btn ${isYearly ? 'active' : ''}`}
            onClick={() => setIsYearly(!isYearly)}
            aria-label="Toggle annual billing"
          >
            <div className="alsm-pricing-toggle-thumb" />
          </button>
          <span
            className={`alsm-pricing-toggle-label ${isYearly ? 'active' : ''}`}
            onClick={() => setIsYearly(true)}
          >
            Yearly
          </span>
          <span className="alsm-pricing-discount-badge">Save 20%</span>
        </div>
      </div>

      {/* ─── Pricing Grid ─── */}
      <div className="alsm-pricing-grid">
        {loading ? (
          /* Loading Skeletons */
          [1, 2, 3].map((idx) => (
            <div key={idx} className="alsm-pricing-card animate-pulse">
              <div className="h-6 w-1/3 bg-gray-200 rounded mb-4" />
              <div className="h-4 w-3/4 bg-gray-200 rounded mb-6" />
              <div className="h-10 w-1/2 bg-gray-200 rounded mb-6" />
              <div className="h-12 w-full bg-gray-200 rounded mb-6" />
              <div className="space-y-3">
                <div className="h-4 w-full bg-gray-200 rounded" />
                <div className="h-4 w-5/6 bg-gray-200 rounded" />
                <div className="h-4 w-2/3 bg-gray-200 rounded" />
              </div>
            </div>
          ))
        ) : plans.length === 0 ? (
          /* Empty State */
          <div className="col-span-full p-12 text-center bg-white rounded-3xl border border-[#D9E2EC]">
            <Loader2 className="w-8 h-8 text-[#0652CC] animate-spin mx-auto mb-4" />
            <h3 className="text-xl font-bold text-[#091E42]">Không có gói dịch vụ nào</h3>
            <p className="text-sm text-[#42526E] mt-2">
              Các gói dịch vụ sẽ được thiết lập và cập nhật từ hệ thống quản trị MongoDB.
            </p>
          </div>
        ) : (
          /* Dynamic Plans from MongoDB */
          plans.map((plan) => {
            const price = isYearly ? plan.annualPrice : plan.monthlyPrice;
            const period = isYearly ? plan.annualPeriod : plan.monthlyPeriod;

            return (
              <div
                key={plan.id}
                className={`alsm-pricing-card ${plan.isPopular ? 'popular' : ''}`}
              >
                {plan.isPopular && (
                  <div className="alsm-pricing-popular-badge">
                    <Sparkles className="w-3.5 h-3.5 inline-block mr-1" />
                    Most Popular
                  </div>
                )}

                <div>
                  <div className="alsm-pricing-card-header">
                    <h2 className="alsm-pricing-plan-name">{plan.name}</h2>
                    <p className="alsm-pricing-plan-desc">{plan.description}</p>
                  </div>

                  <div className="alsm-pricing-price-box">
                    <div className="flex items-baseline">
                      <span className="alsm-pricing-amount">{price}</span>
                      {period && <span className="alsm-pricing-cycle">{period}</span>}
                    </div>
                    <span className="alsm-pricing-trial-tag">{plan.trialText}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate(plan.route)}
                    className={`alsm-pricing-cta ${plan.ctaVariant}`}
                  >
                    <span>{plan.ctaText}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  {/* Specs Section */}
                  <div className="alsm-pricing-specs-title">Plan Limits</div>
                  <ul className="alsm-pricing-specs-list">
                    {plan.specs.map((spec, idx) => (
                      <li key={idx} className="alsm-pricing-spec-item">
                        <Check className="alsm-pricing-check-icon" />
                        <span>
                          {spec.highlight ? (
                            <strong className="text-[#0652CC]">{spec.label}</strong>
                          ) : (
                            spec.label
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* Features Section */}
                  <div className="alsm-pricing-specs-title" style={{ marginTop: '16px' }}>
                    Supported Capabilities
                  </div>
                  <ul className="alsm-pricing-specs-list">
                    {plan.features.map((feat, idx) => (
                      <li key={idx} className="alsm-pricing-spec-item">
                        <Check className="alsm-pricing-check-icon" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ─── Enterprise Banner ─── */}
      <div className="alsm-pricing-enterprise-banner">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#E8F1FF] text-[#0652CC] flex items-center justify-center flex-shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div className="alsm-pricing-enterprise-text">
            <h3>Need a custom deployment, on-premise installation, or dedicated SLA?</h3>
            <p>
              Our enterprise engineering team can build a custom proof of concept for your legacy
              BMS and COBOL applications with dedicated security and compliance controls.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate(ROUTES.PUBLIC.CONTACT)}
          className="alsm-pricing-enterprise-btn"
        >
          Talk to Enterprise Sales
        </button>
      </div>

      {/* ─── FAQ Section ─── */}
      <div className="alsm-pricing-faq">
        <h2 className="alsm-pricing-faq-title flex items-center justify-center gap-2">
          <HelpCircle className="w-7 h-7 text-[#0652CC]" />
          Frequently Asked Questions
        </h2>
        <div className="alsm-pricing-faq-grid">
          {FAQS.map((faq, idx) => (
            <div key={idx} className="alsm-pricing-faq-item">
              <h3 className="alsm-pricing-faq-question">{faq.question}</h3>
              <p className="alsm-pricing-faq-answer">{faq.answer}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PricingPage;
