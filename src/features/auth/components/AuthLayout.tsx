import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, ShieldCheck, Terminal, Cpu } from 'lucide-react';
import logo from '@/assets/logo.png';
import './AuthLayout.css';

interface AuthLayoutProps {
  children: React.ReactNode;
  variant?: 'login' | 'register' | 'recovery';
  eyebrow?: string;
  headline?: string;
  description?: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  variant = 'login',
  eyebrow = 'AUTOMATING LEGACY SYSTEM MODERNIZATION',
  headline = 'Enterprise Legacy Modernization Platform',
  description = 'Deterministic analysis, AST-based mapping, code generation, and automated validation for IBM BMS, DSPF, and COBOL systems.',
}) => {
  const isRegister = variant === 'register';

  // Professional enterprise technical summary panel
  const infoPanelNode = (
    <div className="auth-info-panel hidden lg:flex flex-col justify-between p-8 bg-[#091E42] text-white rounded-xl border border-slate-800">
      <div className="space-y-6">
        {/* Brand Header */}
        <Link to="/" className="inline-flex items-center space-x-3 group">
          <img
            src={logo}
            alt="ALSM"
            className="h-10 w-auto object-contain"
          />
          <div className="flex flex-col">
            <span className="text-xl font-bold tracking-tight text-white leading-none">ALSM</span>
            <span className="text-[11px] font-medium text-slate-400 tracking-wide mt-1">
              Enterprise Engineering
            </span>
          </div>
        </Link>

        {/* Technical Value Proposition */}
        <div className="space-y-3 pt-2">
          <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded bg-blue-900/40 border border-blue-700/50 text-[11px] font-mono font-medium text-blue-300">
            <Terminal className="w-3.5 h-3.5" />
            <span>{eyebrow}</span>
          </div>

          <h2 className="text-2xl font-bold text-white tracking-tight leading-snug">
            {headline}
          </h2>

          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
            {description}
          </p>
        </div>

        {/* Core Capabilities Checklist */}
        <div className="space-y-3 pt-4 border-t border-slate-800/80">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Key Architecture Capabilities
          </div>

          <div className="space-y-2.5 text-xs text-slate-300">
            <div className="flex items-start space-x-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong className="text-white font-medium">BMS & DSPF Ingestion:</strong> Automated screen parser and field attribute extraction.
              </span>
            </div>

            <div className="flex items-start space-x-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong className="text-white font-medium">COBOL Program Analysis:</strong> Business rule decomposition and data division binding.
              </span>
            </div>

            <div className="flex items-start space-x-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong className="text-white font-medium">Target Code Output:</strong> Type-safe React 19 / TypeScript UI and Spring Boot backend DTOs.
              </span>
            </div>

            <div className="flex items-start space-x-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong className="text-white font-medium">Validation & Diagnostics:</strong> Automated rule-based inspection and quality checks.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Trust & Enterprise Assurance */}
      <div className="pt-6 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-blue-400" />
          <span>SOC2 & Enterprise Compliant Pipeline</span>
        </div>
        <div className="flex items-center space-x-1 font-mono text-[11px] text-slate-500">
          <Cpu className="w-3.5 h-3.5" />
          <span>v1.0-poc</span>
        </div>
      </div>
    </div>
  );

  const authCardNode = (
    <div className="auth-card-container w-full max-w-md mx-auto">
      {/* Mobile-only compact logo header */}
      <div className="lg:hidden flex items-center justify-center space-x-2.5 mb-6">
        <img src={logo} alt="ALSM" className="h-9 w-auto object-contain" />
        <span className="text-lg font-bold text-[#091E42]">ALSM Platform</span>
      </div>

      <div className="bg-white border border-[#D9E2EC] rounded-xl p-6 sm:p-8 shadow-xs">
        {children}
      </div>

      <div className="text-center mt-6 text-[11px] text-[#6B778C]">
        Automating Legacy System Modernization &copy; {new Date().getFullYear()} ALSM Project
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4 sm:p-6 lg:p-10 font-sans">
      <div className={`w-full max-w-5xl mx-auto ${
        isRegister
          ? 'grid grid-cols-1 lg:grid-cols-12 gap-8 items-center'
          : 'grid grid-cols-1 lg:grid-cols-12 gap-8 items-center'
      }`}>
        {isRegister ? (
          <>
            <div className="lg:col-span-7">{authCardNode}</div>
            <div className="lg:col-span-5 h-full">{infoPanelNode}</div>
          </>
        ) : (
          <>
            <div className="lg:col-span-6 h-full">{infoPanelNode}</div>
            <div className="lg:col-span-6">{authCardNode}</div>
          </>
        )}
      </div>
    </div>
  );
};

export default AuthLayout;
