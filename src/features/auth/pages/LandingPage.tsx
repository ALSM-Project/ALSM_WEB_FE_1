import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Cpu,
  Zap,
  CheckCircle2,
  Terminal,
  Code2,
  Layers,
  Database,
  ShieldCheck,
  Activity,
  ChevronRight,
  FileCode,
  RefreshCw,
  GitBranch,
  Lock,
  Play,
  Sliders,
  Sparkles,
  Server,
  Eye,
  Check,
} from 'lucide-react';
import { ROUTES } from '@/shared/constants/routes';
import './LandingPage.css';

export const LandingPage: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [activePipelineStage, setActivePipelineStage] = useState(0);
  const [activeLegacyNode, setActiveLegacyNode] = useState<'bms' | 'dspf' | 'cobol' | 'ibmi' | 'as400'>('bms');
  const [activeWorkflowTab, setActiveWorkflowTab] = useState(0);
  const [hoveredWingParticle, setHoveredWingParticle] = useState<number | null>(null);

  // Track window scroll for floating navbar effect
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 40) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto-cycle transformation pipeline signal
  useEffect(() => {
    const interval = setInterval(() => {
      setActivePipelineStage(prev => (prev + 1) % 6);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Pipeline Data
  const pipelineStages = [
    {
      id: 'legacy',
      step: '01',
      title: 'LEGACY',
      subtitle: 'BMS / DSPF / COBOL',
      description: 'Import mainframe maps, BMS screen definitions, and COBOL source files directly from AS400.',
      icon: Terminal,
      color: '#ef4444',
    },
    {
      id: 'parse',
      step: '02',
      title: 'PARSE',
      subtitle: 'Structure Analysis',
      description: 'Abstract Syntax Tree (AST) parser extracts field coordinates, validation rules, and program entry points.',
      icon: Layers,
      color: '#f59e0b',
    },
    {
      id: 'map',
      step: '03',
      title: 'MAP',
      subtitle: 'Field & Business Logic',
      description: 'Intelligent schema mapper maps green-screen fields to React form state and Java DTO models.',
      icon: GitBranch,
      color: '#3b82f6',
    },
    {
      id: 'generate',
      step: '04',
      title: 'GENERATE',
      subtitle: 'React & Java Engine',
      description: 'Generates modern TypeScript React components and Spring Boot REST microservice architectures.',
      icon: Code2,
      color: '#0655FF',
    },
    {
      id: 'validate',
      step: '05',
      title: 'VALIDATE',
      subtitle: 'AI Parity Verification',
      description: 'Automated test runner verifies 100% visual parity and functional alignment with legacy behavior.',
      icon: ShieldCheck,
      color: '#10b981',
    },
    {
      id: 'export',
      step: '06',
      title: 'EXPORT',
      subtitle: 'Production Bundle',
      description: 'Clean, enterprise-grade, human-readable React & Java codebase ready for CI/CD deployment.',
      icon: Zap,
      color: '#8b5cf6',
    },
  ];

  // Legacy Nodes Details
  const nodeDetails = {
    bms: {
      name: 'IBM BMS (Basic Mapping Support)',
      type: 'CICS Screen Definition',
      details: '4,200+ Fields Extracted • DFHMDF Maps Parsed • Automatic Position Grid Conversion',
      code: 'MAP01 DFHMSD TYPE=&TYPE,MODE=INOUT,LANG=COBOL\nDFHMDF POS=(03,15),ATTRB=(UNPROT,NUM),LENGTH=10,INITIAL="CUSTOMER-ID"',
    },
    dspf: {
      name: 'DSPF (Display File Description)',
      type: 'AS400 Green-Screen File',
      details: 'Subfile Grid Detection • Function Keys (F3/F12) Mapped to Keyboard Shortcuts • Color Attributes Preserved',
      code: 'A          R CUSTREC                  SFL\nA            CUSTID        10A  O  4 15TEXT("Customer Account ID")\nA            CUSTNAME      30A  O  4 30',
    },
    cobol: {
      name: 'COBOL Mainframe Logic',
      type: 'Procedural Business Logic',
      details: 'WORKING-STORAGE Mapped to DTOs • PROCEDURE DIVISION Parsed to Service Methods • SQL/DB2 Converted to JPA',
      code: 'PROCEDURE DIVISION.\n000-MAIN-LOGIC.\n    PERFORM 100-VERIFY-ACCOUNT.\n    PERFORM 200-CALCULATE-BALANCE.',
    },
    ibmi: {
      name: 'IBM i (OS/400 Core)',
      type: 'Enterprise Server OS',
      details: 'Library List Resolution • Data Queues to Kafka/RabbitMQ • Program Call (QCMDEXC) Bridge Integration',
      code: 'CALL PGM(FINANCE/CALCINT) PARM(&ACCTNO &BAL &INTAMT)',
    },
    as400: {
      name: 'AS400 Mainframe Database',
      type: 'DB2 for i Relational Store',
      details: 'Physical Files (PF) Converted to PostgreSQL Schemas • Logical Files (LF) Converted to SQL Database Views',
      code: 'CRTPF FILE(FINLIB/CUSTMAST) RCDLEN(256)\nCRTLF FILE(FINLIB/CUSTL01) UNIQUE',
    },
  };

  return (
    <div className="legacyx-landing relative selection:bg-[#0652CC] selection:text-white">
      {/* Background Radial Glow Orbs */}
      <div className="lx-orb-glow w-[600px] h-[600px] bg-[#0652CC]/20 top-[-100px] left-[20%]" />
      <div className="lx-orb-glow w-[500px] h-[500px] bg-[#0655FF]/15 top-[600px] right-[-50px]" />
      <div className="lx-orb-glow w-[700px] h-[700px] bg-[#091E42]/80 top-[1800px] left-[-100px]" />

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 lx-grid-background pointer-events-none opacity-40" />

      {/* ================================================== */}
      {/* NAVIGATION                                         */}
      {/* ================================================== */}
      <header className={`fixed top-0 left-0 right-0 z-50 lx-navbar ${isScrolled ? 'scrolled' : 'bg-transparent py-5'}`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0652CC] to-[#0655FF] flex items-center justify-center text-white shadow-lg shadow-[#0652CC]/30 group-hover:scale-105 transition-transform">
              <Cpu className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black tracking-wider text-white font-mono flex items-center gap-1">
                LEGACY<span className="text-[#0655FF]">X</span>
              </span>
              <span className="text-[9px] font-semibold tracking-widest text-[#A7B4C8] uppercase -mt-1">
                Modernization Platform
              </span>
            </div>
          </Link>

          {/* Nav Items */}
          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-[#A7B4C8]">
            <a href="#platform" className="hover:text-white transition-colors relative py-1 group">
              <span>Platform</span>
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#0655FF] group-hover:w-full transition-all duration-300" />
            </a>
            <a href="#how-it-works" className="hover:text-white transition-colors relative py-1 group">
              <span>How It Works</span>
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#0655FF] group-hover:w-full transition-all duration-300" />
            </a>
            <a href="#solutions" className="hover:text-white transition-colors relative py-1 group">
              <span>Solutions</span>
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#0655FF] group-hover:w-full transition-all duration-300" />
            </a>
            <a href="#validation" className="hover:text-white transition-colors relative py-1 group">
              <span>AI Parity</span>
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#0655FF] group-hover:w-full transition-all duration-300" />
            </a>
            <Link to={ROUTES.BILLING.PRICING} className="hover:text-white transition-colors relative py-1 group">
              <span>Pricing</span>
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#0655FF] group-hover:w-full transition-all duration-300" />
            </Link>
          </nav>

          {/* Right CTAs */}
          <div className="flex items-center space-x-4">
            <Link
              to={ROUTES.PUBLIC.LOGIN}
              className="text-sm font-semibold text-[#A7B4C8] hover:text-white transition-colors px-3 py-2"
            >
              Sign In
            </Link>
            <Link
              to={ROUTES.PUBLIC.REGISTER}
              className="lx-btn-primary !py-2.5 !px-5 text-sm !rounded-lg"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* ================================================== */}
      {/* HERO SECTION                                       */}
      {/* ================================================== */}
      <section className="relative pt-36 pb-28 px-6 overflow-hidden">
        <div className="max-w-6xl mx-auto text-center space-y-8 relative z-10">
          {/* Eyebrow */}
          <div className="inline-flex items-center space-x-2 bg-[#091E42]/80 border border-white/10 px-4 py-1.5 rounded-full text-xs font-semibold text-[#A7B4C8] shadow-inner">
            <span className="w-2 h-2 rounded-full bg-[#0655FF] animate-pulse" />
            <span className="uppercase tracking-widest text-[11px] text-[#38BDF8]">
              LEGACY MODERNIZATION PLATFORM
            </span>
          </div>

          {/* Main Headline */}
          <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight leading-[1.1] max-w-4xl mx-auto">
            <span className="lx-blue-gradient-text">Modernize</span> what powers your business.
          </h1>

          {/* Supporting Subheadline */}
          <p className="text-lg md:text-2xl text-[#A7B4C8] max-w-3xl mx-auto font-light leading-relaxed">
            Transform <span className="text-white font-medium">legacy</span> IBM i / AS400 applications into modern{' '}
            <span className="text-[#38BDF8] font-medium">React</span> and{' '}
            <span className="text-[#0655FF] font-medium">Java</span> systems without losing business logic.
          </p>

          {/* Hero Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-5 pt-4">
            <Link to={ROUTES.PUBLIC.REGISTER} className="lx-btn-primary text-base">
              <span>Start Converting</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a href="#platform" className="lx-btn-secondary text-base">
              <Play className="w-4 h-4 text-[#0655FF]" />
              <span>Explore Platform</span>
            </a>
          </div>

          {/* ================================================== */}
          {/* HERO ABSTRACT DIGITAL WING VISUALIZATION           */}
          {/* ================================================== */}
          <div className="pt-14 relative max-w-5xl mx-auto">
            <div className="relative w-full h-[420px] lx-glass-card rounded-2xl p-6 border border-white/10 overflow-hidden flex flex-col items-center justify-center shadow-2xl">
              {/* Grid backdrop */}
              <div className="absolute inset-0 lx-grid-background opacity-20" />

              {/* Ambient Center Engine Glow */}
              <div className="absolute w-72 h-72 rounded-full bg-[#0652CC]/30 blur-3xl animate-breathe" />

              {/* Abstract SVG Digital Wing / Transformation Mesh */}
              <svg className="w-full h-full absolute inset-0 pointer-events-none" viewBox="0 0 1000 400" fill="none">
                {/* Left Legacy Wing Lines */}
                <path d="M 150 200 Q 300 80, 500 200" stroke="url(#wingGradientLeft)" strokeWidth="2" strokeDasharray="6 6" className="opacity-60" />
                <path d="M 100 200 Q 300 20, 500 200" stroke="url(#wingGradientLeft)" strokeWidth="1.5" className="opacity-40" />
                <path d="M 200 200 Q 350 140, 500 200" stroke="url(#wingGradientLeft)" strokeWidth="1" className="opacity-80" />

                {/* Right Modern Wing Lines */}
                <path d="M 500 200 Q 700 80, 850 200" stroke="url(#wingGradientRight)" strokeWidth="2" strokeDasharray="6 6" className="opacity-60" />
                <path d="M 500 200 Q 700 20, 900 200" stroke="url(#wingGradientRight)" strokeWidth="1.5" className="opacity-40" />
                <path d="M 500 200 Q 650 140, 800 200" stroke="url(#wingGradientRight)" strokeWidth="1" className="opacity-80" />

                {/* Vertical Data Connection Spine */}
                <line x1="500" y1="50" x2="500" y2="350" stroke="#0655FF" strokeWidth="2" opacity="0.6" />

                {/* Gradients */}
                <defs>
                  <linearGradient id="wingGradientLeft" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#0655FF" stopOpacity="1" />
                  </linearGradient>
                  <linearGradient id="wingGradientRight" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#0655FF" stopOpacity="1" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.8" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Transformation Stage Nodes */}
              <div className="relative z-10 w-full flex items-center justify-between px-6 md:px-16">
                {/* LEGACY Input Card */}
                <div className="bg-[#030914]/90 border border-red-500/30 rounded-xl p-4 w-48 text-left shadow-lg backdrop-blur-md">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono font-bold text-red-400 uppercase tracking-widest">
                      [ LEGACY SOURCE ]
                    </span>
                    <Terminal className="w-4 h-4 text-red-400" />
                  </div>
                  <div className="text-white font-mono text-xs font-bold">AS400 / IBM i</div>
                  <div className="text-[11px] text-[#A7B4C8] font-mono mt-1">BMS • DSPF • COBOL</div>
                </div>

                {/* PARSE */}
                <div className="hidden sm:flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-[#091E42] border border-[#0655FF]/40 flex items-center justify-center text-white text-xs font-mono font-bold shadow-md shadow-[#0652CC]/40 animate-pulse">
                    AST
                  </div>
                  <span className="text-[10px] font-mono text-[#A7B4C8] mt-1 uppercase">Parse</span>
                </div>

                {/* MAP ENGINE (Center) */}
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#0652CC] to-[#0655FF] flex flex-col items-center justify-center text-white shadow-2xl shadow-[#0652CC]/60 border border-white/20">
                  <Cpu className="w-8 h-8 text-white animate-spin" style={{ animationDuration: '12s' }} />
                  <span className="text-[10px] font-mono font-bold mt-1">ENGINE</span>
                </div>

                {/* GENERATE */}
                <div className="hidden sm:flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-[#091E42] border border-[#10b981]/40 flex items-center justify-center text-white text-xs font-mono font-bold shadow-md shadow-[#10b981]/40 animate-pulse">
                    AI
                  </div>
                  <span className="text-[10px] font-mono text-[#A7B4C8] mt-1 uppercase">Validate</span>
                </div>

                {/* MODERN Output Card */}
                <div className="bg-[#030914]/90 border border-emerald-500/30 rounded-xl p-4 w-48 text-left shadow-lg backdrop-blur-md">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-widest">
                      [ TARGET STACK ]
                    </span>
                    <Code2 className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-white font-mono text-xs font-bold">Cloud Microservices</div>
                  <div className="text-[11px] text-[#A7B4C8] font-mono mt-1">React TS • Java 17</div>
                </div>
              </div>

              {/* Floating Live Data Code Badges */}
              <div className="absolute bottom-4 left-8 text-[11px] font-mono text-red-400/80 bg-red-950/40 border border-red-500/20 px-3 py-1 rounded-md">
                INPUT: DFHMDF POS=(03,15) ATTRB=(UNPROT)
              </div>
              <div className="absolute bottom-4 right-8 text-[11px] font-mono text-emerald-400/80 bg-emerald-950/40 border border-emerald-500/20 px-3 py-1 rounded-md">
                OUTPUT: &lt;Input name="customerId" required /&gt;
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================== */}
      {/* SECTION 01 — THE LEGACY PROBLEM (Split Editorial) */}
      {/* ================================================== */}
      <section className="py-24 px-6 border-t border-white/5 bg-[#030914]" id="platform">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Editorial Content */}
          <div className="lg:col-span-5 space-y-6">
            <div className="text-xs font-mono font-bold uppercase tracking-widest text-[#0655FF]">
              01 // THE LEGACY CHALLENGE
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-white leading-tight">
              Your legacy systems shouldn't limit what's next.
            </h2>
            <p className="text-[#A7B4C8] text-base leading-relaxed">
              IBM i, AS400, and COBOL applications power mission-critical operations for thousands of enterprise organizations. However, manual rewrite projects cost millions and take years with high failure rates.
            </p>
            <p className="text-[#A7B4C8] text-base leading-relaxed">
              <strong className="text-white font-semibold">LegacyX</strong> provides automated, deterministic refactoring that extracts screen maps, field attributes, and business rules without disrupting existing infrastructure.
            </p>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
              <div>
                <div className="text-3xl font-extrabold text-white font-mono">10x</div>
                <div className="text-xs text-[#A7B4C8] mt-1">Faster than manual rewrite</div>
              </div>
              <div>
                <div className="text-3xl font-extrabold text-[#38BDF8] font-mono">99.8%</div>
                <div className="text-xs text-[#A7B4C8] mt-1">Business Logic Parity</div>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Legacy System Inspector Node Visual */}
          <div className="lg:col-span-7">
            <div className="lx-glass-card rounded-2xl p-6 border border-white/10 space-y-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <span className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-[#0655FF]" />
                  Legacy System Component Inspector
                </span>
                <span className="text-[11px] font-mono text-[#38BDF8] bg-[#091E42] px-2.5 py-1 rounded border border-[#0655FF]/30">
                  Select a node to inspect
                </span>
              </div>

              {/* Node Selector Tabs */}
              <div className="flex flex-wrap gap-2">
                {(['bms', 'dspf', 'cobol', 'ibmi', 'as400'] as const).map(nodeKey => (
                  <button
                    key={nodeKey}
                    onClick={() => setActiveLegacyNode(nodeKey)}
                    className={`px-4 py-2 rounded-lg text-xs font-mono font-bold uppercase transition-all ${
                      activeLegacyNode === nodeKey
                        ? 'bg-[#0652CC] text-white shadow-md shadow-[#0652CC]/50 border border-[#0655FF]'
                        : 'bg-[#091E42] text-[#A7B4C8] hover:text-white border border-white/5'
                    }`}
                  >
                    {nodeKey}
                  </button>
                ))}
              </div>

              {/* Selected Node Details Box */}
              <div className="bg-[#030914] border border-white/10 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-white font-bold text-base font-mono">{nodeDetails[activeLegacyNode].name}</h4>
                    <span className="text-xs text-[#0655FF] font-mono">{nodeDetails[activeLegacyNode].type}</span>
                  </div>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                </div>

                <p className="text-xs text-[#A7B4C8] font-mono leading-relaxed bg-[#091E42]/50 p-3 rounded-lg border border-white/5">
                  {nodeDetails[activeLegacyNode].details}
                </p>

                <div className="space-y-1">
                  <span className="text-[10px] font-mono uppercase text-[#A7B4C8]">Raw Code Snippet:</span>
                  <pre className="text-xs font-mono text-emerald-400 bg-slate-950 p-3 rounded-lg overflow-x-auto border border-emerald-500/20 leading-relaxed">
                    {nodeDetails[activeLegacyNode].code}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================== */}
      {/* SECTION 02 — TRANSFORMATION ENGINE (Pipeline)     */}
      {/* ================================================== */}
      <section className="py-24 px-6 border-t border-white/5 bg-[#091E42]/40 relative" id="how-it-works">
        <div className="max-w-7xl mx-auto space-y-12">
          {/* Section Header */}
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <div className="text-xs font-mono font-bold uppercase tracking-widest text-[#0655FF]">
              02 // TRANSFORMATION ENGINE
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-white">
              From legacy complexity to modern architecture.
            </h2>
            <p className="text-[#A7B4C8] text-base">
              A 6-stage scrollable transformation pipeline that converts mainframe legacy code into clean, scalable microservices.
            </p>
          </div>

          {/* Interactive Pipeline Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative">
            {pipelineStages.map((stage, idx) => {
              const IconComp = stage.icon;
              const isActive = activePipelineStage === idx;
              return (
                <div
                  key={stage.id}
                  onClick={() => setActivePipelineStage(idx)}
                  className={`lx-glass-card rounded-2xl p-6 border transition-all cursor-pointer relative overflow-hidden group ${
                    isActive
                      ? 'border-[#0655FF] bg-[#091E42] shadow-xl shadow-[#0652CC]/30 scale-[1.02]'
                      : 'border-white/10 hover:border-white/20 opacity-80'
                  }`}
                >
                  {/* Stage Top Header */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-mono font-bold text-[#A7B4C8] bg-white/5 px-2.5 py-1 rounded">
                      STAGE {stage.step}
                    </span>
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
                      style={{ backgroundColor: stage.color + '25', border: `1px solid ${stage.color}50` }}
                    >
                      <IconComp className="w-5 h-5" style={{ color: stage.color }} />
                    </div>
                  </div>

                  <h3 className="text-xl font-extrabold text-white font-mono mb-1">{stage.title}</h3>
                  <div className="text-xs font-medium text-[#38BDF8] mb-3">{stage.subtitle}</div>
                  <p className="text-xs text-[#A7B4C8] leading-relaxed">{stage.description}</p>

                  {/* Active Indicator Bar */}
                  {isActive && (
                    <div
                      className="absolute bottom-0 left-0 right-0 h-1"
                      style={{ backgroundColor: stage.color }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================================================== */}
      {/* SECTION 03 — BMS / DSPF TO REACT                   */}
      {/* ================================================== */}
      <section className="py-24 px-6 border-t border-white/5 bg-[#030914]" id="solutions">
        <div className="max-w-7xl mx-auto space-y-12">
          {/* Header */}
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <div className="text-xs font-mono font-bold uppercase tracking-widest text-[#0655FF]">
              03 // UI CONVERSION PIPELINE
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-white">
              BMS / DSPF Green-Screen to Modern React.
            </h2>
            <p className="text-[#A7B4C8] text-base">
              Legacy character-based terminal screens automatically map into responsive, accessible React Tailwind web forms.
            </p>
          </div>

          {/* Transformation Split Screen */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Left: Terminal Green-Screen Representation */}
            <div className="bg-slate-950 border border-green-500/30 rounded-2xl p-6 font-mono text-xs shadow-2xl space-y-4 relative">
              <div className="flex items-center justify-between border-b border-green-900/50 pb-3">
                <span className="text-emerald-400 font-bold flex items-center gap-2">
                  <Terminal className="w-4 h-4" />
                  IBM AS400 DSPF / BMS Terminal Screen
                </span>
                <span className="bg-emerald-950 text-emerald-400 text-[10px] px-2 py-0.5 rounded border border-emerald-500/30">
                  Mode: 24x80 Grid
                </span>
              </div>

              <div className="bg-black p-4 rounded-lg border border-green-950 text-emerald-400 font-mono space-y-2 leading-relaxed">
                <div>+-------------------------------------------------------------+</div>
                <div>|  ALSM FINANCIAL SYSTEM - CUSTOMER ACCOUNT MAINTENANCE       |</div>
                <div>+-------------------------------------------------------------+</div>
                <div className="pt-2">  CUSTOMER-ID : [ <span className="bg-emerald-900/60 px-1 text-white">84920194  </span> ]  STATUS: ACTIVE</div>
                <div>  ACCOUNT-NO  : [ <span className="bg-emerald-900/60 px-1 text-white">ACCT-99201</span> ]  CURR  : USD</div>
                <div>  BALANCE     : [ <span className="bg-emerald-900/60 px-1 text-white">$148,250.00</span> ]</div>
                <div className="pt-3 text-emerald-600">  F3=EXIT  F12=CANCEL  F24=SUBMIT</div>
              </div>

              <div className="text-[11px] text-green-500/70 italic">
                * Extracted 4 input coordinates and field validation macros from BMS file.
              </div>
            </div>

            {/* Right: Modern React Component Output */}
            <div className="lx-glass-card rounded-2xl p-6 border border-[#0655FF]/40 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span className="text-white font-bold text-xs font-mono flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-[#0655FF]" />
                  Generated React UI Component
                </span>
                <span className="bg-[#0652CC]/20 text-[#38BDF8] text-[10px] px-2 py-0.5 rounded border border-[#0655FF]/30 font-mono">
                  Target: React 18 + Tailwind
                </span>
              </div>

              {/* Form Component Preview */}
              <div className="bg-[#091E42] p-5 rounded-xl border border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-white font-bold text-sm font-sans">Customer Account Maintenance</h4>
                  <span className="bg-emerald-500/10 text-emerald-400 text-xs px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                    Active
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] text-[#A7B4C8] uppercase font-mono block mb-1">Customer ID</label>
                    <input
                      type="text"
                      readOnly
                      value="84920194"
                      className="w-full bg-[#030914] border border-white/15 rounded-lg px-3 py-2 text-white font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-[#A7B4C8] uppercase font-mono block mb-1">Account No</label>
                    <input
                      type="text"
                      readOnly
                      value="ACCT-99201"
                      className="w-full bg-[#030914] border border-white/15 rounded-lg px-3 py-2 text-white font-mono text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-[#A7B4C8] uppercase font-mono block mb-1">Current Balance</label>
                  <div className="text-xl font-bold text-[#38BDF8] font-mono bg-[#030914] px-4 py-2 rounded-lg border border-white/15">
                    $148,250.00 USD
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button className="px-4 py-2 rounded-lg text-xs font-semibold text-[#A7B4C8] bg-white/5 hover:bg-white/10">
                    Cancel (F12)
                  </button>
                  <button className="lx-btn-primary !py-2 !px-4 text-xs">
                    Submit (F24)
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================== */}
      {/* SECTION 04 — COBOL TO JAVA                          */}
      {/* ================================================== */}
      <section className="py-24 px-6 border-t border-white/5 bg-[#091E42]/30">
        <div className="max-w-7xl mx-auto space-y-12">
          {/* Header */}
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <div className="text-xs font-mono font-bold uppercase tracking-widest text-[#0655FF]">
              04 // BACKEND REFACTORING
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-white">
              COBOL Mainframe Logic to Clean Java 17.
            </h2>
            <p className="text-[#A7B4C8] text-base">
              Procedural COBOL paragraphs automatically refactor into Spring Boot REST services with JPA repositories.
            </p>
          </div>

          {/* Code Side-by-Side Comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* COBOL Code */}
            <div className="bg-[#030914] border border-red-500/30 rounded-2xl p-6 font-mono text-xs space-y-3">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span className="text-red-400 font-bold flex items-center gap-2">
                  <FileCode className="w-4 h-4" />
                  Legacy COBOL Source Code
                </span>
                <span className="text-[10px] text-red-400 bg-red-950 px-2 py-0.5 rounded border border-red-500/20">
                  Procedural Logic
                </span>
              </div>
              <pre className="text-slate-300 overflow-x-auto leading-relaxed p-2">
{`IDENTIFICATION DIVISION.
PROGRAM-ID. ACCT-CALC.
DATA DIVISION.
WORKING-STORAGE SECTION.
01 WS-ACCOUNT-NO   PIC X(10).
01 WS-BALANCE      PIC 9(7)V99.
01 WS-[#0655FF]-AMT   PIC 9(5)V99.

PROCEDURE DIVISION.
100-CALC-INTEREST.
    IF WS-BALANCE > 50000.00
        COMPUTE WS-[#0655FF]-AMT = WS-BALANCE * 0.0425
    ELSE
        COMPUTE WS-[#0655FF]-AMT = WS-BALANCE * 0.0210
    END-IF.
    EXIT.`}
              </pre>
            </div>

            {/* Java Code */}
            <div className="bg-[#030914] border border-emerald-500/30 rounded-2xl p-6 font-mono text-xs space-y-3">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span className="text-emerald-400 font-bold flex items-center gap-2">
                  <Code2 className="w-4 h-4" />
                  Modernized Java Spring Boot Service
                </span>
                <span className="text-[10px] text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/20">
                  Target: Java 17 + Spring Boot
                </span>
              </div>
              <pre className="text-slate-200 overflow-x-auto leading-relaxed p-2">
{`@Service
@Transactional
public class AccountInterestService {

    public BigDecimal calculateInterest(String accountNo, BigDecimal balance) {
        BigDecimal rate = balance.compareTo(new BigDecimal("50000.00")) > 0
            ? new BigDecimal("0.0425")
            : new BigDecimal("0.0210");

        return balance.multiply(rate).setScale(2, RoundingMode.HALF_UP);
    }
}`}
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================== */}
      {/* SECTION 05 — AI VALIDATION (Circular Hub)          */}
      {/* ================================================== */}
      <section className="py-24 px-6 border-t border-white/5 bg-[#030914]" id="validation">
        <div className="max-w-7xl mx-auto space-y-12">
          {/* Header */}
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <div className="text-xs font-mono font-bold uppercase tracking-widest text-[#0655FF]">
              05 // AI VALIDATION & CONTROL
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-white">
              Automation with human control.
            </h2>
            <p className="text-[#A7B4C8] text-base">
              AI-assisted validation continuously inspects code syntax, business rule consistency, and field parity without blindly overwriting domain rules.
            </p>
          </div>

          {/* Circular Hub + Checklist */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Radial Hub Diagram */}
            <div className="lg:col-span-6 flex justify-center">
              <div className="relative w-80 h-80 rounded-full border border-[#0655FF]/30 flex items-center justify-center lx-glass-card shadow-2xl">
                {/* Outer Rotating Radial Ring */}
                <div className="absolute inset-2 rounded-full border border-dashed border-[#0655FF]/40 animate-spin" style={{ animationDuration: '24s' }} />

                {/* Center Engine Core */}
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#0652CC] to-[#0655FF] flex flex-col items-center justify-center text-white font-mono shadow-2xl shadow-[#0652CC]/60 z-10 border border-white/20">
                  <ShieldCheck className="w-8 h-8 text-white" />
                  <span className="text-[11px] font-bold mt-1">AI PARITY</span>
                </div>

                {/* Surrounding Radial Nodes */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-[#091E42] border border-white/20 text-[#38BDF8] text-[10px] font-mono font-bold px-3 py-1 rounded-full">
                  Field Mapping
                </div>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-[#091E42] border border-white/20 text-[#38BDF8] text-[10px] font-mono font-bold px-3 py-1 rounded-full">
                  Human Review
                </div>
                <div className="absolute left-2 top-1/2 -translate-y-1/2 bg-[#091E42] border border-white/20 text-[#38BDF8] text-[10px] font-mono font-bold px-3 py-1 rounded-full">
                  Business Rules
                </div>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#091E42] border border-white/20 text-[#38BDF8] text-[10px] font-mono font-bold px-3 py-1 rounded-full">
                  Code Parity
                </div>
              </div>
            </div>

            {/* Validation Checklist Card */}
            <div className="lg:col-span-6 space-y-4">
              <div className="lx-glass-card rounded-2xl p-6 border border-white/10 space-y-4">
                <h3 className="text-white font-bold text-lg font-mono flex items-center gap-2">
                  <Activity className="w-5 h-5 text-emerald-400" />
                  Continuous AI Parity Checks
                </h3>

                <div className="space-y-3">
                  <div className="flex items-center space-x-3 bg-[#030914] p-3 rounded-lg border border-white/5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                    <div className="text-xs">
                      <div className="text-white font-bold">Field Mapping Validated</div>
                      <div className="text-[#A7B4C8]">4,200/4,200 BMS coordinates mapped with 0 collisions.</div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 bg-[#030914] p-3 rounded-lg border border-white/5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                    <div className="text-xs">
                      <div className="text-white font-bold">Business Rule Consistency</div>
                      <div className="text-[#A7B4C8]">COBOL calculation logic matched against Java unit test suite.</div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 bg-[#030914] p-3 rounded-lg border border-white/5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                    <div className="text-xs">
                      <div className="text-white font-bold">Generated Code Quality Analysis</div>
                      <div className="text-[#A7B4C8]">Clean Architecture & ESLint / SonarQube compliant output.</div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 bg-[#030914] p-3 rounded-lg border border-white/5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                    <div className="text-xs">
                      <div className="text-white font-bold">Human Review Gatekeeping</div>
                      <div className="text-[#A7B4C8]">Architect approval required before production export.</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================== */}
      {/* SECTION 07 — WHY LEGACYX                           */}
      {/* ================================================== */}
      <section className="py-24 px-6 border-t border-white/5 bg-[#091E42]/20">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <div className="text-xs font-mono font-bold uppercase tracking-widest text-[#0655FF]">
              07 // WHY LEGACYX
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-white">
              Built for enterprise modernization at scale.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="lx-glass-card rounded-2xl p-6 border border-white/10 space-y-4 hover:border-[#0655FF]/50 transition-all">
              <div className="w-12 h-12 rounded-xl bg-[#0652CC]/20 border border-[#0655FF]/40 flex items-center justify-center text-[#38BDF8]">
                <Zap className="w-6 h-6" />
              </div>
              <div className="text-xs font-mono text-[#0655FF] font-bold">01</div>
              <h3 className="text-lg font-bold text-white">Automated Conversion</h3>
              <p className="text-xs text-[#A7B4C8] leading-relaxed">
                Deterministic AST parsing converts legacy BMS, DSPF, and COBOL to modern React and Java in minutes.
              </p>
            </div>

            <div className="lx-glass-card rounded-2xl p-6 border border-white/10 space-y-4 hover:border-[#0655FF]/50 transition-all">
              <div className="w-12 h-12 rounded-xl bg-[#0652CC]/20 border border-[#0655FF]/40 flex items-center justify-center text-[#38BDF8]">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="text-xs font-mono text-[#0655FF] font-bold">02</div>
              <h3 className="text-lg font-bold text-white">AI-Assisted Validation</h3>
              <p className="text-xs text-[#A7B4C8] leading-relaxed">
                Automated parity checking ensures 99.8% visual and functional equivalence with green-screens.
              </p>
            </div>

            <div className="lx-glass-card rounded-2xl p-6 border border-white/10 space-y-4 hover:border-[#0655FF]/50 transition-all">
              <div className="w-12 h-12 rounded-xl bg-[#0652CC]/20 border border-[#0655FF]/40 flex items-center justify-center text-[#38BDF8]">
                <Eye className="w-6 h-6" />
              </div>
              <div className="text-xs font-mono text-[#0655FF] font-bold">03</div>
              <h3 className="text-lg font-bold text-white">Human Review</h3>
              <p className="text-xs text-[#A7B4C8] leading-relaxed">
                Enterprise architects retain 100% oversight with field mapping customization and code preview studio.
              </p>
            </div>

            <div className="lx-glass-card rounded-2xl p-6 border border-white/10 space-y-4 hover:border-[#0655FF]/50 transition-all">
              <div className="w-12 h-12 rounded-xl bg-[#0652CC]/20 border border-[#0655FF]/40 flex items-center justify-center text-[#38BDF8]">
                <GitBranch className="w-6 h-6" />
              </div>
              <div className="text-xs font-mono text-[#0655FF] font-bold">04</div>
              <h3 className="text-lg font-bold text-white">Versioned Re-conversion</h3>
              <p className="text-xs text-[#A7B4C8] leading-relaxed">
                Re-run conversion pipelines seamlessly when legacy schemas update without breaking customized code.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================== */}
      {/* SECTION 08 — PRODUCT SHOWCASE (3D Browser Tilt)    */}
      {/* ================================================== */}
      <section className="py-24 px-6 border-t border-white/5 bg-[#030914]">
        <div className="max-w-7xl mx-auto space-y-12 text-center">
          <div className="space-y-4 max-w-3xl mx-auto">
            <div className="text-xs font-mono font-bold uppercase tracking-widest text-[#0655FF]">
              08 // PRODUCT SHOWCASE
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-white">
              The LegacyX Modernization Studio.
            </h2>
          </div>

          <div className="lx-browser-perspective max-w-5xl mx-auto">
            <div className="lx-browser-frame bg-[#091E42] border border-white/15 rounded-2xl overflow-hidden shadow-2xl">
              {/* Browser Header Bar */}
              <div className="bg-[#030914] px-4 py-3 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <div className="bg-[#091E42] text-[#A7B4C8] text-xs font-mono px-4 py-1 rounded-md border border-white/10">
                  https://app.legacyx.io/projects/proj-84920/screens
                </div>
                <div className="text-xs text-[#0655FF] font-mono font-bold">LEGACYX STUDIO v2.4</div>
              </div>

              {/* Dashboard Content Mockup */}
              <div className="p-6 text-left space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-bold text-lg font-mono">Modernization Project: Banking Mainframe</h3>
                    <p className="text-xs text-[#A7B4C8]">Target: React TS + Java 17 Microservices</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="bg-emerald-500/20 text-emerald-400 text-xs px-3 py-1 rounded-full font-mono">
                      128 Screens Converted
                    </span>
                    <button className="lx-btn-primary !py-1.5 !px-3 text-xs">Export Code</button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-[#030914] p-4 rounded-xl border border-white/10">
                    <div className="text-xs text-[#A7B4C8] font-mono">BMS Screens Parsed</div>
                    <div className="text-2xl font-bold text-white font-mono mt-1">1,420</div>
                  </div>
                  <div className="bg-[#030914] p-4 rounded-xl border border-white/10">
                    <div className="text-xs text-[#A7B4C8] font-mono">COBOL Lines Converted</div>
                    <div className="text-2xl font-bold text-[#38BDF8] font-mono mt-1">284,500</div>
                  </div>
                  <div className="bg-[#030914] p-4 rounded-xl border border-white/10">
                    <div className="text-xs text-[#A7B4C8] font-mono">AI Parity Score</div>
                    <div className="text-2xl font-bold text-emerald-400 font-mono mt-1">99.8%</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================== */}
      {/* SECTION 09 — ENTERPRISE TRUST                      */}
      {/* ================================================== */}
      <section className="py-20 px-6 border-t border-white/5 bg-[#091E42]/30">
        <div className="max-w-6xl mx-auto text-center space-y-8">
          <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-[#A7B4C8]">
            BUILT FOR SYSTEMS THAT BUSINESSES DEPEND ON
          </h3>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16 opacity-80">
            <span className="flex items-center space-x-2 text-sm font-mono text-white font-semibold">
              <ShieldCheck className="w-5 h-5 text-[#0655FF]" />
              <span>Enterprise Ready</span>
            </span>
            <span className="flex items-center space-x-2 text-sm font-mono text-white font-semibold">
              <Lock className="w-5 h-5 text-[#38BDF8]" />
              <span>Secure Workflow</span>
            </span>
            <span className="flex items-center space-x-2 text-sm font-mono text-white font-semibold">
              <GitBranch className="w-5 h-5 text-emerald-400" />
              <span>Versioned Conversion</span>
            </span>
            <span className="flex items-center space-x-2 text-sm font-mono text-white font-semibold">
              <Eye className="w-5 h-5 text-yellow-400" />
              <span>Human Review</span>
            </span>
            <span className="flex items-center space-x-2 text-sm font-mono text-white font-semibold">
              <CheckCircle2 className="w-5 h-5 text-[#0655FF]" />
              <span>Audit Friendly</span>
            </span>
          </div>
        </div>
      </section>

      {/* ================================================== */}
      {/* SECTION 10 — FINAL CTA                             */}
      {/* ================================================== */}
      <section className="py-28 px-6 border-t border-white/5 bg-gradient-to-b from-[#030914] to-[#091E42] text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto space-y-8 relative z-10">
          <h2 className="text-4xl md:text-6xl font-black text-white leading-tight">
            Ready to modernize what powers your business?
          </h2>
          <p className="text-lg text-[#A7B4C8] max-w-2xl mx-auto font-light leading-relaxed">
            Transform legacy applications into modern, maintainable systems without losing control of the business logic that matters.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-5 pt-4">
            <Link to={ROUTES.PUBLIC.REGISTER} className="lx-btn-primary text-base">
              <span>Start Converting</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link to={ROUTES.PUBLIC.LOGIN} className="lx-btn-secondary text-base">
              <span>Talk to Our Team</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ================================================== */}
      {/* FOOTER                                             */}
      {/* ================================================== */}
      <footer className="border-t border-white/10 bg-[#030914] pt-16 pb-12 px-6 text-sm text-[#A7B4C8]">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-10 mb-16">
          <div className="col-span-2 space-y-4">
            <Link to="/" className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0652CC] to-[#0655FF] flex items-center justify-center text-white">
                <Cpu className="w-4 h-4" />
              </div>
              <span className="text-xl font-black text-white font-mono tracking-wider">
                LEGACY<span className="text-[#0655FF]">X</span>
              </span>
            </Link>
            <p className="text-xs text-[#A7B4C8] max-w-sm leading-relaxed">
              LegacyX — Enterprise Legacy Modernization Platform. Transforming IBM i, AS400, BMS, DSPF, and COBOL applications into cloud-native React and Java microservices.
            </p>
          </div>

          <div>
            <h4 className="font-mono text-xs font-bold text-white uppercase tracking-wider mb-4">PRODUCT</h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#solutions" className="hover:text-white transition-colors">BMS → React</a></li>
              <li><a href="#solutions" className="hover:text-white transition-colors">COBOL → Java</a></li>
              <li><a href="#validation" className="hover:text-white transition-colors">AI Validation</a></li>
              <li><a href="#how-it-works" className="hover:text-white transition-colors">Review Studio</a></li>
              <li><a href="#how-it-works" className="hover:text-white transition-colors">Versioning</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-mono text-xs font-bold text-white uppercase tracking-wider mb-4">RESOURCES</h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
              <li><a href="#" className="hover:text-white transition-colors">API Reference</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Templates</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-mono text-xs font-bold text-white uppercase tracking-wider mb-4">SUPPORT</h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#" className="hover:text-white transition-colors">Support Center</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between text-xs text-[#A7B4C8]">
          <div>© 2026 LegacyX Platform. All rights reserved.</div>
          <div className="flex items-center space-x-6 mt-4 md:mt-0">
            <a href="#" className="hover:text-white">Privacy Policy</a>
            <a href="#" className="hover:text-white">Terms of Service</a>
            <a href="#" className="hover:text-white">Security Specs</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
