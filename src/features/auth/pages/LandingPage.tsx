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
  ShieldCheck,
  FileCode,
  GitBranch,
  Play,
  Check,
  ChevronDown,
  Star,
} from 'lucide-react';
import { ROUTES } from '@/shared/constants/routes';
import { billingService } from '@/features/billing/services/billing.service';
import type { SubscriptionPlan } from '@/features/billing/types/billing';
import './LandingPage.css';

interface ReviewItem {
  name: string;
  role: string;
  comment: string;
  avatarBg: string;
  avatarText: string;
}

const REVIEWS: ReviewItem[] = [
  {
    name: 'Alex Vance',
    role: 'Enterprise Architect @ FinCore',
    comment: 'ALSM saved us 600+ hours of manual BMS screen parsing. 100% deterministic React 19 outputs with clean state.',
    avatarBg: 'bg-[#0652CC]',
    avatarText: 'text-white',
  },
  {
    name: 'Sarah Chen',
    role: 'Lead Developer @ Logistics Global',
    comment: 'The COBOL to Java microservice conversion extracted our copybook rules with zero logic regressions.',
    avatarBg: 'bg-[#E8F1FF] border border-[#0652CC]/30',
    avatarText: 'text-[#0652CC]',
  },
  {
    name: 'Marcus Thorne',
    role: 'VP of Modernization @ CoreBank',
    comment: 'Cleanest AST tree parsing and field mapping workflow available. The Rule Validator and AI-assisted validation runner is top tier.',
    avatarBg: 'bg-[#0652CC]',
    avatarText: 'text-white',
  },
  {
    name: 'Elena Rostova',
    role: 'Fullstack Principal @ CloudNative',
    comment: 'Transformed 120+ AS400 DSPF green-screens into responsive Tailwind v4 React forms in less than 3 weeks.',
    avatarBg: 'bg-[#0655FF]',
    avatarText: 'text-white',
  },
  {
    name: 'Liam Sterling',
    role: 'Legacy Migration Architect',
    comment: 'Deterministic AST conversion rules guarantee clean React & Java output with zero logic regressions.',
    avatarBg: 'bg-[#E8F1FF] border border-[#0652CC]/30',
    avatarText: 'text-[#0652CC]',
  },
];

interface FaqItem {
  question: string;
  answer: string;
}

const FAQS: FaqItem[] = [
  {
    question: 'How does ALSM extract BMS & DSPF green-screen definitions?',
    answer: 'The Conversion Algorithm parses IBM i / AS400 DFHMDF BMS mapfields and DSPF display files into standardized Abstract Syntax Trees (AST). Field coordinates, length, data types, and function key bindings (F3/F12) automatically map into React form components.',
  },
  {
    question: 'How does COBOL to Java microservice refactoring preserve business rules?',
    answer: 'Our deterministic Conversion Algorithm maps WORKING-STORAGE sections to DTOs and PROCEDURE DIVISION paragraphs into Spring Boot service methods. Rule validation and automated test suites ensure 100% logic parity.',
  },
  {
    question: 'Can we inspect field mappings before exporting production code?',
    answer: 'Yes! The ALSM Field Mapping & Result Inspection Studio provides full side-by-side AST inspection, field mapping overrides, code diffing, and interactive preview before downloading production bundles.',
  },
  {
    question: 'Does ALSM use AI to perform code conversion?',
    answer: 'No. Core BMS/DSPF and COBOL conversions are performed deterministically by the Conversion Algorithm. AI is used strictly as an optional validation assistant to highlight candidate findings for human review.',
  },
  {
    question: 'What target frameworks and tech stack are supported?',
    answer: 'Frontend: React 19, TypeScript, Tailwind CSS v4, Lucide icons. Backend: Spring Boot 3, Java 21/17, REST API, JPA Repositories, and PostgreSQL/DB2 integration.',
  },
];

export const LandingPage: React.FC = () => {
  const [activePipelineStage, setActivePipelineStage] = useState(0);
  const [activeLegacyNode, setActiveLegacyNode] = useState<'bms' | 'dspf' | 'cobol' | 'ibmi' | 'as400'>('bms');
  const [activeMatrixTab, setActiveMatrixTab] = useState('react');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [annualBilling, setAnnualBilling] = useState(false);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);

  // Fetch subscription plans dynamically from backend API / MongoDB
  useEffect(() => {
    let isMounted = true;
    setLoadingPlans(true);
    billingService
      .getSubscriptionPlans()
      .then((data) => {
        if (isMounted && data && Array.isArray(data)) {
          setPlans(data);
        }
      })
      .catch((err) => {
        console.warn('Failed to load plans on LandingPage:', err);
        if (isMounted) setPlans([]);
      })
      .finally(() => {
        if (isMounted) setLoadingPlans(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Auto-cycle pipeline stage
  useEffect(() => {
    const interval = setInterval(() => {
      setActivePipelineStage(prev => (prev + 1) % 6);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  const pipelineStages = [
    {
      step: '01',
      title: 'LEGACY INGEST',
      subtitle: 'BMS / DSPF / COBOL',
      description: 'Ingest mainframe map definitions, AS400 green-screen files, and COBOL copybooks directly.',
      icon: Terminal,
      color: '#ef4444',
    },
    {
      step: '02',
      title: 'AST PARSING',
      subtitle: 'Abstract Syntax Tree',
      description: 'Extract field grid coordinates, data length, validation rules, and program entry points.',
      icon: Layers,
      color: '#f59e0b',
    },
    {
      step: '03',
      title: 'SCHEMA MAPPING',
      subtitle: 'Field & Logic Mapping',
      description: 'Map terminal inputs to React state fields and DB2 procedural calls to Java DTOs.',
      icon: GitBranch,
      color: '#0652CC',
    },
    {
      step: '04',
      title: 'CODE GENERATION',
      subtitle: 'React 19 & Spring Boot',
      description: 'Generate clean, modular TypeScript React components and Spring Boot REST microservices via Conversion Algorithm.',
      icon: Code2,
      color: '#0655FF',
    },
    {
      step: '05',
      title: 'RULE & AI VALIDATION',
      subtitle: 'Quality Verification',
      description: 'Rule Validator checks deterministic code contracts while optional AI Validator assists with risk findings.',
      icon: ShieldCheck,
      color: '#10b981',
    },
    {
      step: '06',
      title: 'ENTERPRISE EXPORT',
      subtitle: 'Production Ready',
      description: 'Export structured React & Java repositories ready for CI/CD pipeline integration.',
      icon: Zap,
      color: '#8b5cf6',
    },
  ];

  const nodeDetails = {
    bms: {
      name: 'IBM BMS (Basic Mapping Support)',
      type: 'CICS Mainframe Screen Definition',
      details: '4,200+ Mapfields Extracted • DFHMDF Attributes Parsed • Automatic Grid Layout Positioning',
      code: 'MAP01 DFHMSD TYPE=&TYPE,MODE=INOUT,LANG=COBOL\nDFHMDF POS=(03,15),ATTRB=(UNPROT,NUM),LENGTH=10,INITIAL="CUSTOMER-ID"',
    },
    dspf: {
      name: 'DSPF (Display File Description)',
      type: 'AS400 Green-Screen File',
      details: 'Subfile Grid Detection • Function Keys (F3/F12) Mapped to Shortcuts • Color Attributes Preserved',
      code: 'A          R CUSTREC                  SFL\nA            CUSTID        10A  O  4 15TEXT("Customer Account ID")\nA            CUSTNAME      30A  O  4 30',
    },
    cobol: {
      name: 'COBOL Mainframe Logic',
      type: 'Procedural Business Rules',
      details: 'WORKING-STORAGE Mapped to Java DTOs • PROCEDURE DIVISION Parsed to Services • DB2 SQL to JPA',
      code: 'PROCEDURE DIVISION.\n000-MAIN-LOGIC.\n    PERFORM 100-VERIFY-ACCOUNT.\n    PERFORM 200-CALCULATE-BALANCE.',
    },
    ibmi: {
      name: 'IBM i (OS/400 Core System)',
      type: 'Enterprise Server OS',
      details: 'Library List Resolution • Data Queues to Kafka/RabbitMQ • Program Call Bridge Integration',
      code: 'CALL PGM(FINANCE/CALCINT) PARM(&ACCTNO &BAL &INTAMT)',
    },
    as400: {
      name: 'AS400 DB2 Data Store',
      type: 'DB2 for i Relational Store',
      details: 'Physical Files (PF) Converted to PostgreSQL Schemas • Logical Files (LF) Converted to Views',
      code: 'CRTPF FILE(FINLIB/CUSTMAST) RCDLEN(256)\nCRTLF FILE(FINLIB/CUSTL01) UNIQUE',
    },
  };

  const matrixCategories = [
    {
      id: 'react',
      name: 'BMS → React 19',
      title: 'BMS Screen & Mainframe Transformation to React 19',
      description: 'Convert 3270 / BMS mainframe screens into responsive React 19 + Tailwind v4 components with dark navy surface tokens.',
      items: [
        'Automated BMS mapfield parsing & grid positioning',
        'Tailwind v4 native design tokens & dark/light surfaces',
        'Strict TypeScript interfaces & state hooks',
        'Micro-animations & keyboard shortcut bindings (F3/F12)',
      ],
      codeSnippet: `// BmsMapToReact.tsx - ALSM Auto Transformer
export function MainframeCustomerScreen({ screenData }: ScreenProps) {
  const [customerId, setCustomerId] = useState(screenData.initialId);

  return (
    <div className="p-6 rounded-2xl bg-[#091E42] border border-[#0652CC]/40 text-[#F4F5F7]">
      <span className="text-xs font-semibold px-2.5 py-1 bg-[#0652CC] text-white rounded-full">
        SYS_MAP: {screenData.mapId}
      </span>
      <h3 className="text-xl font-bold mt-4 text-[#F4F5F7]">{screenData.title}</h3>
    </div>
  );
}`,
    },
    {
      id: 'cobol',
      name: 'COBOL → Java',
      title: 'COBOL Business Rules to Modern Microservices',
      description: 'Extract business logic from COBOL copybooks directly into Spring Boot microservices with 100% test coverage.',
      items: [
        'Copybook data structure parser to DTOs',
        'Spring Boot 3 + Java 21 REST controllers',
        'Automated JUnit test suite generation',
        'Zero-downtime database migration strategy',
      ],
      codeSnippet: `// CobolToJavaService.java - ALSM Engine
@Service
@Transactional
public class AccountBalanceService {
    public TransactionResult processLegacyTransaction(CobolPayload payload) {
        // AI-validated COBOL logic conversion (0 regressions)
        return transactionEngine.execute(payload.toEntity());
    }
}`,
    },
    {
      id: 'ast',
      name: 'AST Schema & Mapping',
      title: 'Abstract Syntax Tree & Deterministic Schema Mapping',
      description: 'Full AST inspection allows visual mapping of legacy fields to modern database fields with schema validation.',
      items: [
        'Interactive field-by-field schema connector',
        'Automated data type coercion (COMP-3 to BigDecimal)',
        'Validation rule syntax checking',
        'Exportable AST JSON representation',
      ],
      codeSnippet: `// ALSM AST Representation Token
{
  "nodeType": "BMS_MAP_DEFINITION",
  "mapName": "CUSTMAST",
  "fields": [
    { "name": "CUST_ID", "type": "NUMERIC", "pos": [3, 15], "length": 10 }
  ]
}`,
    },
  ];

  const currentMatrix = matrixCategories.find(c => c.id === activeMatrixTab) || matrixCategories[0];
  const doubleReviews = [...REVIEWS, ...REVIEWS];

  return (
    <div className="w-full bg-[#F7F9FC] text-[#091E42] font-sans selection:bg-[#0652CC] selection:text-white relative overflow-x-hidden">

      {/* ================================================== */}
      {/* 01. HERO SECTION                                   */}
      {/* ================================================== */}
      <section
        id="hero"
        className="w-full min-h-[calc(100vh-80px)] mx-auto flex flex-col justify-center items-center relative overflow-hidden pt-16 pb-20 bg-[#F7F9FC] text-[#091E42]"
      >
        {/* Soft Blue Ambient Glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[750px] h-[400px] bg-[#0652CC]/8 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-1/3 right-1/4 w-[350px] h-[250px] bg-[#22D3EE]/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="w-full max-w-7xl mx-auto px-4 flex flex-col items-center z-10 text-center">
          {/* Eyebrow Tag */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#E8F1FF] border border-[#0652CC]/20 text-[#0652CC] text-xs font-bold uppercase tracking-wider mb-6 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-[#0655FF] animate-pulse" />
            <span>LEGACY MODERNIZATION PLATFORM</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-[#091E42] leading-[1.08] max-w-4xl">
            <span>CONVERT IBM i LEGACY </span>
            <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-[#0652CC] to-[#0655FF] bg-clip-text text-transparent">
              SYSTEMS TO MODERN WEB APPS
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-[#42526E] font-medium max-w-3xl text-base sm:text-lg text-center mt-6 px-4 leading-relaxed">
            Automate BMS/DSPF-to-React and COBOL-to-Java modernization using structured conversion algorithms, rule-based validation, and optional AI-assisted validation.
          </p>

          {/* Hero 3D Interactive Card Deck */}
          <div className="relative w-full max-w-[1100px] h-[320px] sm:h-[400px] my-10 flex justify-center items-center overflow-visible">
            {/* Card 1: AS400 / IBM i */}
            <div
              className="fan-card absolute w-[170px] sm:w-[230px] h-[220px] sm:h-[300px] rounded-[24px] p-5 border-[1.5px] border-[#D9E2EC] z-10 bg-white flex flex-col justify-between text-left"
              style={{
                ['--tx' as any]: '-340px',
                ['--ty' as any]: '35px',
                transform: 'translate(-160px, 25px) rotate(-12deg)',
              }}
            >
              <div>
                <span className="text-[10px] font-mono font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded border border-red-200 uppercase">AS400 / IBM i</span>
                <h4 className="text-sm font-bold text-[#091E42] mt-3">Mainframe System</h4>
                <p className="text-xs text-[#42526E] mt-1 font-mono">DB2PhysicalFile.PF</p>
              </div>
              <div className="text-[11px] font-mono text-gray-500 bg-gray-50 p-2 rounded border border-gray-200">
                CRTPF FILE(FIN/CUST)
              </div>
            </div>

            {/* Card 2: BMS Screen */}
            <div
              className="fan-card absolute w-[170px] sm:w-[230px] h-[220px] sm:h-[300px] rounded-[24px] p-5 border-[1.5px] border-[#0652CC]/30 z-20 bg-white flex flex-col justify-between text-left"
              style={{
                ['--tx' as any]: '-170px',
                ['--ty' as any]: '15px',
                transform: 'translate(-80px, 10px) rotate(-6deg)',
              }}
            >
              <div>
                <span className="text-[10px] font-mono font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 uppercase">BMS Mapfield</span>
                <h4 className="text-sm font-bold text-[#091E42] mt-3">3270 Terminal Screen</h4>
                <p className="text-xs text-[#42526E] mt-1 font-mono">CICS_MAP01.bms</p>
              </div>
              <div className="text-[11px] font-mono text-amber-700 bg-amber-50/50 p-2 rounded border border-amber-200">
                DFHMDF POS=(03,15)
              </div>
            </div>

            {/* Card 3: Center ALSM AST Engine */}
            <div
              className="fan-card absolute w-[180px] sm:w-[240px] h-[230px] sm:h-[310px] rounded-[24px] p-6 border-[2px] border-[#0652CC] z-30 bg-[#091E42] text-white flex flex-col justify-between text-left shadow-2xl"
              style={{
                ['--tx' as any]: '0px',
                ['--ty' as any]: '0px',
                transform: 'translate(0px, 0px) rotate(0deg)',
              }}
            >
              <div>
                <span className="text-[10px] font-mono font-bold text-[#22D3EE] bg-[#0652CC]/30 px-2 py-0.5 rounded border border-[#22D3EE]/30 uppercase">ALSM AST Engine</span>
                <h4 className="text-base font-bold text-white mt-3">Conversion Algorithm</h4>
                <p className="text-xs text-[#22D3EE] mt-1 font-mono">AST Deterministic Pipeline</p>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-950/60 p-2 rounded border border-emerald-500/30">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>Deterministic Rules</span>
              </div>
            </div>

            {/* Card 4: React Output */}
            <div
              className="fan-card absolute w-[170px] sm:w-[230px] h-[220px] sm:h-[300px] rounded-[24px] p-5 border-[1.5px] border-[#0652CC]/30 z-20 bg-white flex flex-col justify-between text-left"
              style={{
                ['--tx' as any]: '170px',
                ['--ty' as any]: '15px',
                transform: 'translate(80px, 10px) rotate(6deg)',
              }}
            >
              <div>
                <span className="text-[10px] font-mono font-bold text-[#0652CC] bg-[#E8F1FF] px-2 py-0.5 rounded border border-[#0652CC]/20 uppercase">React 19 Output</span>
                <h4 className="text-sm font-bold text-[#091E42] mt-3">Modern Web Component</h4>
                <p className="text-xs text-[#42526E] mt-1 font-mono">CustomerScreen.tsx</p>
              </div>
              <div className="text-[11px] font-mono text-[#0652CC] bg-[#E8F1FF] p-2 rounded border border-[#0652CC]/20">
                &lt;Input name="custID" /&gt;
              </div>
            </div>

            {/* Card 5: Java Service */}
            <div
              className="fan-card absolute w-[170px] sm:w-[230px] h-[220px] sm:h-[300px] rounded-[24px] p-5 border-[1.5px] border-[#D9E2EC] z-10 bg-white flex flex-col justify-between text-left"
              style={{
                ['--tx' as any]: '340px',
                ['--ty' as any]: '35px',
                transform: 'translate(160px, 25px) rotate(12deg)',
              }}
            >
              <div>
                <span className="text-[10px] font-mono font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded border border-violet-200 uppercase">Spring Boot Java</span>
                <h4 className="text-sm font-bold text-[#091E42] mt-3">Microservice API</h4>
                <p className="text-xs text-[#42526E] mt-1 font-mono">AccountService.java</p>
              </div>
              <div className="text-[11px] font-mono text-violet-700 bg-violet-50 p-2 rounded border border-violet-200">
                @Service class Service
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-6 w-full max-w-md px-4">
            <Link
              to={ROUTES.PUBLIC.REGISTER}
              className="w-full sm:w-auto text-center bg-[#0652CC] text-white px-8 py-4 rounded-full text-base font-semibold hover:bg-[#0655FF] transition-all shadow-[0_10px_25px_rgba(6,82,204,0.25)] hover:shadow-[0_12px_30px_rgba(6,85,255,0.35)] cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Start Modernization</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#platform"
              className="w-full sm:w-auto text-center text-[#0652CC] bg-[#E8F1FF] px-8 py-4 rounded-full text-base font-semibold hover:bg-[#0652CC]/15 transition-colors border border-[#0652CC]/25 cursor-pointer flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4 text-[#0652CC]" />
              <span>Explore Platform</span>
            </a>
          </div>
        </div>
      </section>

      {/* ================================================== */}
      {/* 04. LEGACY MODERNIZATION PROBLEM (Split Editorial) */}
      {/* ================================================== */}
      <section id="problem" className="py-24 px-6 bg-[#020817] text-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5 space-y-6">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#22D3EE] bg-[#0652CC]/20 px-3.5 py-1.5 rounded-full border border-[#22D3EE]/30">
              01 // THE LEGACY CHALLENGE
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#F4F5F7] leading-tight">
              Your legacy systems shouldn't limit what's next.
            </h2>
            <p className="text-[#F4F5F7]/75 text-base sm:text-lg leading-relaxed">
              IBM i, AS400, BMS, and COBOL systems run mission-critical enterprise workflows. However, manual rewrite projects take years, cost millions, and risk catastrophic business rule regressions.
            </p>
            <p className="text-[#F4F5F7]/75 text-base sm:text-lg leading-relaxed">
              <strong className="text-white">ALSM</strong> provides automated, AST-driven deterministic refactoring that extracts screen maps, field attributes, and business logic without disrupting existing infrastructure.
            </p>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
              <div>
                <div className="text-3xl font-extrabold text-[#22D3EE] font-mono">10x</div>
                <div className="text-xs text-[#F4F5F7]/70 mt-1">Faster than manual rewrites</div>
              </div>
              <div>
                <div className="text-3xl font-extrabold text-[#0655FF] font-mono">100%</div>
                <div className="text-xs text-[#F4F5F7]/70 mt-1">Deterministic Rule Parity</div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="p-8 rounded-3xl bg-[#091E42]/80 border border-[#0652CC]/50 backdrop-blur-xl shadow-2xl space-y-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <span className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-[#22D3EE]" />
                  Legacy Component Inspector
                </span>
                <span className="text-[11px] font-mono text-[#22D3EE] bg-[#0652CC]/20 px-2.5 py-1 rounded border border-[#22D3EE]/30">
                  Interactive Node Selector
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {(['bms', 'dspf', 'cobol', 'ibmi', 'as400'] as const).map(nodeKey => (
                  <button
                    key={nodeKey}
                    onClick={() => setActiveLegacyNode(nodeKey)}
                    className={`px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase transition-all cursor-pointer ${
                      activeLegacyNode === nodeKey
                        ? 'bg-[#0652CC] text-white shadow-md border border-[#0655FF]'
                        : 'bg-[#020817] text-[#F4F5F7]/70 hover:text-white border border-white/10'
                    }`}
                  >
                    {nodeKey}
                  </button>
                ))}
              </div>

              <div className="bg-[#020817] border border-white/10 rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-white font-bold text-base font-mono">{nodeDetails[activeLegacyNode].name}</h4>
                    <span className="text-xs text-[#22D3EE] font-mono">{nodeDetails[activeLegacyNode].type}</span>
                  </div>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                </div>

                <p className="text-xs text-[#F4F5F7]/75 font-mono leading-relaxed bg-[#091E42]/50 p-3.5 rounded-xl border border-white/5">
                  {nodeDetails[activeLegacyNode].details}
                </p>

                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono uppercase text-[#F4F5F7]/60">Raw System Definition:</span>
                  <pre className="text-xs font-mono text-emerald-400 bg-slate-950 p-3.5 rounded-xl overflow-x-auto border border-emerald-500/20 leading-relaxed">
                    {nodeDetails[activeLegacyNode].code}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================== */}
      {/* 05. TRANSFORMATION PIPELINE                        */}
      {/* ================================================== */}
      <section id="how-it-works" className="py-24 px-6 bg-[#F7F9FC] text-[#091E42]">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0652CC] bg-[#E8F1FF] px-3.5 py-1.5 rounded-full border border-[#0652CC]/20">
              02 // TRANSFORMATION PIPELINE
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#091E42]">
              6-Stage Automated Modernization Pipeline
            </h2>
            <p className="text-[#42526E] text-base sm:text-lg">
              Convert legacy mainframe code into clean, scalable microservices with continuous AST verification.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pipelineStages.map((stage, idx) => {
              const IconComp = stage.icon;
              const isActive = activePipelineStage === idx;
              return (
                <div
                  key={stage.step}
                  onClick={() => setActivePipelineStage(idx)}
                  className={`p-8 rounded-3xl bg-white border transition-all cursor-pointer relative overflow-hidden group ${
                    isActive
                      ? 'border-[#0652CC] shadow-[0_15px_40px_rgba(6,82,204,0.15)] scale-[1.02]'
                      : 'border-[#D9E2EC] hover:border-[#0652CC]/40 opacity-90'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-mono font-bold text-[#0652CC] bg-[#E8F1FF] px-2.5 py-1 rounded-full">
                      STAGE {stage.step}
                    </span>
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-sm"
                      style={{ backgroundColor: stage.color }}
                    >
                      <IconComp className="w-5 h-5 text-white" />
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-[#091E42] mb-1">{stage.title}</h3>
                  <div className="text-xs font-semibold text-[#0652CC] mb-3">{stage.subtitle}</div>
                  <p className="text-xs text-[#42526E] leading-relaxed">{stage.description}</p>

                  {isActive && (
                    <div
                      className="absolute bottom-0 left-0 right-0 h-1.5"
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
      {/* 06. BMS / DSPF → REACT                             */}
      {/* ================================================== */}
      <section id="solutions" className="py-24 px-6 bg-white border-t border-[#D9E2EC]">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0652CC] bg-[#E8F1FF] px-3.5 py-1.5 rounded-full border border-[#0652CC]/20">
              03 // UI CONVERSION PIPELINE
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#091E42]">
              BMS / DSPF Green-Screen to Modern React 19
            </h2>
            <p className="text-[#42526E] text-base sm:text-lg">
              Legacy terminal character maps automatically transform into responsive React components with dark/light themes.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Terminal Screen */}
            <div className="bg-slate-950 border border-green-500/30 rounded-3xl p-6 font-mono text-xs shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-green-900/50 pb-3">
                <span className="text-emerald-400 font-bold flex items-center gap-2">
                  <Terminal className="w-4 h-4" />
                  AS400 BMS 3270 Terminal Screen
                </span>
                <span className="bg-emerald-950 text-emerald-400 text-[10px] px-2 py-0.5 rounded border border-emerald-500/30">
                  24x80 Character Grid
                </span>
              </div>

              <div className="bg-black p-4 rounded-xl border border-green-950 text-emerald-400 font-mono space-y-2 leading-relaxed">
                <div>+-------------------------------------------------------------+</div>
                <div>|  ALSM FINANCIAL SYSTEM - CUSTOMER ACCOUNT MAINTENANCE       |</div>
                <div>+-------------------------------------------------------------+</div>
                <div className="pt-2">  CUSTOMER-ID : [ <span className="bg-emerald-900/60 px-1 text-white">84920194  </span> ]  STATUS: ACTIVE</div>
                <div>  ACCOUNT-NO  : [ <span className="bg-emerald-900/60 px-1 text-white">ACCT-99201</span> ]  CURR  : USD</div>
                <div>  BALANCE     : [ <span className="bg-emerald-900/60 px-1 text-white">$148,250.00</span> ]</div>
                <div className="pt-3 text-emerald-600">  F3=EXIT  F12=CANCEL  F24=SUBMIT</div>
              </div>
            </div>

            {/* Generated React UI */}
            <div className="p-8 rounded-3xl bg-[#F7F9FC] border border-[#D9E2EC] shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-[#D9E2EC] pb-3">
                <span className="text-[#091E42] font-bold text-xs font-mono flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-[#0652CC]" />
                  Generated React 19 Component
                </span>
                <span className="bg-[#E8F1FF] text-[#0652CC] text-[10px] font-mono px-2.5 py-1 rounded-full border border-[#0652CC]/20 font-bold">
                  React 19 + Tailwind v4
                </span>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-[#D9E2EC] space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <h4 className="text-[#091E42] font-bold text-base">Customer Account Maintenance</h4>
                  <span className="bg-emerald-50 text-emerald-700 text-xs px-2.5 py-0.5 rounded-full border border-emerald-200 font-semibold">
                    Active
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-bold text-[#091E42] uppercase font-mono block mb-1">Customer ID</label>
                    <input
                      type="text"
                      readOnly
                      value="84920194"
                      className="w-full bg-[#F7F9FC] border border-[#D9E2EC] rounded-xl px-3.5 py-2 text-[#091E42] font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-[#091E42] uppercase font-mono block mb-1">Account No</label>
                    <input
                      type="text"
                      readOnly
                      value="ACCT-99201"
                      className="w-full bg-[#F7F9FC] border border-[#D9E2EC] rounded-xl px-3.5 py-2 text-[#091E42] font-mono text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-[#091E42] uppercase font-mono block mb-1">Current Balance</label>
                  <div className="text-xl font-bold text-[#0652CC] font-mono bg-[#E8F1FF] px-4 py-2.5 rounded-xl border border-[#0652CC]/20">
                    $148,250.00 USD
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button className="px-4 py-2 rounded-full text-xs font-semibold text-[#42526E] bg-gray-100 hover:bg-gray-200 transition-colors">
                    Cancel (F12)
                  </button>
                  <button className="px-5 py-2 rounded-full text-xs font-semibold text-white bg-[#0652CC] hover:bg-[#0655FF] transition-colors shadow-sm">
                    Submit (F24)
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================== */}
      {/* 07. COBOL TO JAVA                                  */}
      {/* ================================================== */}
      <section className="py-24 px-6 bg-[#F7F9FC] border-t border-[#D9E2EC]">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0652CC] bg-[#E8F1FF] px-3.5 py-1.5 rounded-full border border-[#0652CC]/20">
              04 // BACKEND REFACTORING
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#091E42]">
              COBOL Mainframe Rules to Spring Boot Java
            </h2>
            <p className="text-[#42526E] text-base sm:text-lg">
              Procedural paragraphs refactor into Spring Boot REST services with complete test coverage.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* COBOL Code */}
            <div className="bg-[#091E42] border border-[#0652CC]/40 rounded-3xl p-6 font-mono text-xs space-y-3 text-[#F4F5F7]">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span className="text-red-400 font-bold flex items-center gap-2">
                  <FileCode className="w-4 h-4" />
                  Legacy COBOL Source Code
                </span>
                <span className="text-[10px] text-red-400 bg-red-950/60 px-2.5 py-1 rounded-full border border-red-500/20">
                  Procedural Rules
                </span>
              </div>
              <pre className="text-gray-300 overflow-x-auto leading-relaxed p-2">
{`IDENTIFICATION DIVISION.
PROGRAM-ID. ACCT-CALC.
DATA DIVISION.
WORKING-STORAGE SECTION.
01 WS-ACCOUNT-NO   PIC X(10).
01 WS-BALANCE      PIC 9(7)V99.
01 WS-INT-AMT      PIC 9(5)V99.

PROCEDURE DIVISION.
100-CALC-INTEREST.
    IF WS-BALANCE > 50000.00
        COMPUTE WS-INT-AMT = WS-BALANCE * 0.0425
    ELSE
        COMPUTE WS-INT-AMT = WS-BALANCE * 0.0210
    END-IF.
    EXIT.`}
              </pre>
            </div>

            {/* Java Code */}
            <div className="bg-[#091E42] border border-[#0652CC]/40 rounded-3xl p-6 font-mono text-xs space-y-3 text-[#F4F5F7]">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span className="text-emerald-400 font-bold flex items-center gap-2">
                  <Code2 className="w-4 h-4" />
                  Modernized Java Spring Boot Service
                </span>
                <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-500/20">
                  Spring Boot 3 + Java 21
                </span>
              </div>
              <pre className="text-gray-200 overflow-x-auto leading-relaxed p-2">
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
      {/* 08. RULE & AI-ASSISTED VALIDATION                  */}
      {/* ================================================== */}
      <section id="ai-parity" className="w-full py-28 bg-[#020817] text-[#F4F5F7] relative overflow-hidden border-t border-[#091E42]">
        <div className="absolute top-1/3 left-1/4 w-[600px] h-[350px] bg-[#0655FF]/20 rounded-full blur-[150px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[250px] bg-[#22D3EE]/15 rounded-full blur-[130px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#22D3EE] bg-[#0652CC]/20 px-4 py-1.5 rounded-full border border-[#22D3EE]/30 shadow-[0_0_15px_rgba(34,211,238,0.2)]">
                RULE & AI-ASSISTED VALIDATION
              </span>
              <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#F4F5F7] mt-6 leading-tight">
                Rule Validation & Optional AI Assistance
              </h2>
              <p className="text-[#F4F5F7]/80 mt-4 text-base sm:text-lg leading-relaxed">
                ALSM uses deterministic rule validation for structural correctness, combined with optional AI-assisted validation to produce candidate findings with confidence scores for human review.
              </p>

              <div className="mt-8 space-y-4">
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#0652CC]/30 border border-[#22D3EE]/40 flex items-center justify-center shrink-0 mt-1">
                    <Check className="w-3.5 h-3.5 text-[#22D3EE]" />
                  </span>
                  <div>
                    <h4 className="text-base font-bold text-[#F4F5F7]">Rule Validator Engine</h4>
                    <p className="text-xs sm:text-sm text-[#F4F5F7]/70">Deterministic checks for data types, grid bounds, paragraph coverage, and structural rules.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#0652CC]/30 border border-[#22D3EE]/40 flex items-center justify-center shrink-0 mt-1">
                    <Check className="w-3.5 h-3.5 text-[#22D3EE]" />
                  </span>
                  <div>
                    <h4 className="text-base font-bold text-[#F4F5F7]">Optional AI-Assisted Findings</h4>
                    <p className="text-xs sm:text-sm text-[#F4F5F7]/70">AI highlights candidate risks and confidence scores. Human review makes all final decisions.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8 rounded-3xl bg-[#091E42]/80 border border-[#0652CC]/50 backdrop-blur-xl shadow-[0_0_50px_rgba(6,82,204,0.15)]">
              <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
                <span className="text-xs font-mono font-bold text-[#22D3EE]">SYSTEM_QUALITY_VALIDATION.log</span>
                <span className="text-xs font-semibold px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full border border-emerald-500/30">
                  RULE PASSED
                </span>
              </div>

              <div className="font-mono text-xs text-gray-200 space-y-2 leading-relaxed">
                <div className="text-emerald-400">+ [RULE VALIDATOR] BMS Mapfield: CUST_ADDR_01 -&gt; React state: customerAddress</div>
                <div className="text-emerald-400">+ [RULE VALIDATOR] Transaction rule: ERR_CODE_802 -&gt; Throws LegacyException</div>
                <div className="text-blue-400">+ [PERFORMANCE] Response latency: 1.2s -&gt; 42ms (96.5% reduction)</div>
                <div className="text-cyan-400">+ [AI ASSISTED FINDING] Visual diff candidate variance: 0.00% (Confidence: 98%)</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================== */}
      {/* 09. PLATFORM WORKFLOW                              */}
      {/* ================================================== */}
      <section className="w-full py-28 bg-[#020817] text-[#F4F5F7] relative overflow-hidden border-t border-[#091E42]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-[#22D3EE] bg-[#0652CC]/20 px-4 py-1.5 rounded-full border border-[#22D3EE]/30">
              AUTOMATED WORKFLOW
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#F4F5F7] mt-6 leading-tight">
              How ALSM Modernizes Enterprise Codebases
            </h2>
            <p className="text-[#F4F5F7]/75 mt-4 text-base sm:text-lg">
              From legacy BMS & COBOL straight to React 19 and Java via conversion algorithms and rule validation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl bg-[#091E42]/70 border border-[#0652CC]/40 backdrop-blur-xl hover:border-[#22D3EE]/60 transition-all shadow-2xl relative group">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0652CC] to-[#0655FF] flex items-center justify-center font-bold text-white text-lg mb-6 shadow-md">
                01
              </div>
              <h3 className="text-xl font-bold text-[#F4F5F7] mb-3 group-hover:text-[#22D3EE] transition-colors">
                Ingest & Analyze
              </h3>
              <p className="text-sm text-[#F4F5F7]/70 leading-relaxed">
                Parse legacy screens, schemas, and COBOL copybooks into standardized AST trees for the Conversion Algorithm.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-[#091E42]/70 border border-[#0655FF]/50 backdrop-blur-xl hover:border-[#22D3EE]/60 transition-all shadow-2xl relative group">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0655FF] to-[#22D3EE] flex items-center justify-center font-bold text-[#020817] text-lg mb-6 shadow-md">
                02
              </div>
              <h3 className="text-xl font-bold text-[#F4F5F7] mb-3 group-hover:text-[#22D3EE] transition-colors">
                Rule & AI Validation
              </h3>
              <p className="text-sm text-[#F4F5F7]/70 leading-relaxed">
                Run Rule Validator checks and optional AI-assisted analysis to identify candidate findings for human review.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-[#091E42]/70 border border-[#8B5CF6]/40 backdrop-blur-xl hover:border-[#8B5CF6]/70 transition-all shadow-2xl relative group">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0652CC] to-[#8B5CF6] flex items-center justify-center font-bold text-white text-lg mb-6 shadow-md">
                03
              </div>
              <h3 className="text-xl font-bold text-[#F4F5F7] mb-3 group-hover:text-[#8B5CF6] transition-colors">
                Clean Production Output
              </h3>
              <p className="text-sm text-[#F4F5F7]/70 leading-relaxed">
                Export pure React 19, Tailwind CSS design tokens, and Spring Boot Java microservices ready for deployment.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================== */}
      {/* 10. PRODUCT CAPABILITIES MATRIX                    */}
      {/* ================================================== */}
      <section id="platform" className="w-full py-24 bg-[#F7F9FC] text-[#091E42]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0652CC] bg-[#E8F1FF] px-3.5 py-1.5 rounded-full border border-[#0652CC]/20">
              MODERNIZATION MATRIX
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#091E42] mt-4">
              BMS to React & COBOL to Java Transformation
            </h2>
            <p className="text-[#42526E] mt-4 text-base sm:text-lg">
              High-readability light enterprise UI with deep navy code contrast for maximum clarity.
            </p>
          </div>

          <div className="flex justify-center mb-12">
            <div className="inline-flex p-1.5 bg-white rounded-full gap-1 border border-[#D9E2EC] shadow-sm">
              {matrixCategories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveMatrixTab(cat.id)}
                  className={`px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                    activeMatrixTab === cat.id
                      ? 'bg-[#0652CC] text-white shadow-[0_4px_15px_rgba(6,82,204,0.3)]'
                      : 'text-[#42526E] hover:text-[#091E42] hover:bg-gray-100'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center bg-white rounded-3xl p-8 sm:p-12 border border-[#D9E2EC] shadow-[0_20px_60px_rgba(9,30,66,0.08)]">
            <div>
              <h3 className="text-2xl sm:text-3xl font-bold text-[#091E42] leading-tight">
                {currentMatrix.title}
              </h3>
              <p className="text-[#42526E] mt-4 text-base leading-relaxed">
                {currentMatrix.description}
              </p>

              <ul className="mt-8 space-y-3">
                {currentMatrix.items.map((item, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-sm font-semibold text-[#091E42]">
                    <span className="w-6 h-6 rounded-full bg-[#E8F1FF] border border-[#0652CC]/25 flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5 text-[#0652CC]" />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="w-full bg-[#091E42] rounded-2xl p-6 border border-[#0652CC]/40 shadow-2xl text-left overflow-x-auto">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/10">
                <span className="w-3 h-3 rounded-full bg-[#0652CC]" />
                <span className="w-3 h-3 rounded-full bg-[#0655FF]" />
                <span className="w-3 h-3 rounded-full bg-[#22D3EE]" />
                <span className="ml-2 text-xs font-mono text-gray-300">transformation.tsx</span>
              </div>
              <pre className="font-mono text-xs sm:text-sm text-[#F4F5F7] leading-relaxed overflow-x-auto">
                <code>{currentMatrix.codeSnippet}</code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================== */}
      {/* 11. REVIEWS MARQUEE                                */}
      {/* ================================================== */}
      <section className="w-full py-16 bg-[#F7F9FC] text-[#091E42] overflow-hidden relative border-y border-[#D9E2EC]">
        <div className="max-w-7xl mx-auto px-4 mb-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#091E42]">
            Trusted by 2,000+ enterprise modernization teams
          </h2>
          <div className="flex items-center justify-center gap-1 mt-3">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-5 h-5 text-[#0652CC] fill-[#0652CC]" />
            ))}
            <span className="ml-2 text-sm text-[#42526E] font-semibold">4.9 / 5 overall rating</span>
          </div>
        </div>

        <div className="reviews-marquee relative w-full overflow-hidden flex [mask-image:linear-gradient(90deg,transparent,#F7F9FC_8%,#F7F9FC_92%,transparent)]">
          <div className="reviews-track flex gap-6 w-max py-4">
            {doubleReviews.map((rev, index) => (
              <div
                key={index}
                className="w-[340px] sm:w-[380px] p-6 rounded-2xl bg-white border border-[#D9E2EC] flex flex-col justify-between hover:border-[#0652CC]/50 hover:shadow-[0_15px_40px_rgba(6,82,204,0.12)] transition-all shadow-[0_10px_30px_rgba(9,30,66,0.06)] shrink-0"
              >
                <p className="text-sm text-[#42526E] font-medium leading-relaxed italic mb-6">
                  &ldquo;{rev.comment}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full ${rev.avatarBg} ${rev.avatarText} flex items-center justify-center font-bold text-sm shadow-sm`}
                  >
                    {rev.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#091E42]">{rev.name}</h4>
                    <p className="text-xs text-[#0652CC] font-semibold">{rev.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================== */}
      {/* 12. PRICING SECTION                                */}
      {/* ================================================== */}
      <section id="pricing" className="w-full py-24 bg-[#F7F9FC] text-[#091E42] relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0652CC] bg-[#E8F1FF] px-3.5 py-1.5 rounded-full border border-[#0652CC]/20">
              TRANSPARENT PRICING
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#091E42] mt-4">
              One subscription. Full platform access.
            </h2>
            <p className="text-[#42526E] mt-4 text-base sm:text-lg">
              Deploy enterprise-grade AI modernization tools with zero friction. Upgrade or cancel anytime.
            </p>

            {/* Billing Switch */}
            <div className="flex items-center justify-center gap-3 mt-8">
              <span className={`text-sm font-semibold ${!annualBilling ? 'text-[#091E42]' : 'text-[#42526E]'}`}>
                Monthly
              </span>
              <button
                type="button"
                onClick={() => setAnnualBilling(!annualBilling)}
                className="w-12 h-6 rounded-full bg-[#E8F1FF] p-1 flex items-center transition-colors border border-[#0652CC]/30 cursor-pointer"
              >
                <div
                  className={`w-4 h-4 rounded-full bg-[#0652CC] transition-transform ${
                    annualBilling ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
              <span className={`text-sm font-semibold ${annualBilling ? 'text-[#091E42]' : 'text-[#42526E]'}`}>
                Annual <span className="text-xs font-bold text-[#0652CC] bg-[#E8F1FF] px-2 py-0.5 rounded-full border border-[#0652CC]/20">Save 20%</span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            {loadingPlans ? (
              [1, 2, 3].map((idx) => (
                <div key={idx} className="p-8 rounded-3xl bg-white border border-[#D9E2EC] animate-pulse">
                  <div className="h-6 w-1/3 bg-gray-200 rounded mb-4" />
                  <div className="h-4 w-3/4 bg-gray-200 rounded mb-6" />
                  <div className="h-10 w-1/2 bg-gray-200 rounded mb-6" />
                  <div className="space-y-3">
                    <div className="h-4 w-full bg-gray-200 rounded" />
                    <div className="h-4 w-5/6 bg-gray-200 rounded" />
                    <div className="h-4 w-2/3 bg-gray-200 rounded" />
                  </div>
                </div>
              ))
            ) : plans.length === 0 ? (
              <div className="col-span-full p-12 text-center bg-white rounded-3xl border border-[#D9E2EC]">
                <h3 className="text-xl font-bold text-[#091E42]">Không có gói dịch vụ nào</h3>
                <p className="text-sm text-[#42526E] mt-2">
                  Dữ liệu gói dịch vụ sẽ được tải tự động từ hệ thống quản trị MongoDB.
                </p>
              </div>
            ) : (
              plans.map((plan) => {
                const isEnterprise = plan.id === 'ENTERPRISE';
                const priceVal = annualBilling ? plan.annualPrice : plan.monthlyPrice;
                const formatPrice = (val: number) => {
                  if (isEnterprise || val === 0) return 'Contact Sales';
                  return `${val.toLocaleString('vi-VN')}₫`;
                };

                return (
                  <div
                    key={plan.id}
                    className={`p-8 rounded-3xl bg-white flex flex-col justify-between relative transition-all ${
                      plan.isPopular
                        ? 'border-2 border-[#0652CC] shadow-[0_15px_45px_rgba(6,82,204,0.18)] scale-[1.02]'
                        : 'border border-[#D9E2EC] shadow-[0_10px_30px_rgba(9,30,66,0.06)] hover:border-[#0652CC]/40'
                    }`}
                  >
                    {plan.isPopular && (
                      <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-xs font-bold uppercase tracking-wider bg-[#0652CC] text-white px-3.5 py-1 rounded-full shadow-md">
                        Most Popular
                      </span>
                    )}
                    <div>
                      <h3 className="text-xl font-bold text-[#091E42]">{plan.name}</h3>
                      <p className={`text-xs mt-1 ${plan.isPopular ? 'text-[#0652CC] font-semibold' : 'text-[#42526E]'}`}>
                        {plan.description}
                      </p>
                      <div className="my-6">
                        <span className="text-4xl font-extrabold text-[#091E42]">
                          {formatPrice(priceVal)}
                        </span>
                        {!isEnterprise && priceVal !== 0 && (
                          <span className="text-[#42526E] text-sm"> / month</span>
                        )}
                      </div>

                      <ul className="space-y-3.5 text-sm text-[#091E42]">
                        {plan.features.map((feat, idx) => (
                          <li key={idx} className="flex items-center gap-2.5">
                            <Check className="w-4 h-4 text-[#0652CC] shrink-0" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <Link
                      to={ROUTES.PUBLIC.REGISTER}
                      className={`w-full mt-8 py-3.5 text-center text-sm font-bold rounded-full transition-all ${
                        plan.isPopular
                          ? 'bg-[#0652CC] text-white hover:bg-[#0655FF] shadow-[0_4px_20px_rgba(6,82,204,0.3)]'
                          : 'bg-[#E8F1FF] text-[#0652CC] hover:bg-[#0652CC] hover:text-white border border-[#0652CC]/25'
                      }`}
                    >
                      {isEnterprise ? 'Contact Sales' : plan.isPopular ? 'Get Pro Access' : 'Get Started'}
                    </Link>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>

      {/* ================================================== */}
      {/* 13. FAQ ACCORDION                                  */}
      {/* ================================================== */}
      <section id="faq" className="w-full py-24 bg-white text-[#091E42] border-t border-[#D9E2EC]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0652CC] bg-[#E8F1FF] px-3.5 py-1.5 rounded-full border border-[#0652CC]/20">
              FREQUENTLY ASKED QUESTIONS
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#091E42] mt-4">
              Everything You Need to Know
            </h2>
            <p className="text-[#42526E] mt-3 text-base">
              Have questions about ALSM? Here are clear answers to technical and operational questions.
            </p>
          </div>

          <div className="space-y-4">
            {FAQS.map((faq, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div
                  key={index}
                  className="rounded-2xl border border-[#D9E2EC] bg-[#F7F9FC] overflow-hidden transition-colors hover:border-[#0652CC]/40"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                    className="w-full px-6 py-5 flex items-center justify-between text-left font-bold text-[#091E42] text-base sm:text-lg cursor-pointer hover:bg-gray-100/50 transition-colors"
                  >
                    <span>{faq.question}</span>
                    <ChevronDown
                      className={`w-5 h-5 text-[#42526E] transition-transform duration-200 shrink-0 ${
                        isOpen ? 'rotate-180 text-[#0652CC]' : ''
                      }`}
                    />
                  </button>

                  <div className={`faq-answer ${isOpen ? 'faq-open' : ''}`}>
                    <div>
                      <p className="px-6 pb-6 text-sm sm:text-base text-[#42526E] font-medium leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================================================== */}
      {/* 14. FINAL CTA SECTION                              */}
      {/* ================================================== */}
      <section className="w-full py-28 bg-[#020817] text-[#F4F5F7] relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-[#0652CC]/25 rounded-full blur-[150px] pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Ready to Modernize What Powers <br className="hidden sm:inline" />
            Your Business?
          </h2>
          <p className="text-[#F4F5F7]/80 mt-6 text-lg max-w-2xl mx-auto font-medium">
            Join enterprise software teams using ALSM for deterministic AI parity, React 19, and Spring Boot Java.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
            <Link
              to={ROUTES.PUBLIC.REGISTER}
              className="w-full sm:w-auto px-9 py-4 rounded-full bg-[#0652CC] text-white text-base font-bold hover:bg-[#0655FF] transition-all shadow-[0_0_30px_rgba(6,85,255,0.4)]"
            >
              Get Started Now
            </Link>
            <Link
              to={ROUTES.BILLING.PRICING}
              className="w-full sm:w-auto px-9 py-4 rounded-full bg-[#091E42] text-[#F4F5F7] text-base font-semibold hover:bg-[#091E42]/80 transition-colors border border-[#0652CC]/40"
            >
              View Pricing
            </Link>
          </div>
        </div>
      </section>

      {/* ================================================== */}
      {/* 15. DARK FOOTER                                    */}
      {/* ================================================== */}
      <footer className="w-full bg-[#06142E] text-[#F4F5F7]/80 py-16 border-t border-[#091E42] text-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-10 pb-12 border-b border-[#091E42]">
            <div className="md:col-span-2 space-y-4">
              <Link to="/" className="flex items-center gap-2 text-white font-extrabold text-xl tracking-wider hover:text-[#22D3EE] transition-colors">
                <span className="w-7 h-7 rounded-lg bg-[#0652CC] flex items-center justify-center text-white text-xs font-bold">
                  <Cpu className="w-4 h-4 text-[#22D3EE]" />
                </span>
                <span>ALSM</span>
              </Link>
              <p className="text-[#F4F5F7]/70 max-w-sm text-xs sm:text-sm leading-relaxed">
                Automating Legacy System Modernization Platform. IBM i, AS400, BMS, DSPF & COBOL to React 19 and Java Spring Boot.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-4">Platform</h4>
              <ul className="space-y-2.5 text-xs sm:text-sm font-medium">
                <li><a href="#platform" className="hover:text-[#22D3EE] transition-colors">Platform Overview</a></li>
                <li><a href="#how-it-works" className="hover:text-[#22D3EE] transition-colors">How It Works</a></li>
                <li><Link to={ROUTES.BILLING.PRICING} className="hover:text-[#22D3EE] transition-colors">Pricing Plans</Link></li>
                <li><a href="#solutions" className="hover:text-[#22D3EE] transition-colors">Solutions</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-4">Resources</h4>
              <ul className="space-y-2.5 text-xs sm:text-sm font-medium">
                <li><a href="#ai-parity" className="hover:text-[#22D3EE] transition-colors">AI Parity Engine</a></li>
                <li><a href="#faq" className="hover:text-[#22D3EE] transition-colors">FAQs</a></li>
                <li><Link to={ROUTES.PUBLIC.LOGIN} className="hover:text-[#22D3EE] transition-colors">Sign In</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-4">Company</h4>
              <ul className="space-y-2.5 text-xs sm:text-sm font-medium">
                <li><a href="#problem" className="hover:text-[#22D3EE] transition-colors">About Legacy Challenge</a></li>
                <li><Link to={ROUTES.PUBLIC.REGISTER} className="hover:text-[#22D3EE] transition-colors">Register</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#F4F5F7]/60 font-medium">
            <p>© {new Date().getFullYear()} ALSM Platform Inc. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <span>Privacy</span>
              <span>Terms</span>
              <span>Cookies</span>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
};
export default LandingPage;
