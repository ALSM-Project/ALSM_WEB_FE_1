import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Layers, Code2, Sparkles, FileCode2 } from 'lucide-react';
import logo from "@/assets/logo.png";
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
  eyebrow = 'LEGACY MODERNIZATION PLATFORM',
  headline = 'Convert IBM Legacy Systems to Modern Web Apps',
  description = 'Modernize legacy BMS/DSPF screens and COBOL business logic into modern web technologies with structured analysis, generation and validation.',
}) => {
  const isRegister = variant === 'register';

  // Shared contained marketing panel
  const marketingPanelNode = (
    <div className="auth-marketing-card">
      <div className="auth-card-glow-1" />
      <div className="auth-card-glow-2" />
      <div className="auth-card-grid" />

      <div className="relative z-10 space-y-6">
        {/* ALSM Brand Identity */}
        <Link to="/" className="inline-flex items-center space-x-3 group">
            <img
              src={logo}
              alt="ALSM"
              className="h-12 w-auto object-contain"
            />
          <div className="flex flex-col">
            <span className="text-xl font-extrabold tracking-tight text-white leading-none">ALSM</span>
            <span className="text-[11px] font-medium text-blue-200/70 tracking-wide mt-0.5">Legacy Modernization</span>
          </div>
        </Link>

        {/* Marketing Copy */}
        <div className="space-y-3">
          <div className="inline-flex items-center space-x-2 bg-blue-500/10 border border-blue-400/20 px-3 py-1 rounded-full text-xs font-semibold text-[#22D3EE]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{eyebrow}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
            {headline}
          </h1>

          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
            {description}
          </p>
        </div>

        {/* Compact Flow Graphic */}
        <div className="modernization-flow-box">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-3">
            <span className="uppercase tracking-wider text-[11px]">MODERNIZATION FLOW</span>
            <span className="text-[#22D3EE] font-mono flex items-center gap-1 text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#22D3EE] animate-pulse"></span>
              Active Engine
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-center">
            {/* Legacy Block */}
            <div className="flow-node-item">
              <div className="flex items-center space-x-1.5 text-rose-400 text-xs font-bold mb-1">
                <FileCode2 className="w-3.5 h-3.5 shrink-0" />
                <span>LEGACY SYSTEM</span>
              </div>
              <div className="text-[11px] font-mono text-slate-300 space-y-0.5">
                <div>BMS / DSPF</div>
                <div>COBOL Logic</div>
              </div>
            </div>

            {/* Transform Arrow */}
            <div className="flex flex-col items-center justify-center py-1 sm:py-0">
              <div className="w-7 h-7 rounded-full bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-[#22D3EE]">
                <ArrowRight className="w-3.5 h-3.5 rotate-90 sm:rotate-0" />
              </div>
              <span className="text-[9px] font-bold text-slate-300 tracking-wider uppercase mt-1">
                ANALYZE & MAP
              </span>
            </div>

            {/* Modern Output Block */}
            <div className="flow-node-item border-blue-500/30 bg-blue-950/20">
              <div className="flex items-center space-x-1.5 text-[#22D3EE] text-xs font-bold mb-1">
                <Code2 className="w-3.5 h-3.5 shrink-0" />
                <span>MODERN OUTPUT</span>
              </div>
              <div className="text-[11px] font-mono text-slate-300 space-y-0.5">
                <div className="flex items-center justify-between">
                  <span>React TS</span>
                  <span className="text-[9px] text-emerald-400 font-sans">Web UI</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Java Spring</span>
                  <span className="text-[9px] text-emerald-400 font-sans">Backend</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Panel Footer Subtext */}
        <div className="pt-3 border-t border-white/10 text-xs text-slate-400 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Layers className="w-3.5 h-3.5 text-blue-400" />
            <span>ALSM Modernization Platform</span>
          </div>
          <span className="text-slate-500 font-mono text-[11px]">Enterprise Portal</span>
        </div>
      </div>
    </div>
  );

  const authCardNode = (
    <div className="auth-card-wrapper">
      <div className="auth-card-box">
        {children}
      </div>
    </div>
  );

  return (
    <div className="auth-page-main font-sans">
      <div className={`auth-centered-container variant-${variant}`}>
        {isRegister ? (
          <>
            {authCardNode}
            {marketingPanelNode}
          </>
        ) : (
          <>
            {marketingPanelNode}
            {authCardNode}
          </>
        )}
      </div>
    </div>
  );
};
