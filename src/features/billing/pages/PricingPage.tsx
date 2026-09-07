import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Check,
  ArrowRight,
  Sparkles,
  Building2,
  HelpCircle,
  ShieldCheck,
  Layers,
  Workflow,
  FileSearch,
  Terminal,
  Cpu,
  Activity,
  FileCode,
  FolderKanban,
  ClipboardCheck,
  Lock,
  ChevronRight,
} from 'lucide-react';
import { ROUTES } from '@/shared/constants/routes';
import './PricingPage.css';

interface OfferingCard {
  id: string;
  label: string;
  description: string;
  commercialModel: string;
  ctaText: string;
  isRecommended?: boolean;
  badgeText?: string;
  scope: string[];
}

const COMMERCIAL_CARDS: OfferingCard[] = [
  {
    id: 'assessment',
    label: 'ASSESSMENT',
    description: 'Understand your legacy estate before committing to a broader modernization program.',
    commercialModel: 'Custom quote',
    ctaText: 'Request an Assessment',
    scope: [
      'Legacy application inventory',
      'BMS/DSPF screen analysis',
      'COBOL program analysis',
      'Conversion feasibility assessment',
      'Complexity and risk assessment',
      'Modernization scope recommendations',
    ],
  },
  {
    id: 'pilot',
    label: 'PILOT',
    description: 'Validate the modernization approach on a representative workload before broader implementation.',
    commercialModel: 'Custom quote',
    ctaText: 'Discuss a Pilot',
    scope: [
      'Selected screens or programs',
      'Conversion Algorithm evaluation',
      'Generated React / Java output',
      'Rule-based validation',
      'Optional AI-assisted validation',
      'Human review workflow',
      'Pilot findings and recommendations',
    ],
  },
  {
    id: 'enterprise-platform',
    label: 'ENTERPRISE PLATFORM',
    isRecommended: true,
    badgeText: 'RECOMMENDED',
    description: 'Run modernization programs with a controlled platform for conversion, validation, diagnostics, review, and versioned re-conversion.',
    commercialModel: 'Annual enterprise contract',
    ctaText: 'Request Enterprise Pricing',
    scope: [
      'Enterprise projects',
      'BMS/DSPF → React conversion',
      'COBOL → Java conversion',
      'Automated mapping',
      'Rule Validator',
      'Optional AI Validator',
      'Review Queue',
      'Diagnostics',
      'Conversion Versions',
      'Export workflows',
    ],
  },
  {
    id: 'modernization-program',
    label: 'MODERNIZATION PROGRAM',
    description: 'Modernize larger application portfolios through a structured combination of platform capabilities and modernization services.',
    commercialModel: 'Project / contract-based',
    ctaText: 'Talk to a Modernization Specialist',
    scope: [
      'Discovery and assessment',
      'Conversion planning',
      'Pilot implementation',
      'Conversion execution',
      'Validation and review',
      'Integration support',
      'Migration assistance',
      'Support and knowledge transfer',
      'Post-modernization support options',
    ],
  },
];

const WORKFLOW_STEPS = [
  {
    step: '01',
    title: 'Assess',
    description: 'Understand the legacy estate, workload, complexity, and modernization scope.',
    icon: FileSearch,
  },
  {
    step: '02',
    title: 'Pilot',
    description: 'Validate the Conversion Algorithm and generated output on a representative workload.',
    icon: Workflow,
  },
  {
    step: '03',
    title: 'Plan',
    description: 'Define modernization scope, delivery requirements, validation strategy, and commercial terms.',
    icon: FolderKanban,
  },
  {
    step: '04',
    title: 'Modernize',
    description: 'Execute conversion, validation, human review, diagnostics, and versioned re-conversion.',
    icon: Cpu,
  },
  {
    step: '05',
    title: 'Support',
    description: 'Continue with enterprise platform access, support, and future modernization phases.',
    icon: ShieldCheck,
  },
];

const PRICING_FACTORS = [
  { label: 'Number of BMS/DSPF screens', icon: Layers },
  { label: 'Number of COBOL programs', icon: Terminal },
  { label: 'Application / code volume', icon: FileCode },
  { label: 'Application complexity', icon: Cpu },
  { label: 'Integration requirements', icon: Workflow },
  { label: 'Validation requirements', icon: ShieldCheck },
  { label: 'Number of projects or teams', icon: FolderKanban },
  { label: 'Environment requirements', icon: Building2 },
  { label: 'Support requirements', icon: Activity },
  { label: 'Professional services scope', icon: ClipboardCheck },
  { label: 'Pilot and modernization phases', icon: ClockIcon },
];

function ClockIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

const PROCUREMENT_ITEMS = [
  {
    title: 'Technical Assessment',
    description: 'Detailed evaluation of legacy mapfields, COBOL copybooks, and target architecture alignment.',
    icon: FileSearch,
  },
  {
    title: 'Security & Compliance Review',
    description: 'Review of enterprise security guidelines, code inspection rules, and data isolation controls.',
    icon: Lock,
  },
  {
    title: 'Scope Definition',
    description: 'Structured mapping of screens, programs, milestone criteria, and modernization deliverables.',
    icon: ClipboardCheck,
  },
  {
    title: 'Procurement & Contracting',
    description: 'Clear statement of work, licensing terms, governance framework, and commercial agreements.',
    icon: Building2,
  },
  {
    title: 'Implementation Planning',
    description: 'Onboarding schedules, conversion pipeline setup, and technical team alignment.',
    icon: Workflow,
  },
  {
    title: 'Support & Knowledge Transfer',
    description: 'Technical guidance, platform enablement, diagnostics review, and team training.',
    icon: ShieldCheck,
  },
];

const FAQS = [
  {
    question: 'Do you publish fixed monthly pricing?',
    answer: 'ALSM uses a quote-based enterprise commercial model. Pricing depends on modernization scope, workload complexity, validation requirements, implementation needs, and the level of platform and service support required.',
  },
  {
    question: 'Can we evaluate ALSM before a full modernization program?',
    answer: 'Yes. An Assessment and Pilot can be used to evaluate the legacy workload, conversion feasibility, generated output, validation workflow, and modernization scope before a broader engagement.',
  },
  {
    question: 'Is ALSM a self-service SaaS product?',
    answer: 'ALSM is designed primarily for enterprise legacy modernization programs. The platform supports structured conversion and validation workflows, while enterprise engagements can include assessment, pilot, implementation, and professional services.',
  },
  {
    question: 'Does AI perform the conversion?',
    answer: 'No. Core BMS/DSPF and COBOL conversion is performed by the Conversion Algorithm. AI is used only as optional validation assistance.',
  },
  {
    question: 'How is enterprise pricing determined?',
    answer: 'Pricing is determined through workload and project assessment rather than a single public monthly subscription price.',
  },
];

export const PricingPage: React.FC = () => {
  const navigate = useNavigate();

  const handleContactNavigate = () => {
    navigate(ROUTES.PUBLIC.CONTACT);
  };

  return (
    <div className="alsm-pricing-page max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* ================================================== */}
      {/* 01. HERO SECTION                                   */}
      {/* ================================================== */}
      <div className="alsm-pricing-hero">
        <span className="alsm-pricing-eyebrow">ENTERPRISE MODERNIZATION</span>
        <h1 className="alsm-pricing-title">
          Modernization Plans Built Around Your Legacy Estate
        </h1>
        <p className="alsm-pricing-subtitle">
          Assess, pilot, and modernize business-critical legacy applications with a commercial model that fits your workload.
        </p>
        <p className="alsm-pricing-description">
          ALSM combines deterministic conversion algorithms, automated analysis and mapping, rule-based validation, optional AI-assisted validation, and human review into a controlled modernization workflow.
        </p>
        <div className="alsm-pricing-hero-actions">
          <button
            type="button"
            onClick={handleContactNavigate}
            className="alsm-pricing-btn primary"
          >
            <span>Request an Assessment</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleContactNavigate}
            className="alsm-pricing-btn outline"
          >
            <span>Request Enterprise Pricing</span>
          </button>
        </div>
      </div>

      {/* ================================================== */}
      {/* 02. COMMERCIAL MODEL CARDS                         */}
      {/* ================================================== */}
      <div className="alsm-pricing-grid-4">
        {COMMERCIAL_CARDS.map((card) => (
          <div
            key={card.id}
            className={`alsm-offering-card ${card.isRecommended ? 'recommended' : ''}`}
          >
            {card.isRecommended && card.badgeText && (
              <div className="alsm-recommended-badge">
                <Sparkles className="w-3.5 h-3.5 inline-block mr-1" />
                {card.badgeText}
              </div>
            )}

            <div className="alsm-offering-card-header">
              <span className="alsm-offering-label">{card.label}</span>
              <p className="alsm-offering-desc">{card.description}</p>
            </div>

            <div className="alsm-offering-model-box">
              <span className="alsm-offering-model-tag">{card.commercialModel}</span>
            </div>

            <button
              type="button"
              onClick={handleContactNavigate}
              className={`alsm-offering-cta ${card.isRecommended ? 'primary' : 'outline'}`}
            >
              <span>{card.ctaText}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="alsm-offering-scope-title">Scope & Capabilities</div>
            <ul className="alsm-offering-scope-list">
              {card.scope.map((item, idx) => (
                <li key={idx} className="alsm-offering-scope-item">
                  <Check className="alsm-offering-check-icon" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* ================================================== */}
      {/* 03. COMMERCIAL WORKFLOW SECTION                    */}
      {/* ================================================== */}
      <section className="alsm-workflow-section">
        <div className="alsm-section-header">
          <span className="alsm-section-tag">COMMERCIAL PROCESS</span>
          <h2 className="alsm-section-title">From Assessment to Enterprise Modernization</h2>
          <p className="alsm-section-desc">
            A controlled, risk-mitigated journey for modernizing mission-critical IBM i/AS400 and COBOL workloads.
          </p>
        </div>

        <div className="alsm-workflow-grid">
          {WORKFLOW_STEPS.map((step, idx) => (
            <div key={step.step} className="alsm-workflow-card">
              <div className="alsm-workflow-step-num">{step.step}</div>
              <div className="alsm-workflow-icon-box">
                <step.icon className="w-5 h-5 text-[#0652CC]" />
              </div>
              <h3 className="alsm-workflow-step-title">{step.title}</h3>
              <p className="alsm-workflow-step-desc">{step.description}</p>
              {idx < WORKFLOW_STEPS.length - 1 && (
                <ChevronRight className="alsm-workflow-arrow hidden lg:block" />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ================================================== */}
      {/* 04. WHAT DETERMINES YOUR PRICING                   */}
      {/* ================================================== */}
      <section className="alsm-factors-section">
        <div className="alsm-section-header">
          <span className="alsm-section-tag">WORKLOAD EVALUATION</span>
          <h2 className="alsm-section-title">What Determines Your Enterprise Pricing?</h2>
          <p className="alsm-section-desc">
            Commercial proposals are tailored to your legacy environment and modernization objectives based on key workload and engagement factors.
          </p>
        </div>

        <div className="alsm-factors-grid">
          {PRICING_FACTORS.map((factor, idx) => (
            <div key={idx} className="alsm-factor-item">
              <factor.icon className="w-5 h-5 text-[#0652CC] shrink-0" />
              <span>{factor.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ================================================== */}
      {/* 05. ENTERPRISE PROCUREMENT SECTION                 */}
      {/* ================================================== */}
      <section className="alsm-procurement-section">
        <div className="alsm-section-header">
          <span className="alsm-section-tag">ENTERPRISE GOVERNANCE</span>
          <h2 className="alsm-section-title">Built for Enterprise Procurement</h2>
          <p className="alsm-section-desc max-w-3xl mx-auto">
            Legacy modernization often involves more than selecting a software subscription. Enterprise engagements may require technical discovery, security review, due diligence, procurement, contractual approval, implementation planning, and ongoing support.
          </p>
        </div>

        <div className="alsm-procurement-grid">
          {PROCUREMENT_ITEMS.map((item, idx) => (
            <div key={idx} className="alsm-procurement-card">
              <div className="alsm-procurement-icon">
                <item.icon className="w-6 h-6 text-[#0652CC]" />
              </div>
              <h3 className="alsm-procurement-title">{item.title}</h3>
              <p className="alsm-procurement-desc">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ================================================== */}
      {/* 06. FAQ SECTION                                    */}
      {/* ================================================== */}
      <section className="alsm-pricing-faq">
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
      </section>

      {/* ================================================== */}
      {/* 07. BOTTOM CTA BANNER                              */}
      {/* ================================================== */}
      <div className="alsm-pricing-bottom-cta">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="alsm-bottom-cta-text">
            <h3>Start With an Assessment</h3>
            <p>
              Tell us about your legacy environment and modernization goals. We can help define the appropriate assessment, pilot, platform, and implementation scope.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <button
              type="button"
              onClick={handleContactNavigate}
              className="alsm-pricing-btn primary"
            >
              <span>Request an Assessment</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleContactNavigate}
              className="alsm-pricing-btn outline-light"
            >
              <span>Request Enterprise Pricing</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;
