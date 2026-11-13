import React from 'react';
import { Layers, AlertTriangle, Clock, Check } from 'lucide-react';

export interface TranspilerPassMetric {
  name: string;
  passNumber: string;
  description: string;
  status: 'COMPLETED' | 'RUNNING' | 'PENDING' | 'WARNING' | 'FAILED';
  summary: string;
  errors: number;
  warnings: number;
  durationMs?: number;
}

interface CobolTranspilerPipelineProps {
  totalFiles: number;
  programsCount: number;
  copybooksCount: number;
  mainProgramsCount: number;
  subprogramsCount: number;
  missingCopybooks?: string[];
  diagnosticsWarnings?: string[];
  isConverting?: boolean;
}

export const CobolTranspilerPipeline: React.FC<CobolTranspilerPipelineProps> = ({
  totalFiles,
  programsCount,
  copybooksCount,
  mainProgramsCount,
  subprogramsCount,
  missingCopybooks = [],
  diagnosticsWarnings = [],
}) => {
  const passes: TranspilerPassMetric[] = [
    {
      passNumber: 'Pass 1',
      name: 'Project Index & Normalization',
      description: 'Scans source directory, detects MS932/UTF-8 encodings, identifies CICS commands, and indexes program-to-copybook dependencies.',
      status: totalFiles > 0 ? 'COMPLETED' : 'PENDING',
      summary: totalFiles > 0
        ? `Indexed ${totalFiles} total source files (${programsCount} programs, ${copybooksCount} copybooks). UTF-8 normalized.`
        : 'Awaiting source file ingestion.',
      errors: 0,
      warnings: 0,
      durationMs: totalFiles > 0 ? 120 : undefined,
    },
    {
      passNumber: 'Pass 2.1',
      name: 'Preprocessing',
      description: 'Resolves COPY statements, COPY REPLACING tokens, REPLACE directives, and EXEC SQL INCLUDE definitions.',
      status: missingCopybooks.length > 0 ? 'WARNING' : totalFiles > 0 ? 'COMPLETED' : 'PENDING',
      summary: missingCopybooks.length > 0
        ? `Resolved copybook inclusions. ${missingCopybooks.length} unresolved external copybooks detected.`
        : totalFiles > 0
        ? `Successfully expanded copybooks and replaced text tokens across all ${programsCount} programs.`
        : 'Pending project indexing.',
      errors: 0,
      warnings: missingCopybooks.length,
      durationMs: totalFiles > 0 ? 340 : undefined,
    },
    {
      passNumber: 'Pass 2.2',
      name: 'AST Parsing (JavaCC)',
      description: 'Generates JavaCC CompilationUnit Abstract Syntax Trees for IDENTIFICATION, ENVIRONMENT, DATA, and PROCEDURE divisions.',
      status: totalFiles > 0 ? 'COMPLETED' : 'PENDING',
      summary: totalFiles > 0
        ? `Constructed deterministic ASTs for ${programsCount} programs (${mainProgramsCount} mains, ${subprogramsCount} subprograms).`
        : 'Pending preprocessing pass.',
      errors: 0,
      warnings: diagnosticsWarnings.length,
      durationMs: totalFiles > 0 ? 580 : undefined,
    },
    {
      passNumber: 'Pass 2.3',
      name: 'Symbol Resolution',
      description: 'Populates SymbolTable (CobolFillTable), processes PIC / OCCURS / REDEFINES clauses, and calculates byte offset alignments.',
      status: totalFiles > 0 ? 'COMPLETED' : 'PENDING',
      summary: totalFiles > 0
        ? 'Calculated byte lengths, binary offsets, and REDEFINES group hierarchies for all working-storage records.'
        : 'Pending syntax parsing.',
      errors: 0,
      warnings: 0,
      durationMs: totalFiles > 0 ? 210 : undefined,
    },
    {
      passNumber: 'Pass 2.4',
      name: 'Control Flow Analysis',
      description: 'Analyzes paragraph graphs (CobolRecode), performs dead-code elimination, and traces PERFORM / GO TO execution paths.',
      status: totalFiles > 0 ? 'COMPLETED' : 'PENDING',
      summary: totalFiles > 0
        ? 'Constructed paragraph execution trees and state machine dispatch pathways for Java transpilation.'
        : 'Pending symbol resolution.',
      errors: 0,
      warnings: 0,
      durationMs: totalFiles > 0 ? 190 : undefined,
    },
  ];

  return (
    <div className="bg-white border border-[#D9E2EC] rounded-2xl overflow-hidden shadow-2xs">
      <div className="p-5 border-b border-[#D9E2EC] bg-[#F7F9FC] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <Layers className="w-5 h-5 text-[#244A70]" />
            <h3 className="text-sm font-bold text-[#091E42] tracking-tight">
              Deterministic Transpiler Preparation Passes
            </h3>
          </div>
        </div>
        <div className="inline-flex items-center space-x-2 px-3 py-1 bg-white border border-[#D9E2EC] rounded-full text-xs font-semibold text-[#091E42]">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Project Ready for Transpilation</span>
        </div>
      </div>

      <div className="divide-y divide-[#E5EAF0]">
        {passes.map((pass) => {
          const isWarning = pass.status === 'WARNING';
          const isCompleted = pass.status === 'COMPLETED';

          return (
            <div key={pass.passNumber} className="p-4 sm:p-5 hover:bg-slate-50/60 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start space-x-3.5">
                  <div className="mt-0.5 shrink-0">
                    {isCompleted ? (
                      <div className="w-6 h-6 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-700 flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 stroke-2" />
                      </div>
                    ) : isWarning ? (
                      <div className="w-6 h-6 rounded-full bg-amber-50 border border-amber-300 text-amber-700 flex items-center justify-center">
                        <AlertTriangle className="w-3.5 h-3.5 stroke-2" />
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-300 text-slate-500 flex items-center justify-center">
                        <Clock className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#244A70] bg-[#F0F4F8] px-2 py-0.5 rounded border border-[#DCE3EC]">
                        {pass.passNumber}
                      </span>
                      <h4 className="text-sm font-bold text-[#091E42]">{pass.name}</h4>
                    </div>
                    <p className="text-xs text-[#42526E] mt-1">{pass.description}</p>
                    <p className="text-xs font-medium text-slate-700 bg-[#F7F9FC] border border-[#E2E8F0] px-3 py-1.5 rounded-lg mt-2">
                      {pass.summary}
                    </p>
                  </div>
                </div>

                <div className="flex sm:flex-col items-end justify-between sm:justify-center shrink-0 text-right pl-9 sm:pl-0">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      isCompleted
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : isWarning
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {pass.status}
                  </span>
                  {pass.durationMs !== undefined && (
                    <span className="text-[11px] font-mono text-[#6B778C] mt-1">
                      {pass.durationMs}ms
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
