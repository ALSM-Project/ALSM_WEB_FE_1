import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Folder, FileCode, Tag } from 'lucide-react';
import type { ASTNode } from '../types/conversion';

export const ASTNodeItem: React.FC<{ node: ASTNode; depth?: number }> = ({ node, depth = 0 }) => {
  const [isOpen, setIsOpen] = useState(true);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className="font-mono text-xs select-none">
      <div
        onClick={() => hasChildren && setIsOpen(!isOpen)}
        className={`flex items-center space-x-2 py-1 px-2 rounded hover:bg-slate-800/60 cursor-pointer transition-colors ${
          depth === 0 ? 'text-brand-400 font-bold' : 'text-slate-300'
        }`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        {hasChildren ? (
          isOpen ? <ChevronDown className="w-3.5 h-3.5 text-slate-500" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
        ) : (
          <span className="w-3.5 h-3.5" />
        )}
        {hasChildren ? <Folder className="w-3.5 h-3.5 text-amber-400" /> : <FileCode className="w-3.5 h-3.5 text-brand-400" />}
        <span>{node.name}</span>
        {node.details && <span className="text-[10px] text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">{node.details}</span>}
      </div>

      {hasChildren && isOpen && (
        <div className="border-l border-slate-800/60 ml-3">
          {node.children!.map((child) => (
            <ASTNodeItem key={child.id} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

export const ASTTree: React.FC<{ data: ASTNode }> = ({ data }) => {
  return (
    <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 overflow-auto max-h-[500px] shadow-inner">
      <div className="flex items-center space-x-2 mb-3 pb-2 border-b border-slate-800 text-xs font-semibold text-slate-400">
        <Tag className="w-4 h-4 text-brand-400" />
        <span>Abstract Syntax Tree (BMS / COBOL AST)</span>
      </div>
      <ASTNodeItem node={data} />
    </div>
  );
};
export default ASTTree;
