import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, MessageSquare, Calendar, HelpCircle, Layers, Sparkles, FolderKanban, CreditCard } from 'lucide-react';
import { ROUTES } from '@/shared/constants/routes';
import './FaqPage.css';

interface FaqItem {
  id: string;
  category: 'GENERAL' | 'MODERNIZATION' | 'AI & VALIDATION' | 'PROJECTS' | 'BILLING';
  question: string;
  answer: string;
}

const FAQ_DATA: FaqItem[] = [
  // ─── GENERAL ───
  {
    id: 'gen-1',
    category: 'GENERAL',
    question: 'What is ALSM?',
    answer:
      'ALSM (Automated Legacy Screen & Code Modernization) is an enterprise SaaS platform designed to automate the conversion of legacy mainframe screens (BMS, DSPF) into modern React components and legacy COBOL business logic into maintainable Java microservices.',
  },
  {
    id: 'gen-2',
    category: 'GENERAL',
    question: 'What types of legacy applications does ALSM support?',
    answer:
      'ALSM currently supports IBM mainframe BMS (Basic Mapping Support) screen definition maps, AS/400 DSPF (Display File) screens, and IBM Enterprise COBOL business logic programs.',
  },
  {
    id: 'gen-3',
    category: 'GENERAL',
    question: 'Who is ALSM designed for?',
    answer:
      'ALSM is built for enterprise software engineering teams, system integrators, solution architects, and IT modernization leaders migrating legacy core systems to modern cloud-native architectures.',
  },

  // ─── MODERNIZATION ───
  {
    id: 'mod-1',
    category: 'MODERNIZATION',
    question: 'How does BMS / DSPF modernization work?',
    answer:
      'The Conversion Algorithm analyzes raw BMS macro definitions (.bms) and DSPF DDS files, extracts field positions, attributes, and colors, deterministically maps screen fields to target components, and generates React JSX components.',
  },
  {
    id: 'mod-2',
    category: 'MODERNIZATION',
    question: 'How does COBOL modernization work?',
    answer:
      'The Conversion Algorithm parses COBOL DIVISION statements, data structures, and PROCEDURE DIVISION paragraphs, mapping business rules to Java methods and generating Spring Boot-compatible service classes.',
  },
  {
    id: 'mod-3',
    category: 'MODERNIZATION',
    question: 'What does the modernization workflow look like?',
    answer:
      'The workflow follows a structured pipeline: Analyze (screen analysis / parsing) → Map (field & paragraph mapping by algorithm) → Generate (React & Java code generation) → Rule Validate → Optional AI Validation Assistance → Human Review → Export.',
  },
  {
    id: 'mod-4',
    category: 'MODERNIZATION',
    question: 'Can I review generated output before export?',
    answer:
      'Yes. ALSM provides an interactive Preview Studio where you can inspect side-by-side legacy code, field mapping tables, generated React component trees, and live UI renders before exporting.',
  },

  // ─── AI & VALIDATION ───
  {
    id: 'ai-1',
    category: 'AI & VALIDATION',
    question: 'Does ALSM use AI for core conversion?',
    answer:
      'No. Core BMS/DSPF and COBOL conversion is performed deterministically by the Conversion Algorithm. AI is used ONLY as optional validation assistance.',
  },
  {
    id: 'ai-2',
    category: 'AI & VALIDATION',
    question: 'How is AI used in ALSM?',
    answer:
      'The optional AI Validator assists the Rule Validator by identifying candidate findings with confidence and risk indicators. It does NOT generate initial mappings, modify code directly, or serve as final approval authority.',
  },
  {
    id: 'ai-3',
    category: 'AI & VALIDATION',
    question: 'Does ALSM automatically convert everything without review?',
    answer:
      'No. Human review remains the final decision authority. Every conversion undergoes rule-based validation, optional AI validation assistance, diagnostic reporting, and explicit developer review before export.',
  },
  {
    id: 'ai-4',
    category: 'AI & VALIDATION',
    question: 'Can users manually correct mappings and re-convert?',
    answer:
      'Yes. Users can manually adjust field mappings or paragraph mappings in the mapping studio and trigger versioned re-conversion through the Conversion Algorithm.',
  },

  // ─── PROJECTS ───
  {
    id: 'proj-1',
    category: 'PROJECTS',
    question: 'How do I create a modernization project?',
    answer:
      'Navigate to the Projects section, click Create Project, specify project details (name, target framework), and upload your raw BMS, DSPF, or COBOL source files.',
  },
  {
    id: 'proj-2',
    category: 'PROJECTS',
    question: 'Can I convert multiple screens?',
    answer:
      'Yes. ALSM supports Bulk Convert, allowing you to select multiple legacy screen maps and run batch conversion through the pipeline simultaneously.',
  },
  {
    id: 'proj-3',
    category: 'PROJECTS',
    question: 'Can I review field mappings?',
    answer:
      'Yes. The Field Mapping Studio displays all legacy field attributes (length, row/col, input/output types, color) side-by-side with target React component state bindings for fine-grained editing.',
  },
  {
    id: 'proj-4',
    category: 'PROJECTS',
    question: 'Can I preview generated React output?',
    answer:
      'Yes. The built-in Preview Studio renders generated React UI components live in your browser alongside the generated TypeScript code structure.',
  },
  {
    id: 'proj-5',
    category: 'PROJECTS',
    question: 'Can I export modernization results?',
    answer:
      'Yes. Once conversion is complete, you can download complete project ZIP archives containing formatted React components, CSS stylesheets, Java service classes, and configuration metadata.',
  },

  // ─── BILLING ───
  {
    id: 'bill-1',
    category: 'BILLING',
    question: 'How does the free trial work?',
    answer:
      'ALSM offers a 14-day free trial for Starter and Professional tiers with full access to conversion features. No credit card is required to begin.',
  },
  {
    id: 'bill-2',
    category: 'BILLING',
    question: 'How are screen and COBOL usage limits calculated?',
    answer:
      'Usage is tracked monthly based on the total number of unique BMS/DSPF screens and COBOL programs processed through the conversion engine.',
  },
  {
    id: 'bill-3',
    category: 'BILLING',
    question: 'How can I upgrade my subscription?',
    answer:
      'Go to Billing & Usage in your account settings or visit the Pricing page to upgrade your plan tier. Prorated adjustments are calculated automatically.',
  },
  {
    id: 'bill-4',
    category: 'BILLING',
    question: 'How can I manage my subscription?',
    answer:
      'You can view usage statistics, update billing info, download invoices, or pause/cancel your subscription at any time under Account Settings → Subscription.',
  },
];

const CATEGORIES: { id: string; name: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'ALL', name: 'All Questions', icon: HelpCircle },
  { id: 'GENERAL', name: 'General', icon: MessageSquare },
  { id: 'MODERNIZATION', name: 'Modernization', icon: Layers },
  { id: 'AI & VALIDATION', name: 'AI & Validation', icon: Sparkles },
  { id: 'PROJECTS', name: 'Projects', icon: FolderKanban },
  { id: 'BILLING', name: 'Billing', icon: CreditCard },
];

export const FaqPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [openIds, setOpenIds] = useState<Record<string, boolean>>({
    'gen-1': true, // Keep first open by default
  });

  const toggleItem = (id: string) => {
    setOpenIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const filteredFaqs =
    selectedCategory === 'ALL'
      ? FAQ_DATA
      : FAQ_DATA.filter((item) => item.category === selectedCategory);

  // Group by category if "ALL" is selected
  const categoriesToDisplay =
    selectedCategory === 'ALL'
      ? ['GENERAL', 'MODERNIZATION', 'AI & VALIDATION', 'PROJECTS', 'BILLING']
      : [selectedCategory];

  return (
    <div className="alsm-faq-page">
      {/* ─── Hero Section ─── */}
      <div className="alsm-faq-hero">
        <span className="alsm-faq-eyebrow">SUPPORT</span>
        <h1 className="alsm-faq-title">Frequently asked questions</h1>
        <p className="alsm-faq-subtitle">
          Everything you need to know about ALSM and legacy modernization.
        </p>
      </div>

      {/* ─── Category Filter Tabs ─── */}
      <div className="alsm-faq-categories">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              className={`alsm-faq-category-btn ${isActive ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat.id)}
            >
              <Icon className="w-4 h-4 inline-block mr-1.5" />
              {cat.name}
            </button>
          );
        })}
      </div>

      {/* ─── FAQ Items Container ─── */}
      <main className="alsm-faq-container">
        {categoriesToDisplay.map((categoryName) => {
          const categoryFaqs = filteredFaqs.filter((item) => item.category === categoryName);
          if (categoryFaqs.length === 0) return null;

          return (
            <div key={categoryName} className="mb-8">
              {selectedCategory === 'ALL' && (
                <div className="alsm-faq-section-header">
                  <span>{categoryName}</span>
                </div>
              )}

              <div className="alsm-faq-list">
                {categoryFaqs.map((faq) => {
                  const isOpen = !!openIds[faq.id];

                  return (
                    <div
                      key={faq.id}
                      className={`alsm-faq-card ${isOpen ? 'open' : ''}`}
                    >
                      <button
                        type="button"
                        className="alsm-faq-card-header"
                        onClick={() => toggleItem(faq.id)}
                        aria-expanded={isOpen}
                      >
                        <h3 className="alsm-faq-question">{faq.question}</h3>
                        <ChevronDown className="alsm-faq-chevron" />
                      </button>

                      <div className="alsm-faq-answer-wrapper">
                        <div className="alsm-faq-answer-inner">
                          <div className="alsm-faq-answer-content">{faq.answer}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* ─── Bottom CTA ─── */}
        <div className="alsm-faq-cta-banner">
          <h2 className="alsm-faq-cta-title">Still have questions?</h2>
          <p className="alsm-faq-cta-subtitle">
            Talk with the ALSM team about your modernization project.
          </p>
          <div className="alsm-faq-cta-actions">
            <a
              href="mailto:support@alsm.io"
              className="alsm-faq-btn-primary"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Contact Us</span>
            </a>
            <button
              type="button"
              onClick={() => navigate(ROUTES.BILLING.PRICING)}
              className="alsm-faq-btn-secondary"
            >
              <Calendar className="w-4 h-4" />
              <span>Book a Meeting</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default FaqPage;
