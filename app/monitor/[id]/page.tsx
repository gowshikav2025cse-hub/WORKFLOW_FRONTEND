"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import {
  executionsApi,
  type Execution,
} from "../../lib/api";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronDown,
  ChevronRight,
  Shield,
  RotateCcw,
} from "lucide-react";
import { getNodeDefinition, categoryColors } from "../../lib/nodeDefinitions";
import SelfHealingPanel from "../../components/SelfHealingPanel";
import TimeMachine from "../../components/TimeMachine";

export default function ExecutionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [execution, setExecution] = useState<Execution | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set());
  const [activeTab, setActiveTab] = useState<"timeline" | "timemachine" | "healing">("timeline");

  useEffect(() => {
    async function load() {
      try {
        const data = await executionsApi.get(id);
        setExecution(data);
        // Expand all steps by default
        setExpandedSteps(new Set((data.steps || []).map((_, i) => i)));
      } catch {
        // not found
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const toggleStep = (idx: number) => {
    setExpandedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-pulse text-muted">Loading execution…</div>
      </div>
    );
  }

  if (!execution) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-danger mb-2">Execution not found</p>
          <Link
            href="/monitor"
            className="text-accent-light text-sm hover:underline"
          >
            Back to monitor
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <Link
          href="/monitor"
          className="p-1.5 rounded-md hover:bg-gray-100 text-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-foreground">
            {execution.workflowName}
          </h1>
          <p className="text-sm text-muted">Execution Details</p>
        </div>
        <div className="flex items-center gap-2">
          {execution.status === "completed" ? (
            <CheckCircle2 className="h-5 w-5 text-success" />
          ) : execution.status === "failed" ? (
            <XCircle className="h-5 w-5 text-danger" />
          ) : (
            <Clock className="h-5 w-5 text-warning" />
          )}
          <span
            className={`text-sm font-semibold capitalize ${
              execution.status === "completed"
                ? "text-success"
                : execution.status === "failed"
                ? "text-danger"
                : "text-warning"
            }`}
          >
            {execution.status}
          </span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <InfoCard label="Total Steps" value={`${(execution.steps || []).length}`} />
        <InfoCard label="Duration" value={execution.duration ? `${execution.duration}ms` : '—'} />
        <InfoCard label="Trigger" value={execution.triggerType || 'manual'} />
        <InfoCard
          label="Started"
          value={new Date(execution.startedAt).toLocaleString()}
        />
      </div>

      {/* Tab Bar */}
      <div className="flex items-center gap-1 rounded-xl border border-card-border bg-card p-1">
        <button
          onClick={() => setActiveTab("timeline")}
          className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-medium transition-colors ${
            activeTab === "timeline"
              ? "bg-emerald-50 text-foreground"
              : "text-muted hover:text-foreground"
          }`}
        >
          <Clock className="h-3.5 w-3.5" />
          Timeline
        </button>
        <button
          onClick={() => setActiveTab("timemachine")}
          className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-medium transition-colors ${
            activeTab === "timemachine"
              ? "bg-emerald-50 text-emerald-700"
              : "text-muted hover:text-foreground"
          }`}
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Time Machine
        </button>
        {execution.status === "failed" && (
          <button
            onClick={() => setActiveTab("healing")}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-medium transition-colors ${
              activeTab === "healing"
                ? "bg-rose-50 text-rose-600"
                : "text-muted hover:text-foreground"
            }`}
          >
            <Shield className="h-3.5 w-3.5" />
            Self-Healing
          </button>
        )}
      </div>

      {/* Time Machine Tab */}
      {activeTab === "timemachine" && (
        <TimeMachine
          execution={execution}
          onReplayComplete={(newExecution) => {
            setExecution(newExecution);
            setActiveTab("timeline");
            setExpandedSteps(new Set((newExecution.steps || []).map((_: unknown, i: number) => i)));
          }}
        />
      )}

      {/* Self-Healing Tab */}
      {activeTab === "healing" && execution.status === "failed" && (
        <SelfHealingPanel
          executionId={execution._id}
          onFixApplied={async () => {
            const updated = await executionsApi.get(id);
            setExecution(updated);
          }}
        />
      )}

      {/* Step Timeline (original) */}
      {activeTab === "timeline" && (
      <div className="rounded-xl border border-card-border bg-card overflow-hidden">
        <div className="px-5 py-3 border-b border-card-border">
          <h2 className="text-sm font-semibold text-foreground">
            Execution Timeline
          </h2>
        </div>

        <div className="divide-y divide-card-border/50">
          {(execution.steps || []).map((step, idx) => {
            const expanded = expandedSteps.has(idx);
            const def = getNodeDefinition(step.nodeType || '');
            const cat = categoryColors[def?.category || "action"] || categoryColors.action;

            return (
                <div key={idx} className="hover:bg-gray-50 transition-colors">
                <button
                  onClick={() => toggleStep(idx)}
                  className="w-full flex items-center gap-3 px-5 py-3 text-left"
                >
                  {/* Step number */}
                  <div className="relative flex flex-col items-center">
                    <div
                      className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${
                        step.status === "completed"
                          ? "bg-success/10 text-success"
                          : step.status === "failed"
                          ? "bg-danger/10 text-danger"
                          : "bg-zinc-100 text-muted"
                      }`}
                    >
                      {step.status === "completed" ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : step.status === "failed" ? (
                        <XCircle className="h-4 w-4" />
                      ) : (
                        idx + 1
                      )}
                    </div>
                  </div>

                  {/* Node info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground truncate">
                        {step.nodeName}
                      </p>
                      <span
                        className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${cat.bg} ${cat.text}`}
                      >
                        {step.nodeType}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted">
                      {step.duration != null ? `${step.duration}ms` : '—'} &middot;{" "}
                      {step.startedAt ? new Date(step.startedAt).toLocaleTimeString() : '—'}
                    </p>
                  </div>

                  {expanded ? (
                    <ChevronDown className="h-4 w-4 text-muted shrink-0" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted shrink-0" />
                  )}
                </button>

                {/* Expanded detail */}
                {expanded && (
                  <div className="px-5 pb-4 ml-11 animate-fade-in">
                    {step.error && (
                      <div className="mb-3 rounded-lg bg-danger/10 border border-danger/30 px-3 py-2">
                        <p className="text-xs text-danger font-medium">
                          Error: {step.error}
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <DataBlock title="Input" data={step.input} />
                      <DataBlock title="Output" data={step.output} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      )}
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-card-border bg-card p-3">
      <p className="text-[11px] text-muted mb-0.5">{label}</p>
      <p className="text-sm font-semibold text-foreground capitalize truncate">
        {value}
      </p>
    </div>
  );
}

function DataBlock({ title, data }: { title: string; data: unknown }) {
  return (
    <div className="rounded-lg border border-card-border bg-background p-3">
      <p className="text-[11px] font-semibold text-muted mb-1.5">{title}</p>
      <pre className="text-[11px] font-mono text-zinc-400 whitespace-pre-wrap break-all max-h-40 overflow-y-auto">
        {data ? JSON.stringify(data, null, 2) : "—"}
      </pre>
    </div>
  );
}
