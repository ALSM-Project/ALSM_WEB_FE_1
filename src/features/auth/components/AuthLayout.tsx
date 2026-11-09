import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
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
  eyebrow = 'ENTERPRISE MODERNIZATION PLATFORM',
  headline = 'Convert IBM Legacy Systems to Modern Web Apps',
  description = 'Modernize legacy BMS/DSPF screens and COBOL business logic into modern web technologies with structured analysis, generation and validation.',
}) => {
  const isRegister = variant === 'register';

  // Informational Marketing Panel: Subtle Same-Tone Gradient Depth
  const marketingPanelNode = (
    <section
      aria-label="Platform Overview"
      className={`auth-marketing-card ${isRegister ? 'hidden lg:flex' : ''}`}
    >
      <div className="space-y-6">
        {/* ALSM Brand Identity - Original Logo Kept */}
        <Link
          to="/"
          className="inline-flex items-center space-x-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--alsm-primary)] rounded-md p-1 -m-1"
        >
          <img
            src={logo}
            alt="ALSM Logo"
            className="h-10 w-auto object-contain"
          />
          <div className="flex flex-col">
            <span className="text-lg font-bold tracking-tight text-[var(--alsm-panel-text)] leading-tight">
              ALSM
            </span>
            <span className="text-xs font-medium text-[var(--alsm-panel-muted)]">
              Legacy Modernization
            </span>
          </div>
        </Link>

        {/* Value Proposition */}
        <div className="space-y-2.5">
          {/* Functional Category Tag - Clean text, no decorative icon */}
          <div className="inline-flex items-center bg-[var(--alsm-primary-soft)] px-2.5 py-1 rounded text-xs font-semibold tracking-wider text-[var(--alsm-accent)] uppercase">
            <span>{eyebrow}</span>
          </div>

          <h1 className="text-2xl sm:text-[26px] font-bold text-[var(--alsm-panel-text)] tracking-tight leading-snug">
            {headline}
          </h1>

          <p className="text-[var(--alsm-panel-muted)] text-xs sm:text-sm leading-relaxed">
            {description}
          </p>
        </div>

        {/* Informational Panel Content */}
        {isRegister ? (
          /* For Registration: Authentic ALSM core modernization capabilities */
          <div className="space-y-3 pt-1">
            <div className="flow-node-item">
              <div className="text-[var(--alsm-panel-text)] text-xs font-semibold uppercase tracking-wider mb-1">
                Screen &amp; Mapset Ingestion
              </div>
              <p className="text-xs text-[var(--alsm-panel-muted)] leading-relaxed">
                Parses IBM 3270 BMS mapsets and AS/400 DSPF display files into structured component hierarchies.
              </p>
            </div>

            <div className="flow-node-item">
              <div className="text-[var(--alsm-panel-text)] text-xs font-semibold uppercase tracking-wider mb-1">
                COBOL Rule Extraction
              </div>
              <p className="text-xs text-[var(--alsm-panel-muted)] leading-relaxed">
                Analyzes DATA DIVISION variables and PROCEDURE DIVISION control flows into modular business logic.
              </p>
            </div>

            <div className="flow-node-item">
              <div className="text-[var(--alsm-panel-text)] text-xs font-semibold uppercase tracking-wider mb-1">
                Modern Stack Synthesis
              </div>
              <p className="text-xs text-[var(--alsm-panel-muted)] leading-relaxed">
                Generates production-grade React TypeScript interfaces paired with typed Spring Boot REST APIs.
              </p>
            </div>
          </div>
        ) : (
          /* For Login: Clean Modernization Pipeline diagram */
          <div className="modernization-flow-box">
            <div className="flex items-center justify-between text-xs font-semibold mb-3">
              <span className="uppercase tracking-wider text-xs text-[var(--alsm-panel-muted)]">
                Modernization Pipeline
              </span>
              <span className="text-[var(--alsm-panel-muted)] font-mono text-xs flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--alsm-accent)]" aria-hidden="true" />
                Active Engine
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1.15fr] gap-2.5 items-center">
              <div className="flow-node-item">
                <div className="text-[var(--alsm-panel-text)] text-xs font-semibold mb-1.5">
                  <span className="whitespace-nowrap">Legacy System</span>
                </div>
                <div className="text-xs font-mono text-[var(--alsm-panel-muted)] space-y-1">
                  <div className="whitespace-nowrap">BMS / DSPF 3270</div>
                  <div className="whitespace-nowrap">COBOL Logic</div>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center py-1 sm:py-0 px-1">
                <div className="w-7 h-7 rounded-full bg-[var(--alsm-accent)] text-[var(--alsm-panel-bg-bottom)] flex items-center justify-center">
                  <ArrowRight className="w-4 h-4 rotate-90 sm:rotate-0" aria-hidden="true" />
                </div>
                <span className="text-xs font-semibold text-[var(--alsm-panel-muted)] tracking-wider uppercase mt-1 whitespace-nowrap">
                  Analyze &amp; Map
                </span>
              </div>

              <div className="flow-node-item">
                <div className="text-[var(--alsm-panel-text)] text-xs font-semibold mb-1.5">
                  <span className="whitespace-nowrap">Modern Output</span>
                </div>
                <div className="text-xs font-mono text-[var(--alsm-panel-muted)] space-y-1">
                  <div className="flex items-center justify-between gap-3 whitespace-nowrap">
                    <span>React 19 + TS</span>
                    <span className="text-xs font-sans text-[var(--alsm-panel-muted)] opacity-85">Web UI</span>
                  </div>
                  <div className="flex items-center justify-between gap-3 whitespace-nowrap">
                    <span>Spring Boot</span>
                    <span className="text-xs font-sans text-[var(--alsm-panel-muted)] opacity-85">REST API</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Panel Footer Security Anchor - Functional Trust Label */}
      <div className="pt-4 mt-6 border-t border-[var(--alsm-panel-border)] text-xs text-[var(--alsm-panel-muted)] flex items-center justify-between">
        <span className="text-[var(--alsm-panel-muted)]">Enterprise Grade Security</span>
        <span className="text-[var(--alsm-panel-muted)] font-mono text-xs">ALSM Portal</span>
      </div>
    </section>
  );

  const authCardNode = (
    <main className="auth-card-wrapper">
      <div className="auth-card-box">
        {/* Mobile-only brand identity header */}
        <div className="lg:hidden flex items-center space-x-2.5 pb-4 mb-2 border-b border-[var(--alsm-border)]">
          <img
            src={logo}
            alt="ALSM Logo"
            className="h-8 w-auto object-contain"
          />
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-tight text-[var(--alsm-text)] leading-tight">
              ALSM
            </span>
            <span className="text-xs font-medium text-[var(--alsm-text-muted)]">
              Legacy Modernization
            </span>
          </div>
        </div>
        {children}
      </div>
    </main>
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

export default AuthLayout;
