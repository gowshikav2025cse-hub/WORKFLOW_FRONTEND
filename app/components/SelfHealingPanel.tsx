"use client";

import React, { useState } from "react";
import {
  Shield,
  Wrench,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Zap,
  ArrowRight,
  XCircle,
} from "lucide-react";
import {
  executionsApi,
  type SelfHealingReport,
  type SelfHealingSuggestion,
} from "../lib/api";

interface SelfHealingPanelProps {
  executionId: string;
  onFixApplied?: () => void;
}

export default function SelfHealingPanel({
  executionId,
  onFixApplied,
}: SelfHealingPanelProps) {
  const [report, setReport] = useState<SelfHealingReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState<string | null>(null);
  const [appliedFixes, setAppliedFixes] = useState<Set<string>>(new Set());
  const [error, setError] = useState("");

  const handleAnalyze = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await executionsApi.heal(executionId);
      setReport(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFix = async (nodeId: string, fixIndex: number) => {
    const fixKey = `${nodeId}-${fixIndex}`;
    setApplying(fixKey);
    try {
      await executionsApi.applyFix(executionId, nodeId, fixIndex);
      setAppliedFixes((prev) => new Set(prev).add(fixKey));
      onFixApplied?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to apply fix");
    } finally {
      setApplying(null);
    }
  };

  const severityColors: Record<string, string> = {
    critical: "bg-red-500/10 text-red-400 border-red-500/30",
    high: "bg-orange-500/10 text-orange-400 border-orange-500/30",
    medium: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    low: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  };

  return (
    <div className="rounded-xl border border-card-border bg-card overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3 border-b border-card-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-rose-500/10 flex items-center justify-center">
            <Shield className="h-4 w-4 text-rose-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              Self-Healing AI
            </h2>
            <p className="text-[11px] text-muted">
              Automatically detect and repair workflow failures
            </p>
          </div>
        </div>
        {!report && (
          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg bg-rose-500/10 border border-rose-500/30 px-3 py-1.5 text-xs font-medium text-rose-400 hover:bg-rose-500/20 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Zap className="h-3.5 w-3.5" />
            )}
            {loading ? "Analyzing..." : "Diagnose & Heal"}
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mx-5 mt-3 rounded-lg bg-danger/10 border border-danger/30 px-3 py-2">
          <p className="text-xs text-danger">{error}</p>
        </div>
      )}

      {/* Report */}
      {report && (
        <div className="p-5 space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-card-border bg-background p-3 text-center">
              <p className="text-lg font-bold text-foreground">
                {report.totalIssues}
              </p>
              <p className="text-[11px] text-muted">Issues Found</p>
            </div>
            <div className="rounded-lg border border-card-border bg-background p-3 text-center">
              <p className="text-lg font-bold text-success">
                {report.autoFixable}
              </p>
              <p className="text-[11px] text-muted">Auto-Fixable</p>
            </div>
            <div className="rounded-lg border border-card-border bg-background p-3 text-center">
              <p className="text-lg font-bold text-foreground">
                {report.steps.length}
              </p>
              <p className="text-[11px] text-muted">Failed Steps</p>
            </div>
          </div>

          {report.totalIssues === 0 && (
            <div className="flex items-center gap-2 rounded-lg bg-success/10 border border-success/30 px-4 py-3">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <p className="text-sm text-success font-medium">
                No fixable issues detected. The failures may require manual
                investigation.
              </p>
            </div>
          )}

          {/* Per-step suggestions */}
          {report.steps.map((stepAnalysis) => (
            <div
              key={stepAnalysis.nodeId}
              className="rounded-lg border border-card-border bg-background overflow-hidden"
            >
              <div className="px-4 py-2.5 border-b border-card-border flex items-center gap-2">
                <XCircle className="h-4 w-4 text-danger" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {stepAnalysis.nodeName}
                  </p>
                  <p className="text-[11px] text-danger truncate">
                    {stepAnalysis.error}
                  </p>
                </div>
                {stepAnalysis.healable && (
                  <span className="shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full bg-success/10 text-success">
                    Auto-fixable
                  </span>
                )}
              </div>

              <div className="p-3 space-y-2">
                {stepAnalysis.suggestions.map(
                  (suggestion: SelfHealingSuggestion, sIdx: number) => (
                    <div key={sIdx} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-3.5 w-3.5 text-warning shrink-0" />
                        <p className="text-xs font-medium text-foreground">
                          {suggestion.title}
                        </p>
                        <span
                          className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${
                            severityColors[suggestion.severity] || severityColors.low
                          }`}
                        >
                          {suggestion.severity}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted ml-5">
                        {suggestion.description}
                      </p>

                      {/* Fixes */}
                      <div className="ml-5 space-y-1.5">
                        {suggestion.fixes.map((fix, fIdx) => {
                          const globalFixIdx =
                            stepAnalysis.suggestions
                              .slice(0, sIdx)
                              .reduce((s, sg) => s + sg.fixes.length, 0) + fIdx;
                          const fixKey = `${stepAnalysis.nodeId}-${globalFixIdx}`;
                          const isApplied = appliedFixes.has(fixKey);
                          const isApplying = applying === fixKey;

                          return (
                            <div
                              key={fIdx}
                              className="flex items-center gap-2 rounded-md bg-card px-3 py-2 border border-card-border"
                            >
                              <Wrench className="h-3 w-3 text-muted shrink-0" />
                              <p className="text-[11px] text-zinc-400 flex-1">
                                {fix.description}
                              </p>
                              {fix.confidence && (
                                <span className="text-[10px] text-muted shrink-0">
                                  {fix.confidence}%
                                </span>
                              )}
                              {suggestion.autoFixable && (
                                <button
                                  onClick={() =>
                                    handleApplyFix(
                                      stepAnalysis.nodeId,
                                      globalFixIdx
                                    )
                                  }
                                  disabled={isApplied || isApplying}
                                  className={`shrink-0 flex items-center gap-1 rounded px-2 py-1 text-[10px] font-medium transition-colors ${
                                    isApplied
                                      ? "bg-success/10 text-success"
                                      : "bg-accent/10 text-accent-light hover:bg-accent/20 border border-accent/30"
                                  }`}
                                >
                                  {isApplying ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : isApplied ? (
                                    <CheckCircle2 className="h-3 w-3" />
                                  ) : (
                                    <ArrowRight className="h-3 w-3" />
                                  )}
                                  {isApplied ? "Applied" : "Auto Fix"}
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          ))}

          {/* Reset */}
          <button
            onClick={() => {
              setReport(null);
              setAppliedFixes(new Set());
            }}
            className="w-full text-center text-[12px] text-muted hover:text-foreground transition-colors py-1"
          >
            Re-analyze
          </button>
        </div>
      )}
    </div>
  );
}
