import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  BookOpen,
  Layers,
  Code2,
  Cpu,
  Sparkles,
  Workflow,
  ShieldCheck,
  Terminal,
  FileCode,
  Copy,
  Check,
  Search,
} from 'lucide-react';


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
];

const PIPELINE_STEPS = [
  { step: '01', name: 'Legacy Input', desc: 'Raw BMS, DSPF & COBOL source files' },
  { step: '02', name: 'Analyze', desc: 'AST parsing & screen analysis' },
  { step: '03', name: 'Map', desc: 'Field & paragraph mapping by algorithm' },
  { step: '04', name: 'Generate', desc: 'React 19 JSX & Java 21 code' },
  { step: '05', name: 'Validate', desc: 'Rule validation & optional AI assistance' },
  { step: '06', name: 'Export', desc: 'Production-ready project bundle' },
];

export const WorkspaceDocsPage: React.FC = () => {
  const location = useLocation();
  const [activeId, setActiveId] = useState<string>('introduction');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const scrollToSection = (id: string) => {
    setActiveId(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const hash = location.hash.replace('#', '');
    if (hash) {
      scrollToSection(hash);
    }
  }, [location.hash]);

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
    <div className="space-y-6 pb-8">
      {/* Workspace Banner */}
      <div className="bg-gradient-to-r from-[#091E42] via-[#0A2540] to-[#0652CC] text-white rounded-2xl p-6 sm:p-8 shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold text-cyan-300 border border-white/10">
            <BookOpen className="w-3.5 h-3.5" />
            <span>ALSM Workspace Documentation</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Technical Documentation & Developer Guide
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Complete technical reference for analyzing, converting, validating, and exporting IBM BMS, AS/400 DSPF screen maps, and COBOL applications into modern React UI and Java 21 microservices.
          </p>
        </div>
      </div>

      {/* Main Grid: Nav Sidebar + Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Secondary Nav Sidebar */}
        <aside className="lg:col-span-1 space-y-4">
          <div className="bg-white border border-[#D9E2EC] rounded-2xl p-4 space-y-4 sticky top-4 shadow-2xs">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search docs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[#F7F9FC] border border-[#D9E2EC] rounded-xl text-xs text-[#091E42] focus:bg-white focus:border-[#0652CC] outline-none"
              />
            </div>

            {SIDEBAR_NAV.map((sec) => (
              <div key={sec.title} className="space-y-1">
                <p className="text-[10px] font-extrabold text-[#6B778C] uppercase tracking-wider px-2 mb-1">
                  {sec.title}
                </p>
                <nav className="space-y-0.5">
                  {sec.items
                    .filter((item) => !searchQuery || item.label.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((item) => {
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
                          className={`flex items-center space-x-2.5 px-3 py-2 text-xs font-semibold rounded-xl transition-all ${
                            isActive
                              ? 'bg-[#E8F1FF] text-[#0652CC] border border-blue-200'
                              : 'text-[#42526E] hover:bg-[#F7F9FC] hover:text-[#091E42]'
                          }`}
                        >
                          {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
                          <span className="truncate">{item.label}</span>
                        </a>
                      );
                    })}
                </nav>
              </div>
            ))}
          </div>
        </aside>

        {/* Right Main Content */}
        <main className="lg:col-span-3 bg-white border border-[#D9E2EC] rounded-2xl p-6 sm:p-8 space-y-8 shadow-2xs">
          {/* Visual Pipeline Block */}
          <div className="bg-[#020817] border border-white/10 rounded-2xl p-6 text-white space-y-4 shadow-lg relative overflow-hidden">
            <div className="flex items-center space-x-2 text-xs font-extrabold text-cyan-400 uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>ALSM Modernization Pipeline</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
              {PIPELINE_STEPS.map((s) => (
                <div
                  key={s.step}
                  className="bg-white/5 border border-white/10 rounded-xl p-3 text-center space-y-1 hover:border-cyan-400/50 hover:bg-cyan-400/5 transition-all"
                >
                  <span className="text-[10px] font-black text-purple-400 bg-purple-500/20 px-2 py-0.5 rounded">
                    {s.step}
                  </span>
                  <h4 className="text-xs font-bold text-white pt-1">{s.name}</h4>
                  <p className="text-[10px] text-slate-400 leading-tight">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ─── Introduction Section ─── */}
          <section id="introduction" className="space-y-4 pt-2">
            <div className="flex items-center space-x-2.5 pb-2 border-b border-[#E5EAF0]">
              <BookOpen className="w-6 h-6 text-[#0652CC]" />
              <h2 className="text-xl font-bold text-[#091E42] tracking-tight">Introduction</h2>
            </div>
            <h3 className="text-sm font-bold text-[#091E42]">What is ALSM?</h3>
            <p className="text-xs text-[#42526E] leading-relaxed">
              ALSM (Automated Legacy Screen & Code Modernization) is an enterprise-grade platform designed to accelerate the digital transformation of core legacy systems. By parsing legacy IBM BMS screen maps, AS/400 DSPF display files, and COBOL programs, ALSM generates modern React UI interfaces and Java microservices without manual rewrite risk.
            </p>
            <p className="text-xs text-[#42526E] leading-relaxed">
              Unlike black-box automated tools, ALSM maintains complete developer transparency. Every step of the pipeline—from field identification to rule & AI validation—provides interactive preview studios, field mapping controls, and explicit diagnostic reports.
            </p>
          </section>

          {/* ─── Getting Started Section ─── */}
          <section id="getting-started" className="space-y-4">
            <div className="flex items-center space-x-2.5 pb-2 border-b border-[#E5EAF0]">
              <Workflow className="w-6 h-6 text-[#0652CC]" />
              <h2 className="text-xl font-bold text-[#091E42] tracking-tight">Getting Started</h2>
            </div>
            <p className="text-xs text-[#42526E] leading-relaxed">To begin modernizing your application:</p>
            <ul className="space-y-2 text-xs text-[#42526E] list-disc list-inside">
              <li>
                <strong className="text-[#091E42]">Create a Project:</strong> Navigate to the Projects dashboard and click New Project.
              </li>
              <li>
                <strong className="text-[#091E42]">Upload Source Files:</strong> Drag and drop your <code className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-800 font-mono text-[11px]">.bms</code>, <code className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-800 font-mono text-[11px]">.dspf</code>, or <code className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-800 font-mono text-[11px]">.cbl</code> files.
              </li>
              <li>
                <strong className="text-[#091E42]">Review Screen Maps:</strong> Inspect auto-detected fields, coordinates, attributes, and labels in the Screens list.
              </li>
              <li>
                <strong className="text-[#091E42]">Execute Conversion:</strong> Run the deterministic conversion algorithm to produce React 19 JSX and Java 21 REST services.
              </li>
              <li>
                <strong className="text-[#091E42]">Validate & Export:</strong> Inspect generated code in the Preview Studio and download the full production zip bundle.
              </li>
            </ul>
          </section>

          {/* ─── BMS / DSPF Modernization Section ─── */}
          <section id="bms-dspf" className="space-y-4">
            <div className="flex items-center space-x-2.5 pb-2 border-b border-[#E5EAF0]">
              <Layers className="w-6 h-6 text-[#0652CC]" />
              <h2 className="text-xl font-bold text-[#091E42] tracking-tight">BMS / DSPF Screen Modernization</h2>
            </div>
            <p className="text-xs text-[#42526E] leading-relaxed">
              IBM BMS (Basic Mapping Support) and AS/400 DSPF display files use row-column coordinates and attribute macros. ALSM parses these macros into an Abstract Syntax Tree (AST) before rendering responsive React UI layouts.
            </p>

            {/* BMS Code Box */}
            <div className="bg-[#020817] border border-white/10 rounded-xl overflow-hidden shadow-md">
              <div className="flex items-center justify-between px-4 py-2.5 bg-white/5 border-b border-white/10 text-xs font-semibold text-slate-300">
                <span className="font-mono text-cyan-400">ACCTMAP.bms</span>
                <button
                  onClick={() => handleCopy(bmsSnippet, 'bms')}
                  className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-slate-200 text-[11px] rounded font-semibold transition-colors flex items-center space-x-1"
                >
                  {copiedId === 'bms' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedId === 'bms' ? 'Copied' : 'Copy Code'}</span>
                </button>
              </div>
              <pre className="p-4 text-xs font-mono text-slate-200 overflow-x-auto leading-relaxed">
                {bmsSnippet}
              </pre>
            </div>
          </section>

          {/* ─── React Output Section ─── */}
          <section id="react-output" className="space-y-4">
            <div className="flex items-center space-x-2.5 pb-2 border-b border-[#E5EAF0]">
              <Code2 className="w-6 h-6 text-[#0652CC]" />
              <h2 className="text-xl font-bold text-[#091E42] tracking-tight">Generated React Output</h2>
            </div>
            <p className="text-xs text-[#42526E] leading-relaxed">
              The BMS/DSPF structure is transformed into clean, componentized React 19 JSX styled with Tailwind CSS or CSS variables.
            </p>

            {/* React Code Box */}
            <div className="bg-[#020817] border border-white/10 rounded-xl overflow-hidden shadow-md">
              <div className="flex items-center justify-between px-4 py-2.5 bg-white/5 border-b border-white/10 text-xs font-semibold text-slate-300">
                <span className="font-mono text-cyan-400">AccountManagementScreen.tsx</span>
                <button
                  onClick={() => handleCopy(reactSnippet, 'react')}
                  className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-slate-200 text-[11px] rounded font-semibold transition-colors flex items-center space-x-1"
                >
                  {copiedId === 'react' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedId === 'react' ? 'Copied' : 'Copy Code'}</span>
                </button>
              </div>
              <pre className="p-4 text-xs font-mono text-slate-200 overflow-x-auto leading-relaxed">
                {reactSnippet}
              </pre>
            </div>
          </section>

          {/* ─── COBOL Section ─── */}
          <section id="cobol" className="space-y-4">
            <div className="flex items-center space-x-2.5 pb-2 border-b border-[#E5EAF0]">
              <Terminal className="w-6 h-6 text-[#0652CC]" />
              <h2 className="text-xl font-bold text-[#091E42] tracking-tight">COBOL Business Logic Conversion</h2>
            </div>
            <p className="text-xs text-[#42526E] leading-relaxed">
              COBOL DATA DIVISION variables and PROCEDURE DIVISION paragraphs are parsed into structured Java 21 domain classes and Spring Boot services.
            </p>

            {/* COBOL Code Box */}
            <div className="bg-[#020817] border border-white/10 rounded-xl overflow-hidden shadow-md">
              <div className="flex items-center justify-between px-4 py-2.5 bg-white/5 border-b border-white/10 text-xs font-semibold text-slate-300">
                <span className="font-mono text-cyan-400">ACCTPROC.cbl</span>
                <button
                  onClick={() => handleCopy(cobolSnippet, 'cobol')}
                  className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-slate-200 text-[11px] rounded font-semibold transition-colors flex items-center space-x-1"
                >
                  {copiedId === 'cobol' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedId === 'cobol' ? 'Copied' : 'Copy Code'}</span>
                </button>
              </div>
              <pre className="p-4 text-xs font-mono text-slate-200 overflow-x-auto leading-relaxed">
                {cobolSnippet}
              </pre>
            </div>
          </section>

          {/* ─── Java Output Section ─── */}
          <section id="java-output" className="space-y-4">
            <div className="flex items-center space-x-2.5 pb-2 border-b border-[#E5EAF0]">
              <FileCode className="w-6 h-6 text-[#0652CC]" />
              <h2 className="text-xl font-bold text-[#091E42] tracking-tight">Generated Java Service Output</h2>
            </div>

            {/* Java Code Box */}
            <div className="bg-[#020817] border border-white/10 rounded-xl overflow-hidden shadow-md">
              <div className="flex items-center justify-between px-4 py-2.5 bg-white/5 border-b border-white/10 text-xs font-semibold text-slate-300">
                <span className="font-mono text-cyan-400">AccountProcessorService.java</span>
                <button
                  onClick={() => handleCopy(javaSnippet, 'java')}
                  className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-slate-200 text-[11px] rounded font-semibold transition-colors flex items-center space-x-1"
                >
                  {copiedId === 'java' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedId === 'java' ? 'Copied' : 'Copy Code'}</span>
                </button>
              </div>
              <pre className="p-4 text-xs font-mono text-slate-200 overflow-x-auto leading-relaxed">
                {javaSnippet}
              </pre>
            </div>
          </section>

          {/* ─── AI Validation & Rules Section ─── */}
          <section id="ai-validation" className="space-y-4">
            <div className="flex items-center space-x-2.5 pb-2 border-b border-[#E5EAF0]">
              <Sparkles className="w-6 h-6 text-[#0652CC]" />
              <h2 className="text-xl font-bold text-[#091E42] tracking-tight">AI Validation & Rule Engine</h2>
            </div>
            <p className="text-xs text-[#42526E] leading-relaxed">
              Every converted screen passes through automated rule validation and optional AI validation to ensure:
            </p>
            <ul className="space-y-1.5 text-xs text-[#42526E] list-disc list-inside">
              <li>Field length constraints matching original legacy definitions.</li>
              <li>Data types (PIC 9 vs PIC X) mapping accurately to TypeScript or Java types.</li>
              <li>Conditional business rules preserving branch coverage.</li>
              <li>Accessibility ARIA attributes attached to interactive UI elements.</li>
            </ul>
          </section>
        </main>
      </div>
    </div>
  );
};

export default WorkspaceDocsPage;
