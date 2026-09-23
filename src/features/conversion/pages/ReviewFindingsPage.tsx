import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AlertTriangle, Check, X, Sliders, ArrowRight, Download, CheckCircle2 } from 'lucide-react';
import { ROUTES } from '@/shared/constants/routes';
import { Button } from '@/shared/ui/Button';
import { ModernizationWorkflow } from '@/shared/ui/ModernizationWorkflow';
import { conversionService } from '../services/conversion.service';
import { useConversionJob } from '../queries/useConversionJob';

import { projectService } from '@/features/projects/services/project.service';
import type { Project } from '@/features/projects/types/project';
import type { LegacyScreen } from '@/features/screens/types/screen';

export const ReviewFindingsPage: React.FC = () => {
  const { projectId = 'proj-acme', screenId = 'scr-login' } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [screen, setScreen] = useState<LegacyScreen | null>(null);
  const [findings, setFindings] = useState<any[]>([]);
  const [selectedFindingId, setSelectedFindingId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const { data: job } = useConversionJob(projectId, screenId);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      projectService.getProjectById(projectId),
      conversionService.getScreenById(screenId),
    ]).then(([projData, screenData]) => {
      if (cancelled) return;
      setProject(projData);
      setScreen(screenData);
    });
    return () => {
      cancelled = true;
    };
  }, [projectId, screenId]);

  useEffect(() => {
    let cancelled = false;
    if (job?.id) {
      setLoading(true);
      conversionService.getValidation(projectId, screenId, job.id).then((res) => {
        if (cancelled) return;
        setFindings(res.findings || []);
        if (res.findings?.[0]) setSelectedFindingId(res.findings[0].id);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
    return () => {
      cancelled = true;
    };
  }, [projectId, screenId, job?.id]);

  const handleAcceptFinding = async (findingId: string) => {
    await conversionService.acceptFinding(findingId);
    setFindings((prev) =>
      prev.map((f) => (f.id === findingId ? { ...f, status: 'CONFIRMED' } : f)),
    );
  };

  const handleRejectFinding = async (findingId: string) => {
    await conversionService.rejectFinding(findingId);
    setFindings((prev) =>
      prev.map((f) => (f.id === findingId ? { ...f, status: 'REJECTED' } : f)),
    );
  };

  const resolvedCount = findings.filter((f) => f.status !== 'OPEN').length;
  const totalCount = findings.length || 1;

  return (
    <div className="flex flex-col min-h-[calc(100vh-5rem)] pb-24 space-y-6 bg-slate-50/30">

      {/* Modernization Workflow Step Bar */}
      <ModernizationWorkflow
        currentStep="validation"
        completedSteps={['upload', 'conversion']}
        onStepClick={(stepId) => {
          if (stepId === 'upload') navigate(ROUTES.PROJECTS.UPLOAD(projectId));
          if (stepId === 'conversion') navigate(ROUTES.PROJECTS.CONVERT(projectId, screenId));
          if (stepId === 'result') navigate(ROUTES.PROJECTS.RESULT(projectId, screenId));
          if (stepId === 'export') navigate(ROUTES.PROJECTS.EXPORT(projectId));
        }}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Validation & Human Review</h1>
            <span className="bg-amber-50 text-amber-700 border border-amber-200 text-xs px-3 py-1 rounded-full font-semibold flex items-center space-x-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span>Human Review Required</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Review rule-based findings. Accept valid findings, reject false positives, or correct mappings to re-convert.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={() => navigate(ROUTES.PROJECTS.MAPPING(projectId, screenId))}
            className="space-x-1.5 text-xs font-semibold"
          >
            <Sliders className="w-4 h-4 text-brand-600" />
            <span>Edit Mapping & Re-convert</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
        {/* Left Column: Finding Details & Code Context */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 space-y-4 shadow-sm">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">Validation Finding Summary</h3>
            <span className="text-xs font-semibold text-slate-500">
              {resolvedCount} of {totalCount} reviewed
            </span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-slate-500">Loading validation findings…</div>
          ) : findings.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 flex flex-col items-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              <p className="font-semibold text-slate-900">No open findings detected!</p>
              <p>The generated code matches legacy field rules deterministically.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {findings.map((f) => (
                <div
                  key={f.id}
                  onClick={() => setSelectedFindingId(f.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer space-y-3 ${
                    f.id === selectedFindingId
                      ? 'bg-amber-50/60 border-amber-300 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-700">
                        {f.severity}
                      </span>
                      <span className="font-mono text-xs font-bold text-slate-900">{f.issueType}</span>
                    </div>
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                        f.status === 'CONFIRMED'
                          ? 'bg-amber-100 text-amber-800'
                          : f.status === 'REJECTED'
                          ? 'bg-slate-100 text-slate-600'
                          : f.status === 'RESOLVED'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {f.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <div>
                      <span className="text-slate-500 text-[10px] uppercase font-bold block">Source Location</span>
                      <span className="text-slate-900 font-bold">{f.sourceLocation}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] uppercase font-bold block">Target Component</span>
                      <span className="text-brand-700 font-bold">{f.targetLocation}</span>
                    </div>
                  </div>

                  <div className="text-xs space-y-1 text-slate-700">
                    <p><strong className="text-slate-900">Expected:</strong> {f.expectedBehavior}</p>
                    <p><strong className="text-slate-900">Actual:</strong> {f.actualBehavior}</p>
                    <p className="text-slate-500 mt-1">{f.explanation}</p>
                  </div>

                  {f.suggestion && (
                    <div className="bg-brand-50 p-2.5 rounded-lg border border-brand-200 text-xs text-brand-800 font-medium">
                      💡 <strong>Action:</strong> {f.suggestion}
                    </div>
                  )}

                  <div className="flex items-center space-x-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAcceptFinding(f.id);
                      }}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg flex items-center space-x-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Accept Finding</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRejectFinding(f.id);
                      }}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg flex items-center space-x-1"
                    >
                      <X className="w-3.5 h-3.5 text-slate-500" />
                      <span>Reject (False Positive)</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(ROUTES.PROJECTS.MAPPING(projectId, screenId));
                      }}
                      className="px-3 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-200 font-semibold text-xs rounded-lg flex items-center space-x-1 ml-auto"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      <span>Correct Mapping</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Code Context & Workflow Guide */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-4 shadow-sm flex flex-col">
          <h3 className="text-sm font-bold text-slate-900">Review Decision & Action</h3>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-3">
            <p className="font-bold text-slate-900">How to handle findings:</p>
            <ul className="list-disc pl-4 space-y-1.5 text-slate-600">
              <li><strong>Accept Finding:</strong> Confirms the issue is real and requires correction.</li>
              <li><strong>Reject Finding:</strong> Marks finding as a false positive (no code change required).</li>
              <li><strong>Correct Mapping & Re-convert:</strong> Opens the Mapping Editor to change field components, then re-converts to version v2.</li>
            </ul>
          </div>

          <div className="mt-auto pt-4 border-t border-slate-100 space-y-3">
            <Button
              onClick={() => navigate(ROUTES.PROJECTS.MAPPING(projectId, screenId))}
              className="w-full space-x-2 text-xs font-bold bg-[#0652CC] hover:bg-[#0655FF] text-white py-2.5"
            >
              <Sliders className="w-4 h-4" />
              <span>Correct Mapping & Re-convert (Step 4 &rarr; Step 5)</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate(ROUTES.PROJECTS.EXPORT(projectId))}
              className="w-full space-x-2 text-xs font-semibold"
            >
              <span>Finalize & Export Package (.zip)</span>
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 px-6 py-4 shadow-2xl">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3 text-xs font-semibold text-slate-700">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{resolvedCount} of {totalCount} findings reviewed</span>
          </div>

          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={() => navigate(ROUTES.PROJECTS.MAPPING(projectId, screenId))}
              className="space-x-1.5 text-xs font-semibold"
            >
              <Sliders className="w-3.5 h-3.5 text-brand-600" />
              <span>Correct Mapping & Re-convert</span>
            </Button>
            <Button
              onClick={() => navigate(ROUTES.PROJECTS.EXPORT(projectId))}
              className="space-x-1.5 text-xs font-bold bg-[#0652CC] hover:bg-[#0655FF] text-white"
            >
              <span>Finalize & Export (.zip)</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewFindingsPage;
