"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  workflowsApi,
  createDemoFlow,
  createSelfHealingDemo,
  getLinkedInStatus,
  getLinkedInAuthUrl,
  type Workflow,
  type SelfHealingDemoResult,
} from "../lib/api";
import {
  Plus,
  Workflow as WorkflowIcon,
  Search,
  Trash2,
  Play,
  Edit,
  Rocket,
  CheckCircle2,
  AlertCircle,
  Linkedin,
  Clock,
  Calendar,
  X,
  ShieldCheck,
  Loader2,
  XCircle,
  ArrowRight,
  Wrench,
} from "lucide-react";

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [creatingDemo, setCreatingDemo] = useState(false);
  const [creatingSelfHeal, setCreatingSelfHeal] = useState(false);
  const [selfHealResult, setSelfHealResult] = useState<SelfHealingDemoResult | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [linkedInConnected, setLinkedInConnected] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [postContent, setPostContent] = useState("");
  const [contentMode, setContentMode] = useState<"auto" | "custom">("auto");
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    loadWorkflows();
    checkLinkedInStatus();
    // Handle OAuth redirect params
    const success = searchParams.get("success");
    const error = searchParams.get("error");
    const name = searchParams.get("name");
    if (success === "linkedin") {
      showToast("success", `LinkedIn connected${name ? ` as ${name}` : ""}!`);
      setLinkedInConnected(true);
      window.history.replaceState({}, "", "/workflows");
    } else if (error) {
      showToast("error", `LinkedIn error: ${error}`);
      window.history.replaceState({}, "", "/workflows");
    }
  }, [searchParams]);

  function showToast(type: "success" | "error", message: string) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }

  async function checkLinkedInStatus() {
    try {
      const status = await getLinkedInStatus();
      setLinkedInConnected(status.connected);
    } catch {
      // ignore
    }
  }

  async function loadWorkflows() {
    try {
      const data = await workflowsApi.list();
      setWorkflows(data);
    } catch {
      // API not ready
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this workflow?")) return;
    try {
      await workflowsApi.delete(id);
      setWorkflows((prev) => prev.filter((w) => w._id !== id));
    } catch {
      alert("Failed to delete workflow");
    }
  }

  async function handleExecute(id: string) {
    try {
      await workflowsApi.execute(id);
      alert("Workflow executed! Check the monitor for results.");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Execution failed");
    }
  }

  function handleCreateDemo() {
    if (!linkedInConnected) {
      window.location.href = getLinkedInAuthUrl();
      return;
    }
    // Pre-fill date/time with "now + 5 min" rounded to nearest 5 min
    const now = new Date(Date.now() + 5 * 60 * 1000);
    const mins = Math.ceil(now.getMinutes() / 5) * 5;
    now.setMinutes(mins, 0, 0);
    setScheduleDate(now.toISOString().slice(0, 10));
    setScheduleTime(now.toTimeString().slice(0, 5));
    setContentMode("auto");
    setPostContent("");
    setShowScheduleModal(true);
  }

  async function handleScheduleSubmit(mode: "now" | "schedule") {
    setShowScheduleModal(false);
    setCreatingDemo(true);
    try {
      const opts: { scheduledAt?: string; customContent?: string } = {};

      if (contentMode === "custom" && postContent.trim()) {
        opts.customContent = postContent.trim();
      }

      if (mode === "schedule") {
        if (!scheduleDate || !scheduleTime) {
          showToast("error", "Please select both date and time");
          setCreatingDemo(false);
          return;
        }
        const scheduled = new Date(`${scheduleDate}T${scheduleTime}`);
        if (scheduled <= new Date()) {
          showToast("error", "Scheduled time must be in the future");
          setCreatingDemo(false);
          return;
        }
        opts.scheduledAt = scheduled.toISOString();
        const { workflow } = await createDemoFlow(opts);
        showToast("success", `Post scheduled for ${scheduled.toLocaleString()}`);
        router.push(`/builder/${workflow._id}`);
      } else {
        const { workflow } = await createDemoFlow(opts);
        showToast("success", "LinkedIn Agent demo created!");
        router.push(`/builder/${workflow._id}`);
      }
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Failed to create demo");
    } finally {
      setCreatingDemo(false);
    }
  }

  const filtered = workflows.filter(
    (w) =>
      w.name.toLowerCase().includes(search.toLowerCase()) ||
      (w.description || '').toLowerCase().includes(search.toLowerCase())
  );

  async function handleSelfHealDemo() {
    setCreatingSelfHeal(true);
    setSelfHealResult(null);
    try {
      const result = await createSelfHealingDemo();
      setSelfHealResult(result);
      showToast("success", "Self-healing demo completed! See the results below.");
      loadWorkflows();
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Self-healing demo failed");
    } finally {
      setCreatingSelfHeal(false);
    }
  }

  const statusColors: Record<string, string> = {
    draft: "bg-zinc-500/10 text-zinc-400",
    active: "bg-success/10 text-success",
    paused: "bg-warning/10 text-warning",
    archived: "bg-zinc-500/10 text-zinc-500",
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 animate-fade-in">
          <div
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border shadow-lg ${toast.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                : "bg-red-50 border-red-200 text-red-600"
              }`}
          >
            {toast.type === "success" ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <span className="text-xs font-medium">{toast.message}</span>
          </div>
        </div>
      )}

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Linkedin className="h-5 w-5 text-[#0A66C2]" />
                <h2 className="text-lg font-semibold text-gray-900">LinkedIn Agent Demo</h2>
              </div>
              <button onClick={() => setShowScheduleModal(false)} className="text-gray-500 hover:text-gray-900 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content Mode Toggle */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-900 flex items-center gap-2">
                <Edit className="h-4 w-4 text-gray-500" />
                Post Content
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setContentMode("auto")}
                  className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${contentMode === "auto"
                      ? "bg-emerald-50 border-emerald-500 text-emerald-600"
                      : "border-gray-200 text-gray-500 hover:text-gray-900"
                    }`}
                >
                  <Rocket className="h-3.5 w-3.5 inline mr-1.5" />
                  Auto-Generate
                </button>
                <button
                  onClick={() => setContentMode("custom")}
                  className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${contentMode === "custom"
                      ? "bg-emerald-50 border-emerald-500 text-emerald-600"
                      : "border-gray-200 text-gray-500 hover:text-gray-900"
                    }`}
                >
                  <Edit className="h-3.5 w-3.5 inline mr-1.5" />
                  Write Custom
                </button>
              </div>
              {contentMode === "auto" ? (
                <p className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3 border border-gray-200">
                  A random AI/automation-themed post will be generated with a unique timestamp each run.
                </p>
              ) : (
                <textarea
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  placeholder={"Write your LinkedIn post here...\n\nExample:\n🚀 Excited to share my latest automation workflow!\n\n#NoCode #Automation"}
                  rows={5}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
                />
              )}
            </div>

            {/* Schedule Section */}
            <div className="border border-gray-200 rounded-xl p-4 space-y-3">
              <h3 className="text-sm font-medium text-gray-900 flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" />
                Schedule for later
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500 pointer-events-none" />
                    <input
                      type="date"
                      value={scheduleDate}
                      onChange={(e) => setScheduleDate(e.target.value)}
                      min={new Date().toISOString().slice(0, 10)}
                      className="w-full rounded-lg border border-gray-200 bg-gray-50 pl-8 pr-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Time</label>
                  <div className="relative">
                    <Clock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500 pointer-events-none" />
                    <input
                      type="time"
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 bg-gray-50 pl-8 pr-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => handleScheduleSubmit("now")}
                disabled={contentMode === "custom" && !postContent.trim()}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-900 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Play className="h-4 w-4" />
                Post Now
              </button>
              <button
                onClick={() => handleScheduleSubmit("schedule")}
                disabled={contentMode === "custom" && !postContent.trim()}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: '#0A66C2' }}
              >
                <Calendar className="h-4 w-4" />
                Schedule Post
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Workflows</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your automation workflows
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSelfHealDemo}
            disabled={creatingSelfHeal}
            className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-colors disabled:opacity-50"
            style={{ background: '#7c3aed' }}
          >
            {creatingSelfHeal ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ShieldCheck className="h-4 w-4" />
            )}
            {creatingSelfHeal ? "Running..." : "Self-Healing Demo"}
          </button>
          <button
            onClick={handleCreateDemo}
            disabled={creatingDemo}
            className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-colors disabled:opacity-50"
            style={{ background: '#0A66C2' }}
          >
            {creatingDemo ? (
              <Rocket className="h-4 w-4 animate-pulse" />
            ) : (
              <Linkedin className="h-4 w-4" />
            )}
            {linkedInConnected ? "LinkedIn Agent Demo" : "Connect LinkedIn & Demo"}
          </button>
          <Link
            href="/builder"
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Workflow
          </Link>
        </div>
      </div>

      {/* Self-Healing Demo Result */}
      {selfHealResult && (
        <div className="rounded-2xl border border-purple-200 bg-white overflow-hidden animate-fade-in">
          <div className="flex items-center justify-between px-5 py-3 bg-gradient-to-r from-purple-50 to-violet-50 border-b border-purple-100">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-purple-600" />
              <h3 className="text-sm font-bold text-gray-800">Self-Healing Demo Result</h3>
            </div>
            <button onClick={() => setSelfHealResult(null)} className="text-gray-400 hover:text-gray-600"><X className="h-4 w-4" /></button>
          </div>
          <div className="p-5 space-y-4">
            {/* Timeline */}
            <div className="grid grid-cols-3 gap-4">
              {/* Step 1: Failed */}
              <div className="rounded-xl border border-red-200 bg-red-50/50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <XCircle className="h-4 w-4 text-red-500" />
                  <span className="text-xs font-bold text-red-700">Step 1: Initial Run (Failed)</span>
                </div>
                <p className="text-[11px] text-gray-600 mb-2">Workflow executed with field mismatch bug.</p>
                {selfHealResult.failedExecution.steps.map((step, i) => (
                  <div key={i} className="flex items-center gap-2 text-[10px] py-1 border-t border-red-100">
                    {step.status === 'completed' ? <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" /> : <XCircle className="h-3 w-3 text-red-500 shrink-0" />}
                    <span className="text-gray-700 truncate">{step.nodeName}</span>
                    <span className={`ml-auto font-medium ${step.status === 'failed' ? 'text-red-500' : 'text-emerald-500'}`}>{step.status}</span>
                  </div>
                ))}
              </div>
              {/* Step 2: Healed */}
              <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Wrench className="h-4 w-4 text-amber-600" />
                  <span className="text-xs font-bold text-amber-700">Step 2: AI Self-Healing</span>
                </div>
                <p className="text-[11px] text-gray-600 mb-2">Issues detected: {selfHealResult.healingReport.totalIssues}, Auto-fixable: {selfHealResult.healingReport.autoFixable}</p>
                {selfHealResult.appliedFixes.map((fix, i) => (
                  <div key={i} className="flex items-start gap-2 text-[10px] py-1 border-t border-amber-100">
                    <ArrowRight className="h-3 w-3 text-amber-600 shrink-0 mt-0.5" />
                    <span className="text-gray-700">{fix.fix}</span>
                  </div>
                ))}
              </div>
              {/* Step 3: Success */}
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span className="text-xs font-bold text-emerald-700">Step 3: Re-Run (Success)</span>
                </div>
                <p className="text-[11px] text-gray-600 mb-2">Healed workflow executed successfully.</p>
                {selfHealResult.healedExecution.steps.map((step, i) => (
                  <div key={i} className="flex items-center gap-2 text-[10px] py-1 border-t border-emerald-100">
                    {step.status === 'completed' ? <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" /> : <XCircle className="h-3 w-3 text-red-500 shrink-0" />}
                    <span className="text-gray-700 truncate">{step.nodeName}</span>
                    <span className="ml-auto font-medium text-emerald-500">{step.status}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <span className="text-[11px] text-gray-500">Workflow: {selfHealResult.workflow.name}</span>
              <Link href={`/builder/${selfHealResult.workflow._id}`} className="text-xs text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1">
                Open in Builder <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search workflows…"
          className="w-full rounded-lg border border-gray-200 bg-white pl-10 pr-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
        />
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-pulse text-gray-500">Loading…</div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="h-16 w-16 rounded-2xl bg-emerald-50 flex items-center justify-center mb-4">
            <WorkflowIcon className="h-8 w-8 text-emerald-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {workflows.length === 0
              ? "No workflows yet"
              : "No matching workflows"}
          </h3>
          <p className="text-sm text-gray-500 max-w-xs mb-4">
            {workflows.length === 0
              ? "Create your first workflow to start automating tasks."
              : "Try adjusting your search query."}
          </p>
          {workflows.length === 0 && (
            <Link
              href="/builder"
              className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Create Workflow
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((w) => (
            <div
              key={w._id}
              className="rounded-xl border border-gray-200 bg-white p-5 hover:border-gray-400 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <WorkflowIcon className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">
                      {w.name}
                    </h3>
                    <span
                      className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded-full mt-1 capitalize ${statusColors[w.status || 'draft'] || statusColors.draft
                        }`}
                    >
                      {w.status}
                    </span>
                  </div>
                </div>
              </div>

              {w.description && (
                <p className="text-xs text-gray-500 mb-3 line-clamp-2">
                  {w.description}
                </p>
              )}

              <div className="flex items-center gap-4 text-[11px] text-zinc-500 mb-4">
                <span>{w.nodes.length} nodes</span>
                <span>{w.executionCount} runs</span>
                <span>{new Date(w.updatedAt).toLocaleDateString()}</span>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href={`/builder/${w._id}`}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-md bg-gray-50 border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-900 hover:bg-gray-100 transition-colors"
                >
                  <Edit className="h-3 w-3" />
                  Edit
                </Link>
                <button
                  onClick={() => handleExecute(w._id)}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-md bg-success/10 border border-success/30 px-3 py-1.5 text-xs font-medium text-success hover:bg-success/20 transition-colors"
                >
                  <Play className="h-3 w-3" />
                  Run
                </button>
                <button
                  onClick={() => handleDelete(w._id)}
                  className="flex items-center justify-center rounded-md hover:bg-danger/10 border border-transparent hover:border-danger/30 p-1.5 text-zinc-600 hover:text-danger transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
