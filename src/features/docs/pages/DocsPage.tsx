import React, { useState } from 'react';
import {
  BookOpen,
  Layers,
  Code2,
  Cpu,
  Sparkles,
  Workflow,
  ShieldCheck,
  ChevronDown,
  Terminal,
  FileCode,
} from 'lucide-react';
import './DocsPage.css';


interface SidebarSection {
  title: string;
  items: { id: string; label: string; icon?: React.ComponentType<{ className?: string }> }[];
}

const SIDEBAR_NAV: SidebarSection[] = [
  {
    title: 'START HERE',
    items: [
      { id: 'introduction', label: 'Introduction', icon: BookOpen },
      { id: 'getting-started', label: 'Getting Started', icon: Workflow },
      { id: 'how-it-works', label: 'How ALSM Works', icon: Cpu },
      { id: 'architecture', label: 'Architecture', icon: Layers },
    ],
  },
  {
    title: 'MODERNIZATION',
    items: [
      { id: 'bms-dspf', label: 'BMS / DSPF', icon: Layers },
      { id: 'cobol', label: 'COBOL', icon: Terminal },
      { id: 'react-output', label: 'React Output', icon: Code2 },
      { id: 'java-output', label: 'Java Output', icon: FileCode },
    ],
  },
  {
    title: 'VALIDATION',
    items: [
      { id: 'ai-validation', label: 'AI Validation', icon: Sparkles },
      { id: 'diagnostics', label: 'Diagnostics', icon: Cpu },
      { id: 'review', label: 'Review Workflow', icon: ShieldCheck },
    ],
  },
  {
    title: 'PROJECT WORKFLOW',
    items: [
      { id: 'projects', label: 'Projects', icon: BookOpen },
      { id: 'upload', label: 'Upload', icon: Workflow },
      { id: 'screens', label: 'Screens', icon: Layers },
      { id: 'conversion', label: 'Conversion Algorithm', icon: Cpu },
      { id: 'preview', label: 'Preview Studio', icon: Code2 },
      { id: 'export', label: 'Export', icon: FileCode },
    ],
  },
  {
    title: 'ACCOUNT & BILLING',
    items: [
      { id: 'usage', label: 'Usage', icon: Workflow },
      { id: 'billing', label: 'Billing', icon: BookOpen },
      { id: 'security', label: 'Security', icon: ShieldCheck },
    ],
  },
];

const PIPELINE_STEPS = [
  { step: '01', name: 'Legacy Input', desc: 'Raw BMS, DSPF & COBOL source files' },
  { step: '02', name: 'Analyze', desc: 'AST parsing & screen analysis' },
  { step: '03', name: 'Map', desc: 'Field & paragraph mapping by algorithm' },
  { step: '04', name: 'Generate', desc: 'React 19 JSX & Java 21 code' },
  { step: '05', name: 'Validate', desc: 'Rule validation & optional AI assistance' },
  { step: '06', name: 'Export', desc: 'Production-ready project bundle' },
];

export const DocsPage: React.FC = () => {
  const [activeId, setActiveId] = useState<string>('introduction');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const scrollToSection = (id: string) => {
    setActiveId(id);
    setMobileNavOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const bmsSnippet = `* BMS Screen Definition Sample (ACCTMAP.bms)
ACCTMAP  DFHMSD TYPE=&SYSPARM,MODE=INOUT,LANG=COBOL,    X
              CTRL=FREEKB,STORAGE=AUTO,TIOAPFX=YES
ACCTMAP  DFHMDI SIZE=(24,80),LINE=1,COLUMN=1
HDRTXT   DFHMDF POS=(1,30),ATTRB=(ASKIP,NORM),          X
              INITIAL='ACCOUNT MANAGEMENT SYSTEM'
ACCTNO   DFHMDF POS=(3,15),ATTRB=(UNPROT,NUM),LENGTH=10
BALANCE  DFHMDF POS=(5,15),ATTRB=(UNPROT,NUM),LENGTH=12`;

  const reactSnippet = `// Generated React Output (AccountManagementScreen.tsx)
import React, { useState } from 'react';

export const AccountManagementScreen: React.FC = () => {
  const [accountNumber, setAccountNumber] = useState('');
  const [balance, setBalance] = useState('');

  return (
    <div className="p-6 max-w-2xl bg-white rounded-xl border border-slate-200">
      <h1 className="text-xl font-bold text-slate-900 mb-6">ACCOUNT MANAGEMENT SYSTEM</h1>
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <label className="w-32 text-sm font-semibold text-slate-700">Account No:</label>
          <input
            type="text"
            maxLength={10}
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
            className="border border-slate-300 rounded-md px-3 py-1.5 text-sm"
          />
        </div>
      </div>
    </div>
  );
};`;

  const cobolSnippet = `* COBOL Business Logic Sample (ACCTPROC.cbl)
       IDENTIFICATION DIVISION.
       PROGRAM-ID. ACCTPROC.
       DATA DIVISION.
       WORKING-STORAGE SECTION.
       01 WS-ACCOUNT-ID PIC 9(10).
       01 WS-BALANCE    PIC 9(7)V99.
       PROCEDURE DIVISION.
           IF WS-BALANCE > 0 THEN
               DISPLAY "ACCOUNT ACTIVE"
           END-IF.`;

  const javaSnippet = `// Generated Java Spring Boot Service (AccountProcessorService.java)
package com.alsm.modernized.service;

import org.springframework.stereotype.Service;
import java.math.BigDecimal;

@Service
public class AccountProcessorService {

    public boolean processAccount(String accountId, BigDecimal balance) {
        if (balance != null && balance.compareTo(BigDecimal.ZERO) > 0) {
            System.out.println("ACCOUNT ACTIVE");
            return true;
        }
        return false;
    }
}`;

  return (
    <div className="alsm-docs-page">
      <div className="alsm-docs-layout">
        {/* ─── Left Sidebar Navigation ─── */}
        <aside className={`alsm-docs-sidebar ${mobileNavOpen ? 'mobile-open' : ''}`}>
          {SIDEBAR_NAV.map((sec) => (
            <div key={sec.title} className="alsm-docs-sidebar-section">
              <div className="alsm-docs-sidebar-title">{sec.title}</div>
              {sec.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeId === item.id;
                return (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      scrollToSection(item.id);
                    }}
                    className={`alsm-docs-sidebar-link ${isActive ? 'active' : ''}`}
                  >
                    {Icon && <Icon className="w-4 h-4 flex-shrink-0" />}
                    <span>{item.label}</span>
                  </a>
                );
              })}
            </div>
          ))}
        </aside>

        {/* ─── Main Content ─── */}
        <main className="alsm-docs-main">
          {/* Mobile Drawer Button */}
          <button
            type="button"
            className="alsm-docs-mobile-toggle"
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
          >
            <span>Documentation Menu</span>
            <ChevronDown
              className="w-4 h-4 transition-transform"
              style={{ transform: mobileNavOpen ? 'rotate(180deg)' : 'none' }}
            />
          </button>

          {/* Header */}
          <header className="alsm-docs-header">
            <span className="alsm-docs-eyebrow">DOCUMENTATION</span>
            <h1 className="alsm-docs-h1">ALSM Documentation</h1>
            <p className="alsm-docs-subtitle">
              Learn how ALSM analyzes, modernizes, validates, and exports legacy application components.
            </p>
          </header>

          {/* ─── Featured Visual Pipeline Flow ─── */}
          <div className="alsm-docs-visual-block">
            <div className="alsm-docs-visual-title">
              <Sparkles className="w-4 h-4" />
              <span>ALSM Modernization Pipeline</span>
            </div>
            <div className="alsm-docs-pipeline-flow">
              {PIPELINE_STEPS.map((s) => (
                <div key={s.step} className="alsm-docs-step-card">
                  <span className="alsm-docs-step-num">{s.step}</span>
                  <h4 className="alsm-docs-step-name">{s.name}</h4>
                  <p className="alsm-docs-step-desc">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ─── Section: Introduction ─── */}
          <section id="introduction" className="alsm-docs-section">
            <h2 className="alsm-docs-h2">
              <BookOpen className="w-6 h-6 text-[#0652CC]" />
              Introduction
            </h2>
            <h3 className="alsm-docs-h3">What is ALSM?</h3>
            <p className="alsm-docs-p">
              ALSM (Automated Legacy Screen & Code Modernization) is an enterprise-grade platform designed
              to accelerate the digital transformation of core legacy systems. By parsing legacy IBM BMS
              screen maps, AS/400 DSPF display files, and COBOL programs, ALSM generates modern React UI
              interfaces and Java microservices without manual rewrite risk.
            </p>
            <p className="alsm-docs-p">
              Unlike black-box automated tools, ALSM maintains complete developer transparency. Every step
              of the pipeline—from field identification to rule & AI validation—provides interactive preview
              studios, field mapping controls, and explicit diagnostic reports.
            </p>
          </section>

          {/* ─── Section: Getting Started ─── */}
          <section id="getting-started" className="alsm-docs-section">
            <h2 className="alsm-docs-h2">
              <Workflow className="w-6 h-6 text-[#0652CC]" />
              Getting Started
            </h2>
            <p className="alsm-docs-p">
              To begin modernizing your application:
            </p>
            <ul className="alsm-docs-ul">
              <li>
                <strong>Create a Project:</strong> Navigate to the Projects dashboard and click New Project.
              </li>
              <li>
                <strong>Upload Source Files:</strong> Upload raw `.bms`, `.dds`, or `.cbl` source files.
              </li>
              <li>
                <strong>Analyze & Map:</strong> Review parsed fields, attributes, and data structures.
              </li>
              <li>
                <strong>Generate & Preview:</strong> Trigger automatic React and Java code generation.
              </li>
              <li>
                <strong>Export Code:</strong> Download complete production ZIP packages containing clean TypeScript and Java code.
              </li>
            </ul>
          </section>

          {/* ─── Section: How ALSM Works ─── */}
          <section id="how-it-works" className="alsm-docs-section">
            <h2 className="alsm-docs-h2">
              <Cpu className="w-6 h-6 text-[#0652CC]" />
              How ALSM Works
            </h2>
            <p className="alsm-docs-p">
              ALSM breaks down legacy migration into a deterministic 7-stage engineering pipeline:
            </p>
            <ul className="alsm-docs-ul">
              <li><strong>1. Upload:</strong> Ingest legacy screen macros and COBOL source logic.</li>
              <li><strong>2. Analysis:</strong> AST parsing isolates labels, input fields, display attributes, and control loops.</li>
              <li><strong>3. Mapping:</strong> Structural mapping correlates 24x80 screen positions with modern CSS grid layouts.</li>
              <li><strong>4. Generation:</strong> Produces formatted React 19 components with Tailwind CSS and Java Spring Boot services.</li>
              <li><strong>5. Validation:</strong> Rule validation & optional AI assistance check field binding integrity and syntax correctness.</li>
              <li><strong>6. Review:</strong> Developers inspect live UI renders side-by-side with generated source code.</li>
              <li><strong>7. Export:</strong> Clean, un-obfuscated TypeScript/Java ZIP archive ready for CI/CD integration.</li>
            </ul>
          </section>

          {/* ─── Section: BMS / DSPF Modernization ─── */}
          <section id="bms-dspf" className="alsm-docs-section">
            <h2 className="alsm-docs-h2">
              <Layers className="w-6 h-6 text-[#0652CC]" />
              BMS / DSPF Modernization
            </h2>
            <p className="alsm-docs-p">
              Mainframe BMS maps specify 24-row by 80-column terminal layouts. ALSM converts raw DFHMDF macro definitions into responsive React components automatically.
            </p>

            <h3 className="alsm-docs-h3">Raw BMS Definition Input</h3>
            <div className="alsm-docs-code-block">
              <div className="alsm-docs-code-header">
                <span className="alsm-docs-code-lang">BMS Macro</span>
                <button
                  type="button"
                  className="alsm-docs-copy-btn"
                  onClick={() => handleCopy(bmsSnippet, 'bms')}
                >
                  {copiedId === 'bms' ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <pre className="alsm-docs-code-content">{bmsSnippet}</pre>
            </div>

            <h3 className="alsm-docs-h3">Generated React Component Output</h3>
            <div className="alsm-docs-code-block">
              <div className="alsm-docs-code-header">
                <span className="alsm-docs-code-lang">React 19 / TypeScript</span>
                <button
                  type="button"
                  className="alsm-docs-copy-btn"
                  onClick={() => handleCopy(reactSnippet, 'react')}
                >
                  {copiedId === 'react' ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <pre className="alsm-docs-code-content">{reactSnippet}</pre>
            </div>
          </section>

          {/* ─── Section: COBOL Modernization ─── */}
          <section id="cobol" className="alsm-docs-section">
            <h2 className="alsm-docs-h2">
              <Terminal className="w-6 h-6 text-[#0652CC]" />
              COBOL Modernization
            </h2>
            <p className="alsm-docs-p">
              COBOL business logic resides in DATA DIVISION and PROCEDURE DIVISION statements. ALSM analyzes conditional branches, WORKING-STORAGE variables, and computational logic, refactoring them into Spring Boot Java classes.
            </p>

            <h3 className="alsm-docs-h3">COBOL Program Input</h3>
            <div className="alsm-docs-code-block">
              <div className="alsm-docs-code-header">
                <span className="alsm-docs-code-lang">COBOL Source</span>
                <button
                  type="button"
                  className="alsm-docs-copy-btn"
                  onClick={() => handleCopy(cobolSnippet, 'cobol')}
                >
                  {copiedId === 'cobol' ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <pre className="alsm-docs-code-content">{cobolSnippet}</pre>
            </div>

            <h3 className="alsm-docs-h3">Generated Java Service Output</h3>
            <div className="alsm-docs-code-block">
              <div className="alsm-docs-code-header">
                <span className="alsm-docs-code-lang">Java 21 / Spring Boot</span>
                <button
                  type="button"
                  className="alsm-docs-copy-btn"
                  onClick={() => handleCopy(javaSnippet, 'java')}
                >
                  {copiedId === 'java' ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <pre className="alsm-docs-code-content">{javaSnippet}</pre>
            </div>
          </section>

          {/* ─── Section: AI-Assisted Validation ─── */}
          <section id="ai-validation" className="alsm-docs-section">
            <h2 className="alsm-docs-h2">
              <Sparkles className="w-6 h-6 text-[#0652CC]" />
              AI-Assisted Validation
            </h2>
            <p className="alsm-docs-p">
              The optional AI Validator assists the Rule Validator by acting as a review assistant rather than modifying converted code.
              It scans generated React/Java code against legacy specs to highlight candidate findings:
            </p>
            <ul className="alsm-docs-ul">
              <li>Field length constraints matching original legacy definitions.</li>
              <li>Data types (PIC 9 vs PIC X) mapping accurately to TypeScript or Java types.</li>
              <li>Conditional business rules preserving branch coverage.</li>
              <li>Accessibility ARIA attributes attached to interactive UI elements.</li>
            </ul>
          </section>
        </main>

        {/* ─── Right On-This-Page TOC ─── */}
        <aside className="alsm-docs-toc">
          <div className="alsm-docs-toc-title">ON THIS PAGE</div>
          <a href="#introduction" className="alsm-docs-toc-link">
            Introduction
          </a>
          <a href="#getting-started" className="alsm-docs-toc-link">
            Getting Started
          </a>
          <a href="#how-it-works" className="alsm-docs-toc-link">
            How ALSM Works
          </a>
          <a href="#bms-dspf" className="alsm-docs-toc-link">
            BMS / DSPF Modernization
          </a>
          <a href="#cobol" className="alsm-docs-toc-link">
            COBOL Modernization
          </a>
          <a href="#ai-validation" className="alsm-docs-toc-link">
            AI-Assisted Validation
          </a>
        </aside>
      </div>
    </div>
  );
};

export default DocsPage;
