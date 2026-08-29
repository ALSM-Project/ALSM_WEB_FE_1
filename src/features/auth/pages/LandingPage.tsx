import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Cpu, ShieldCheck, Zap, Code2, Database, Terminal, LogOut } from 'lucide-react';
import { ROUTES } from '@/shared/constants/routes';
import { useAuth } from '@/app/providers';

export const LandingPage: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.PUBLIC.LANDING, { replace: true });
  };

  return (
    <div className="bg-[#F7F9FC] text-slate-900 min-h-screen flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 px-6 py-4 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-xs">
              <Cpu className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-extrabold tracking-tight text-slate-900 leading-none">ALSM</span>
              <span className="text-[10px] font-medium text-slate-500 tracking-wide mt-0.5">Legacy Modernization</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-slate-900 transition-colors">Products</a>
            <a href="#solutions" className="hover:text-slate-900 transition-colors">Solutions</a>
            <a href="#docs" className="hover:text-slate-900 transition-colors">Documentation</a>
            <Link to={ROUTES.BILLING.PRICING} className="hover:text-slate-900 transition-colors">Pricing</Link>
          </nav>

          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <span className="hidden md:inline text-sm font-medium text-slate-600">
                  {user?.fullName || user?.email}
                </span>
                <Link
                  to={ROUTES.PROJECTS.NEW}
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-lg shadow-xs transition-all flex items-center space-x-2"
                >
                  <span>Create Project</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors flex items-center space-x-1"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign out</span>
                </button>
              </>
            ) : (
              <>
                <Link to={ROUTES.PUBLIC.LOGIN} className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                  Sign in
                </Link>
                <Link
                  to={ROUTES.PUBLIC.REGISTER}
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-lg shadow-xs transition-all flex items-center space-x-2"
                >
                  <span>Start Free Trial</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 px-6 overflow-hidden">
        <div className="max-w-5xl mx-auto text-center space-y-8 relative z-10">
          {/* Announcement Bar */}
          <div className="inline-flex items-center space-x-2 bg-white border border-slate-200 px-4 py-1.5 rounded-full text-xs font-medium text-slate-700 shadow-xs hover:border-slate-300 transition-colors cursor-pointer">
            <span className="bg-brand-50 text-brand-600 font-semibold px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider">What's new</span>
            <span>MODERNIZER AI engine now supports COBOL-to-Java migration pipelines.</span>
            <span className="text-brand-600 font-semibold flex items-center">Explore now &rarr;</span>
          </div>

          {/* Hero Main Headline */}
          <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Automating Legacy System Modernization
          </h1>

          <p className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Accelerate your legacy IBM mainframe, BMS, DSPF, and COBOL applications to cloud-native React and Java microservices with automated refactoring powered by MODERNIZER.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to={ROUTES.PUBLIC.REGISTER}
              className="w-full sm:w-auto px-8 py-4 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-sm transition-all flex items-center justify-center space-x-3 text-base"
            >
              <span>Start Free Trial</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a
              href="#docs"
              className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-xl border border-slate-300 transition-all text-base text-center shadow-xs"
            >
              Read Documentation
            </a>
          </div>

          {/* Enterprise Logos */}
          <div className="pt-10 border-t border-slate-200">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-6">
              Trusted by 500+ Enterprise Engineering Teams
            </p>
            <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16 opacity-75 text-slate-600 font-mono text-sm font-bold">
              <span className="flex items-center space-x-2"><Database className="w-5 h-5 text-brand-600" /><span>IBM Mainframe</span></span>
              <span className="flex items-center space-x-2"><Zap className="w-5 h-5 text-[#DC6803]" /><span>AWS Cloud</span></span>
              <span className="flex items-center space-x-2"><Cpu className="w-5 h-5 text-[#0284C7]" /><span>GCP Enterprise</span></span>
            </div>
          </div>
        </div>
      </section>

      {/* Visual Code Transformation Preview Section (Technical Panels Dark) */}
      <section className="py-16 px-6 bg-white border-y border-slate-200">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Legacy COBOL Side (Dark Technical Panel) */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md font-mono text-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-rose-400 font-semibold flex items-center space-x-2">
                <Terminal className="w-4 h-4" />
                <span>Legacy BMS / COBOL Input</span>
              </span>
              <span className="bg-rose-500/10 text-rose-400 text-[10px] px-2.5 py-0.5 rounded border border-rose-500/20">IBM Mainframe</span>
            </div>
            <pre className="text-slate-300 overflow-x-auto leading-relaxed">
{`IDENTIFICATION DIVISION.
PROGRAM-ID. HELLO-WORLD.
DATA DIVISION.
WORKING-STORAGE SECTION.
01 WS-USER-ID PIC X(20).
01 WS-PASS-KEY PIC X(16).
PROCEDURE DIVISION.
  DISPLAY 'ENTER CREDENTIALS:'.
  ACCEPT WS-USER-ID.
  CALL 'AUTH_SVC' USING WS-USER-ID.`}
            </pre>
          </div>

          {/* Target Modernization Output (Dark Technical Panel) */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md font-mono text-xs space-y-4 relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-brand-400 font-semibold flex items-center space-x-2">
                <Code2 className="w-4 h-4" />
                <span>Modern React + TS Target</span>
              </span>
              <span className="bg-brand-500/10 text-brand-400 text-[10px] px-2.5 py-0.5 rounded border border-brand-500/20">Target: React / Java 17</span>
            </div>
            <pre className="text-slate-200 overflow-x-auto leading-relaxed">
{`export const LoginScreen: React.FC = () => {
  const [userId, setUserId] = useState('');
  const handleAuth = async () => {
    await authService.login({ userId });
  };
  return <LoginForm onSubmit={handleAuth} />;
};`}
            </pre>
          </div>
        </div>
      </section>

      {/* AI Partner Section */}
      <section id="features" className="py-20 px-6 max-w-7xl mx-auto w-full">
        <div className="text-center space-y-4 mb-16">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-600">AI Modernization Engine</p>
          <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900">
            Powered by MODERNIZER AI Assistant
          </h2>
          <p className="text-slate-600 max-w-2xl mx-auto text-base">
            Turn legacy screen maps and monolithic COBOL code into clean, scalable microservices and responsive web UIs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white border border-slate-200 rounded-2xl p-8 space-y-4 hover:border-brand-300 transition-all shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600">
              <Code2 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Automated COBOL to Java/C#</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Refactor procedural mainframe logic into maintainable Object-Oriented design with full type safety and modern architectural patterns.
            </p>
            <Link to={ROUTES.PUBLIC.REGISTER} className="inline-flex items-center space-x-1 text-sm text-brand-600 hover:text-brand-700 font-semibold pt-2">
              <span>Try it now</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-8 space-y-4 hover:border-brand-300 transition-all shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Dependency & Blast-Radius Analysis</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              AI-driven AST visual tree generation detects cross-program dependencies, hidden macros, and database mapping risks before execution.
            </p>
            <Link to={ROUTES.PUBLIC.REGISTER} className="inline-flex items-center space-x-1 text-sm text-brand-600 hover:text-brand-700 font-semibold pt-2">
              <span>Learn more</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-8 space-y-4 hover:border-brand-300 transition-all shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Continuous Validation & Parity Testing</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Automated parity engine ensures 99.8% visual and functional equivalence between legacy green-screens and generated React web apps.
            </p>
            <Link to={ROUTES.PUBLIC.REGISTER} className="inline-flex items-center space-x-1 text-sm text-brand-600 hover:text-brand-700 font-semibold pt-2">
              <span>Explore capabilities</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800 bg-[#181A1D] py-12 px-6 text-sm text-slate-400">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          <div className="col-span-2 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white font-bold">
                <Cpu className="w-5 h-5" />
              </div>
              <span className="text-lg font-extrabold text-white">ALSM</span>
            </div>
            <p className="text-slate-400 text-xs max-w-sm leading-relaxed">
              ALSM Platform — Automating Legacy System Modernization at enterprise speed with AI conversion studio pipelines.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-3 text-xs uppercase tracking-wider">Product</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><a href="#features" className="hover:text-white">Features</a></li>
              <li><a href="#features" className="hover:text-white">Integrations</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-3 text-xs uppercase tracking-wider">Company</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><a href="#" className="hover:text-white">About Us</a></li>
              <li><a href="#" className="hover:text-white">Careers</a></li>
              <li><a href="#" className="hover:text-white">Blog</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-3 text-xs uppercase tracking-wider">Support & Legal</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><a href="#" className="hover:text-white">Contact Sales</a></li>
              <li><a href="#" className="hover:text-white">Help Center</a></li>
              <li><a href="#" className="hover:text-white">Privacy & Terms</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto border-t border-slate-800 pt-6 text-xs text-slate-500 text-center">
          © {new Date().getFullYear()} ALSM Platform. All rights reserved.
        </div>
      </footer>
    </div>
  );
};
export default LandingPage;
