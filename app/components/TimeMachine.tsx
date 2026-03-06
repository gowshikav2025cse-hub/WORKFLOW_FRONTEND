"use client";

import React, { useState } from "react";
import {
  Clock,
  Play,
  SkipForward,
  RotateCcw,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Loader2,
  Edit3,
  Save,
} from "lucide-react";
import { executionsApi, type Execution, type ExecutionStep } from "../lib/api";

interface TimeMachineProps {
  execution: Execution;
  onReplayComplete?: (newExecution: Execution) => void;
}

export default function TimeMachine({
  execution,
  onReplayComplete,
}: TimeMachineProps) {
  const [selectedStep, setSelectedStep] = useState<number | null>(null);
  const [editingInputs, setEditingInputs] = useState(false);
  const [inputOverride, setInputOverride] = useState("");
  const [replaying, setReplaying] = useState(false);
  const [error, setError] = useState("");

  const steps = execution.steps || [];

  const handleReplay = async (fromIndex: number) => {
    setReplaying(true);
    setError("");
    try {
      let overrideInputs: Record<string, unknown> | undefined;
      if (editingInputs && inputOverride.trim()) {
        try {
          overrideInputs = JSON.parse(inputOverride);
        } catch {
          setError("Invalid JSON for input override");
          setReplaying(false);
          return;
        }
      }
      const newExecution = await executionsApi.replay(
        execution._id,
        fromIndex,
        overrideInputs
      );
      onReplayComplete?.(newExecution);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Replay failed");
    } finally {
      setReplaying(false);
    }
  };

  const stepStatus = (step: ExecutionStep) => {
    if (step.status === "completed") return "completed";
    if (step.status === "failed") return "failed";
    return "skipped";
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-success" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-danger" />;
      default:
        return (
          <div className="h-4 w-4 rounded-full border-2 border-zinc-600" />
        );
    }
  };

  return (
    <div className="rounded-xl border border-card-border bg-card overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3 border-b border-card-border flex items-center gap-2">
        <div className="h-8 w-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
          <Clock className="h-4 w-4 text-violet-400" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-foreground">
            Automation Time Machine
          </h2>
          <p className="text-[11px] text-muted">
            Replay execution from any step &bull; Modify inputs &bull; Debug
            failures
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mx-5 mt-3 rounded-lg bg-danger/10 border border-danger/30 px-3 py-2">
          <p className="text-xs text-danger">{error}</p>
        </div>
      )}

      {/* Timeline */}
      <div className="p-5">
        <div className="relative">
          {steps.map((step, idx) => {
            const status = stepStatus(step);
            const isSelected = selectedStep === idx;

            return (
              <div key={idx} className="relative flex gap-3">
                {/* Line connector */}
                {idx < steps.length - 1 && (
                  <div
                    className={`absolute left-[7px] top-6 w-0.5 h-[calc(100%-8px)] ${
                      status === "completed" ? "bg-success/30" : "bg-zinc-700"
                    }`}
                  />
                )}

                {/* Bullet */}
                <div className="relative z-10 shrink-0 mt-0.5">
                  {statusIcon(status)}
                </div>

                {/* Step card */}
                <button
                  onClick={() =>
                    setSelectedStep(isSelected ? null : idx)
                  }
                  className={`flex-1 mb-3 rounded-lg border text-left transition-all p-3 ${
                    isSelected
                      ? "border-accent/50 bg-accent/5"
                      : "border-card-border bg-background hover:border-zinc-600"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">
                        {step.nodeName}
                      </p>
                      <p className="text-[11px] text-muted truncate">
                        {step.nodeType} &bull;{" "}
                        {step.duration ? `${step.duration}ms` : "—"}
                      </p>
                    </div>
                    <ChevronRight
                      className={`h-3.5 w-3.5 text-muted transition-transform ${
                        isSelected ? "rotate-90" : ""
                      }`}
                    />
                  </div>

                  {/* Expanded detail */}
                  {isSelected && (
                    <div
                      className="mt-3 space-y-3"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Outputs */}
                      {step.output != null && (
                        <div>
                          <p className="text-[10px] uppercase tracking-wide text-muted mb-1">
                            Output
                          </p>
                          <pre className="text-[11px] text-zinc-400 bg-card rounded p-2 overflow-x-auto max-h-32 border border-card-border">
                            {String(JSON.stringify(step.output, null, 2))}
                          </pre>
                        </div>
                      )}

                      {/* Error */}
                      {step.error && (
                        <div>
                          <p className="text-[10px] uppercase tracking-wide text-danger mb-1">
                            Error
                          </p>
                          <p className="text-[11px] text-danger bg-danger/5 rounded p-2 border border-danger/20">
                            {step.error}
                          </p>
                        </div>
                      )}

                      {/* Input override */}
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-[10px] uppercase tracking-wide text-muted">
                            Input Override
                          </p>
                          <button
                            onClick={() => {
                              setEditingInputs(!editingInputs);
                              if (!editingInputs && step.output) {
                                setInputOverride(
                                  JSON.stringify(step.output, null, 2)
                                );
                              }
                            }}
                            className="text-[10px] text-accent-light hover:text-accent flex items-center gap-0.5"
                          >
                            {editingInputs ? (
                              <Save className="h-2.5 w-2.5" />
                            ) : (
                              <Edit3 className="h-2.5 w-2.5" />
                            )}
                            {editingInputs ? "Done" : "Edit"}
                          </button>
                        </div>

                        {editingInputs && (
                          <textarea
                            value={inputOverride}
                            onChange={(e) => setInputOverride(e.target.value)}
                            rows={4}
                            className="w-full rounded border border-card-border bg-card text-[11px] text-foreground p-2 font-mono resize-none focus:outline-none focus:border-accent/50"
                            placeholder='{"key": "value"}'
                          />
                        )}
                      </div>

                      {/* Replay buttons */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleReplay(idx)}
                          disabled={replaying}
                          className="flex items-center gap-1 rounded-lg bg-accent/10 border border-accent/30 px-3 py-1.5 text-[11px] font-medium text-accent-light hover:bg-accent/20 transition-colors disabled:opacity-50"
                        >
                          {replaying ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Play className="h-3 w-3" />
                          )}
                          Replay from here
                        </button>

                        {idx < steps.length - 1 && (
                          <button
                            onClick={() => handleReplay(idx + 1)}
                            disabled={replaying}
                            className="flex items-center gap-1 rounded-lg bg-zinc-700/50 border border-zinc-600 px-3 py-1.5 text-[11px] font-medium text-zinc-300 hover:bg-zinc-700 transition-colors disabled:opacity-50"
                          >
                            <SkipForward className="h-3 w-3" />
                            Skip &amp; continue
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Full replay */}
        <div className="mt-2 pt-3 border-t border-card-border">
          <button
            onClick={() => handleReplay(0)}
            disabled={replaying}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-violet-500/10 border border-violet-500/30 px-4 py-2.5 text-xs font-medium text-violet-400 hover:bg-violet-500/20 transition-colors disabled:opacity-50"
          >
            {replaying ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RotateCcw className="h-3.5 w-3.5" />
            )}
            Replay Entire Execution
          </button>
        </div>
      </div>
    </div>
  );
}
