"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getWorkflowTemplates,
  createFromTemplate,
  runTemplate,
  type WorkflowTemplate,
  type Execution,
} from "../lib/api";
import {
  Sparkles,
  Cloud,
  Quote,
  MapPin,
  Linkedin,
  Users,
  Languages,
  Calendar,
  Code,
  Mail,
  Search,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Zap,
  Globe,
  Brain,
  Play,
  Loader2,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

const iconMap: Record<string, React.ElementType> = {
  Sparkles,
  Cloud,
  Quote,
  MapPin,
  Linkedin,
  Users,
  Languages,
  Calendar,
  Code,
  Mail,
  Globe,
  Brain,
  Zap,
};

const categoryIcons: Record<string, React.ElementType> = {
  "AI & Content": Brain,
  "AI & Social": Linkedin,
  "AI & Dev": Code,
  "Free APIs": Globe,
};

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState<string | null>(null);
  const [running, setRunning] = useState<string | null>(null);
  const [executionOutput, setExecutionOutput] = useState<{ templateId: string; execution: Execution } | null>(null);
  const [expandedStep, setExpandedStep] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const router = useRouter();

  useEffect(() => {
    loadTemplates();
  }, []);

  async function loadTemplates() {
    try {
      const data = await getWorkflowTemplates();
      setTemplates(data);
    } catch {
      // API not ready
    } finally {
      setLoading(false);
    }
  }

  function showToast(type: "success" | "error", message: string) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }

  async function handleUseTemplate(id: string) {
    setCreating(id);
    try {
      const { workflow } = await createFromTemplate(id);
      showToast("success", "Workflow created from template!");
      router.push(`/builder/${workflow._id}`);
    } catch (err) {
      showToast(
        "error",
        err instanceof Error ? err.message : "Failed to create workflow"
      );
    } finally {
      setCreating(null);
    }
  }

  async function handleRunTemplate(id: string) {
    setRunning(id);
    setExecutionOutput(null);
    setExpandedStep(null);
    try {
      const { execution } = await runTemplate(id);
      setExecutionOutput({ templateId: id, execution });
      showToast("success", "Template executed successfully!");
    } catch (err) {
      showToast(
        "error",
        err instanceof Error ? err.message : "Failed to execute template"
      );
    } finally {
      setRunning(null);
    }
  }

  const categories = [
    "all",
    ...Array.from(new Set(templates.map((t) => t.category))),
  ];

  const filtered = templates.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase()) ||
      t.tags.some((tag) => tag.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory =
      activeCategory === "all" || t.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 animate-fade-in">
          <div
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border shadow-lg ${
              toast.type === "success"
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

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Workflow Templates
        </h1>
        <p className="text-sm text-muted mt-1">
          Pre-built, ready-to-run workflows. Click &quot;Use Template&quot; to
          create and customize.
        </p>
      </div>

      {/* Search + Category Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search templates…"
            className="w-full rounded-lg border border-card-border bg-card pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {categories.map((cat) => {
            const CatIcon = cat !== "all" ? categoryIcons[cat] : Zap;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                  activeCategory === cat
                    ? "bg-accent/10 border-accent text-accent"
                    : "border-card-border text-muted hover:text-foreground hover:border-gray-300"
                }`}
              >
                {CatIcon && <CatIcon className="h-3.5 w-3.5" />}
                {cat === "all" ? "All" : cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-20">
          <Sparkles className="h-8 w-8 text-accent mx-auto animate-pulse" />
          <p className="text-sm text-muted mt-3">Loading templates…</p>
        </div>
      )}

      {/* Template Grid */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((tmpl) => {
            const Icon = iconMap[tmpl.icon] || Sparkles;
            const isCreating = creating === tmpl.id;
            return (
              <div
                key={tmpl.id}
                className="group bg-card border border-card-border rounded-xl p-5 hover:shadow-lg hover:border-gray-300 transition-all duration-200 flex flex-col"
              >
                {/* Top row: icon + category */}
                <div className="flex items-start justify-between mb-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${tmpl.color}15` }}
                  >
                    <Icon
                      className="h-5 w-5"
                      style={{ color: tmpl.color }}
                    />
                  </div>
                  <span
                    className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: `${tmpl.color}12`,
                      color: tmpl.color,
                    }}
                  >
                    {tmpl.category}
                  </span>
                </div>

                {/* Title + Description */}
                <h3 className="text-sm font-semibold text-foreground mb-1">
                  {tmpl.name}
                </h3>
                <p className="text-xs text-muted leading-relaxed mb-3 flex-1">
                  {tmpl.description}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {tmpl.tags.slice(0, 4).map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                  {tmpl.tags.length > 4 && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-400 font-medium">
                      +{tmpl.tags.length - 4}
                    </span>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleRunTemplate(tmpl.id)}
                    disabled={isCreating || running === tmpl.id}
                    className="flex-1 flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-xs font-medium text-white transition-all disabled:opacity-50 group-hover:shadow-md bg-emerald-600 hover:bg-emerald-700"
                  >
                    {running === tmpl.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Play className="h-3.5 w-3.5" />
                    )}
                    {running === tmpl.id ? "Running…" : "Run & Output"}
                  </button>
                  <button
                    onClick={() => handleUseTemplate(tmpl.id)}
                    disabled={isCreating || running === tmpl.id}
                    className="flex-1 flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-xs font-medium text-white transition-all disabled:opacity-50 group-hover:shadow-md"
                    style={{ backgroundColor: tmpl.color }}
                  >
                    {isCreating ? (
                      <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                    ) : (
                      <ArrowRight className="h-3.5 w-3.5" />
                    )}
                    {isCreating ? "Creating…" : "Use Template"}
                  </button>
                </div>

                {/* Inline Execution Output */}
                {executionOutput && executionOutput.templateId === tmpl.id && (
                  <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50/50 overflow-hidden">
                    <div className="flex items-center justify-between px-3 py-2 border-b border-emerald-100 bg-emerald-50">
                      <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
                        <CheckCircle2 className="h-3 w-3" />
                        Execution Output
                        <span className={`ml-1 px-1.5 py-0.5 rounded text-[9px] ${executionOutput.execution.status === "completed" ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"}`}>
                          {executionOutput.execution.status}
                        </span>
                      </span>
                      <button onClick={() => setExecutionOutput(null)} className="text-gray-400 hover:text-gray-600">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="p-2 space-y-1 max-h-80 overflow-y-auto">
                      {executionOutput.execution.steps?.map((step, idx) => (
                        <div key={idx} className="rounded border border-gray-100 bg-white">
                          <button
                            onClick={() => setExpandedStep(expandedStep === idx ? null : idx)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-left"
                          >
                            <div className={`w-1.5 h-1.5 rounded-full ${step.status === "completed" ? "bg-emerald-500" : step.status === "failed" ? "bg-red-500" : "bg-gray-300"}`} />
                            <span className="text-[11px] font-medium text-gray-700 flex-1">{step.nodeName || step.nodeId}</span>
                            <span className="text-[9px] text-gray-400">{step.nodeType}</span>
                            {expandedStep === idx ? <ChevronUp className="h-3 w-3 text-gray-400" /> : <ChevronDown className="h-3 w-3 text-gray-400" />}
                          </button>
                          {expandedStep === idx && (
                            <div className="px-3 pb-2 border-t border-gray-50">
                              {step.output != null && (
                                <div className="mt-2">
                                  <p className="text-[9px] font-bold text-gray-400 uppercase mb-1">Output</p>
                                  <pre className="text-[10px] text-gray-600 bg-gray-50 rounded p-2 overflow-x-auto max-h-40 whitespace-pre-wrap">
                                    {typeof step.output === "string" ? step.output : JSON.stringify(step.output, null, 2)}
                                  </pre>
                                </div>
                              )}
                              {step.error && (
                                <div className="mt-2">
                                  <p className="text-[9px] font-bold text-red-400 uppercase mb-1">Error</p>
                                  <pre className="text-[10px] text-red-600 bg-red-50 rounded p-2">{String(step.error)}</pre>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <div className="text-center py-20 border border-dashed border-card-border rounded-xl">
          <Search className="h-8 w-8 text-muted mx-auto mb-3" />
          <p className="text-sm text-muted">
            No templates match your search.
          </p>
        </div>
      )}
    </div>
  );
}
