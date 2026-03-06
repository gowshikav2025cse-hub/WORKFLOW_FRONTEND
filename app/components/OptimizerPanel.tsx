'use client';

import React, { useState, useCallback } from 'react';
import {
  BarChart3, Loader2, X, AlertCircle, CheckCircle2,
  AlertTriangle, Info, TrendingUp, Lightbulb, Zap, RefreshCw
} from 'lucide-react';
import { optimizeWorkflow } from '../lib/api';
import type { OptimizationReport } from '../lib/api';

// ─── Props ────────────────────────────────────────────────────────────────────
interface OptimizerPanelProps {
  workflowId: string;
  onClose: () => void;
}

// ─── Score Ring ───────────────────────────────────────────────────────────────
function ScoreRing({ score }: { score: number }) {
  const pct = Math.min(100, Math.max(0, score));
  const radius = 28;
  const circ = 2 * Math.PI * radius;
  const dash = (pct / 100) * circ;
  const color = pct >= 80 ? '#10b981' : pct >= 60 ? '#f59e0b' : '#f43f5e';
  const label = pct >= 80 ? 'Great' : pct >= 60 ? 'Good' : 'Needs work';

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="72" height="72" className="-rotate-90">
        {/* Track */}
        <circle cx="36" cy="36" r={radius} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="6" />
        {/* Progress */}
        <circle
          cx="36" cy="36" r={radius}
          fill="none" stroke={color} strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          style={{ transition: 'stroke-dasharray 0.8s ease' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center" style={{ marginTop: -72 }}>
        {/* overlay text via relative positioning the parent div */}
      </div>
      {/* Centered numbers using grid */}
      <div className="relative" style={{ marginTop: -70 }}>
        <div className="w-[72px] flex flex-col items-center justify-center" style={{ height: 72 }}>
          <span className="text-lg font-bold text-white" style={{ color }}>{pct}</span>
        </div>
      </div>
      <p className="text-[10px] text-gray-500 -mt-1">{label}</p>
    </div>
  );
}

// ─── Suggestion Card ──────────────────────────────────────────────────────────
function SuggestionItem({ s }: { s: OptimizationReport['suggestions'][number] }) {
  const conf: Record<string, { icon: React.ReactNode; colors: string }> = {
    error:       { icon: <AlertCircle className="w-3.5 h-3.5 shrink-0" />, colors: 'border-rose-200 bg-rose-50 text-rose-600' },
    warning:     { icon: <AlertTriangle className="w-3.5 h-3.5 shrink-0" />, colors: 'border-amber-200 bg-amber-50 text-amber-600' },
    improvement: { icon: <Lightbulb className="w-3.5 h-3.5 shrink-0" />, colors: 'border-emerald-200 bg-emerald-50 text-emerald-600' },
    info:        { icon: <Info className="w-3.5 h-3.5 shrink-0" />, colors: 'border-sky-200 bg-sky-50 text-sky-600' },
  };
  const style = conf[s.type] ?? conf.info;
  const priorityBadge: Record<string, string> = {
    high: 'text-rose-600 bg-rose-50',
    medium: 'text-amber-600 bg-amber-50',
    low: 'text-sky-600 bg-sky-50',
  };

  return (
    <div className={`rounded-lg border p-3 ${style.colors}`}>
      <div className="flex items-start gap-2">
        <span className="mt-0.5">{style.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-[11px] font-semibold text-gray-800">{s.title}</p>
            <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold capitalize ${priorityBadge[s.priority] ?? priorityBadge.low}`}>
              {s.priority}
            </span>
          </div>
          <p className="text-[10px] text-gray-600 leading-relaxed">{s.description}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function OptimizerPanel({ workflowId, onClose }: OptimizerPanelProps) {
  const [report, setReport] = useState<OptimizationReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const runOptimize = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const r = await optimizeWorkflow(workflowId);
      setReport(r);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Optimization failed');
    } finally {
      setLoading(false);
    }
  }, [workflowId]);

  // Auto-run on mount
  React.useEffect(() => { runOptimize(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const grouped = report ? {
    error:       report.suggestions.filter(s => s.type === 'error'),
    warning:     report.suggestions.filter(s => s.type === 'warning'),
    improvement: report.suggestions.filter(s => s.type === 'improvement'),
    info:        report.suggestions.filter(s => s.type === 'info'),
  } : null;

  return (
    <div className="w-80 flex-shrink-0 flex flex-col h-full bg-white border-l border-gray-200 animate-slide-right">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
            <BarChart3 className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-[12px] font-semibold text-gray-800">Optimizer</h3>
            <p className="text-[9px] text-gray-400">Workflow health analysis</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={runOptimize}
            disabled={loading}
            title="Re-run analysis"
            className="w-6 h-6 rounded flex items-center justify-center hover:bg-gray-100 text-gray-400 hover:text-gray-600 disabled:opacity-40 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={onClose}
            className="w-6 h-6 rounded flex items-center justify-center hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-200">
        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center gap-3 py-8">
            <Loader2 className="w-7 h-7 animate-spin text-emerald-500" />
            <p className="text-[11px] text-gray-500">Analyzing workflow…</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="p-3 rounded-lg border border-rose-500/20 bg-rose-500/5 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-rose-300">{error}</p>
          </div>
        )}

        {/* Report */}
        {!loading && report && (
          <>
            {/* Score */}
            <div className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 bg-gray-50">
              <ScoreRing score={report.score} />
              <div className="space-y-1.5">
                <p className="text-[11px] font-semibold text-gray-700">Workflow Score</p>
                <div className="flex items-center gap-3 text-[10px] text-gray-500">
                  <span className="flex items-center gap-1">
                    <Zap className="w-2.5 h-2.5" />
                    {report.nodeCount} nodes
                  </span>
                  <span className="flex items-center gap-1">
                    <TrendingUp className="w-2.5 h-2.5" />
                    {report.edgeCount} edges
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[10px]">
                  {report.suggestions.filter(s => s.type === 'error').length > 0 ? (
                    <AlertCircle className="w-3 h-3 text-rose-400" />
                  ) : (
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  )}
                  <span className={report.suggestions.filter(s => s.type === 'error').length > 0 ? 'text-rose-300' : 'text-emerald-300'}>
                    {report.suggestions.filter(s => s.type === 'error').length > 0
                      ? `${report.suggestions.filter(s => s.type === 'error').length} error(s) found`
                      : 'No critical errors'}
                  </span>
                </div>
              </div>
            </div>

            {/* Suggestions by type */}
            {report.suggestions.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-4 text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                <p className="text-[12px] font-semibold text-emerald-600">Workflow looks great!</p>
                <p className="text-[10px] text-gray-400">No issues or improvements found.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">
                  Suggestions ({report.suggestions.length})
                </p>
                {/* Errors first, then warnings, then improvements, then info */}
                {(['error', 'warning', 'improvement', 'info'] as const).map(type =>
                  grouped?.[type].map((s, i) => (
                    <SuggestionItem key={`${type}-${i}`} s={s} />
                  ))
                )}
              </div>
            )}
          </>
        )}

        {/* Empty state (no report, no loading, no error) */}
        {!loading && !report && !error && (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-emerald-400/50" />
            </div>
            <p className="text-[11px] text-gray-400">Click analyze to check your workflow</p>
          </div>
        )}
      </div>
    </div>
  );
}
