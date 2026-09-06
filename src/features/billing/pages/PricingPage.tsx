import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ArrowRight, Sparkles, Building2, HelpCircle } from 'lucide-react';
import { ROUTES } from '@/shared/constants/routes';
import './PricingPage.css';

interface PlanDetail {
  id: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';
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

const PLANS: PlanDetail[] = [
  {
    id: 'STARTER',
    name: 'Starter',
    description: 'Essential tools for small teams modernizing single applications.',
    monthlyPrice: '$99',
    annualPrice: '$950',
    monthlyPeriod: '/ month',
    annualPeriod: '/ year ($79/mo)',
    trialText: '14-day free trial',
    ctaText: 'Start 14-Day Trial',
    ctaVariant: 'outline',
    route: ROUTES.BILLING.TRIAL,
    specs: [
      { label: '1 project', highlight: false },
      { label: '10 screens / month', highlight: false },
      { label: '0 COBOL programs', highlight: false },
      { label: '5 GB storage', highlight: false },
      { label: '2 team members', highlight: false },
    ],
    features: [
      'BMS to React conversion',
      'Standard community support',
    ],
  },
  {
    id: 'PROFESSIONAL',
    name: 'Professional',
    description: 'Advanced AI capabilities for high-velocity engineering workflows.',
    monthlyPrice: '$499',
    annualPrice: '$4,790',
    monthlyPeriod: '/ month',
    annualPeriod: '/ year ($399/mo)',
    isPopular: true,
    trialText: '14-day free trial',
    ctaText: 'Start 14-Day Free Trial',
    ctaVariant: 'primary',
    route: ROUTES.BILLING.TRIAL,
    specs: [
      { label: 'Unlimited projects', highlight: true },
      { label: '100 screens / month', highlight: true },
      { label: '20 COBOL programs / month', highlight: true },
      { label: '50 GB storage', highlight: false },
      { label: '10 team members', highlight: false },
    ],
    features: [
      'BMS to React & COBOL to Java',
      'AI-assisted mapping',
      'Code review workflow',
      'Priority SLA support',
    ],
  },
  {
    id: 'ENTERPRISE',
    name: 'Enterprise',
    description: 'Custom deployment and maximum security for large organizations.',
    monthlyPrice: 'Contact Sales',
    annualPrice: 'Contact Sales',
    monthlyPeriod: '',
    annualPeriod: '',
    trialText: 'Proof of concept on request',
    ctaText: 'Contact Sales',
    ctaVariant: 'outline',
    route: ROUTES.BILLING.TRIAL,
    specs: [
      { label: 'Unlimited projects', highlight: true },
      { label: 'Unlimited screens', highlight: true },
      { label: 'Unlimited COBOL programs', highlight: true },
      { label: 'Unlimited storage', highlight: true },
      { label: 'Unlimited team members', highlight: true },
    ],
    features: [
      'BMS to React & COBOL to Java',
      'AI-assisted mapping & Code review',
      'Webhook integration & Audit logs',
      'SSO/SAML Integration',
      'Self-hosted deployment option',
      'Dedicated CSM & 99.9% SLA',
    ],
  },
];

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
        {PLANS.map((plan) => {
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
        })}
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
          onClick={() => navigate(ROUTES.BILLING.TRIAL)}
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
