import type { ASTNode, ConversionResult, FieldMapping } from '@/features/conversion/types/conversion';

export const mockConversionResult: ConversionResult = {
  screenId: 'scr-login',
  screenName: 'LoginScreen.bms',
  targetFramework: 'React TypeScript',
  timestamp: 'Oct 12, 2023 10:45 AM',
  executionDuration: '1.1s',
  astNodesCount: 242,
  generatedLoc: 420,
  metrics: {
    fieldsProcessed: 23,
    componentsGenerated: 18,
    linesOfCode: 1240,
    sizeKb: 48,
    duration: '1m 15s',
  },
  generatedCode: `import React, { useState } from 'react';
import { Shield, Lock, Mail, ArrowRight } from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Authenticating:', email);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-slate-100">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-2xl">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold">ACME CORP</h2>
            <p className="text-xs text-slate-400">Sign in to your enterprise workspace</p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@acmecorp.com"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm focus:outline-none focus:border-indigo-500 text-white"
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">Password</label>
              <a href="#" className="text-xs text-indigo-400 hover:underline">Forgot password?</a>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm focus:outline-none focus:border-indigo-500 text-white"
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg shadow-lg flex items-center justify-center space-x-2 transition-all"
          >
            <span>Sign In</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
export default LoginScreen;`,
};

export const mockASTData: ASTNode = {
  id: 'ast-root',
  name: 'Program (DFHMSD TYPE=MAP)',
  type: 'Program',
  details: 'BMS Legacy Map SetDefinition',
  children: [
    {
      id: 'ast-rootnode',
      name: 'RootNode (DFHMDI SIZE=(24,80))',
      type: 'RootNode',
      children: [
        {
          id: 'ast-screendef',
          name: 'ScreenDef: LoginScreen',
          type: 'ScreenDef',
          children: [
            { id: 'ast-field1', name: 'VariableDecl: USER_ID (POS=R10 C15, LEN=20)', type: 'VariableDecl' },
            { id: 'ast-field2', name: 'VariableDecl: PASS_KEY (POS=R12 C15, LEN=16, ATTR=UNPROT,DRK)', type: 'VariableDecl' },
          ],
        },
        {
          id: 'ast-actionblock',
          name: 'ActionBlock: ON_ENTER',
          type: 'ActionBlock',
          children: [
            { id: 'ast-call', name: 'CallStmt: AUTH_SVC (PARMS=USER_ID, PASS_KEY)', type: 'CallStmt' },
          ],
        },
        {
          id: 'ast-layoutdef',
          name: 'LayoutDef: MainForm (ATTR=NUM,PROT)',
          type: 'LayoutDef',
        },
      ],
    },
  ],
};

export const mockFieldMappings: FieldMapping[] = [
  {
    id: 'fm-1',
    legacyField: {
      name: 'USER-ID-INPUT',
      type: 'Alphanumeric',
      length: 20,
      position: 'R10, C15',
    },
    componentMapping: {
      componentType: 'Text Field',
      labelText: 'Username',
      isRequired: true,
      minLength: 4,
      maxLength: 20,
      regexPattern: '^[a-zA-Z0-9_]+$',
    },
  },
  {
    id: 'fm-2',
    legacyField: {
      name: 'PASS-KEY-ATTR',
      type: 'Alphanumeric (Hidden)',
      length: 16,
      position: 'R12, C15',
    },
    componentMapping: {
      componentType: 'Password Input',
      labelText: 'Password',
      isRequired: true,
      minLength: 8,
      maxLength: 16,
      regexPattern: '.*',
    },
  },
  {
    id: 'fm-3',
    legacyField: {
      name: 'SUBMIT-CMD',
      type: 'Control Field',
      length: 1,
      position: 'R20, C40',
    },
    componentMapping: {
      componentType: 'Button (Primary)',
      labelText: 'Sign In',
      isRequired: false,
      minLength: 0,
      maxLength: 0,
      regexPattern: '',
    },
  },
];
