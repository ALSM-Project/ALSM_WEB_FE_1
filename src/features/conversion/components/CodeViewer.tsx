import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';

export interface CodeViewerProps {
  code: string;
  language?: string;
  filename?: string;
}

export const CodeViewer: React.FC<CodeViewerProps> = ({ code, language = 'tsx', filename }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = code.split('\n');

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden font-mono text-xs flex flex-col h-full shadow-inner">
      <div className="bg-slate-900 px-4 py-2.5 border-b border-slate-800 flex justify-between items-center text-slate-400">
        <span className="font-semibold text-slate-300 flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-brand-500"></span>
          <span>{filename || `generated-screen.${language}`}</span>
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>

      <div className="p-4 overflow-auto flex-grow max-h-[500px]">
        <table className="w-full border-collapse">
          <tbody>
            {lines.map((line, idx) => (
              <tr key={idx} className="hover:bg-slate-900/60 leading-relaxed">
                <td className="w-10 select-none text-slate-600 text-right pr-4 py-0.5">{idx + 1}</td>
                <td className="text-slate-200 whitespace-pre py-0.5">{line}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default CodeViewer;
