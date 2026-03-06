"use client";

import React, { useEffect, useState } from "react";
import {
  BookOpen, Cpu, Zap, GitBranch, Shield, Brain, Globe, Layers, ArrowRight,
  CheckCircle2, XCircle, Minus, Activity, Clock, Server, Database, Code,
  Sparkles, BarChart3, Users, Lock, Rocket, TrendingUp,
} from "lucide-react";
import { getSystemStats, getWorkflows, getExecutions, type SystemStats } from "../lib/api";

// ── Tab definitions ──
const tabs = [
  { id: "overview", label: "Overview", icon: BookOpen },
  { id: "architecture", label: "Architecture", icon: Layers },
  { id: "features", label: "Features", icon: Sparkles },
  { id: "comparison", label: "Comparison", icon: BarChart3 },
  { id: "system", label: "System Stats", icon: Cpu },
  { id: "roadmap", label: "Roadmap", icon: Rocket },
];

// ── Feature data ──
const featureCategories = [
  {
    title: "Core Engine",
    icon: Zap,
    color: "#10b981",
    features: [
      { name: "Visual Workflow Builder", desc: "Drag-and-drop canvas with React Flow", status: "done" },
      { name: "70+ Node Executors", desc: "Real API integrations — Gmail, Slack, Stripe, etc.", status: "done" },
      { name: "Conditional Branching", desc: "If/else, switch, filters with template variables", status: "done" },
      { name: "Webhook Triggers", desc: "Receive HTTP webhooks with auth & method filtering", status: "done" },
      { name: "Schedule Triggers", desc: "Cron-based scheduling with timezone support", status: "done" },
      { name: "Manual Triggers", desc: "One-click execution from the UI", status: "done" },
    ],
  },
  {
    title: "AI & Intelligence",
    icon: Brain,
    color: "#8b5cf6",
    features: [
      { name: "Prompt-to-Workflow", desc: "Describe in English → AI builds the workflow", status: "done" },
      { name: "Live NL Builder", desc: "Real-time preview as you type descriptions", status: "done" },
      { name: "AI Workflow Optimizer", desc: "Analyzes workflows and suggests improvements", status: "done" },
      { name: "Self-Healing Engine", desc: "Detects failures, suggests & auto-applies fixes", status: "done" },
      { name: "OpenRouter AI Nodes", desc: "LLM completion via OpenRouter with free models", status: "done" },
      { name: "Smart Template Matching", desc: "NLP-based service detection from descriptions", status: "done" },
    ],
  },
  {
    title: "Execution & Monitoring",
    icon: Activity,
    color: "#f59e0b",
    features: [
      { name: "Real-time Execution Logs", desc: "Step-by-step output with expandable details", status: "done" },
      { name: "Execution Timeline", desc: "Visual timeline with duration per step", status: "done" },
      { name: "Time Machine", desc: "Replay executions from any step with overrides", status: "done" },
      { name: "Status Visualization", desc: "Green/red node borders & edge colors post-run", status: "done" },
      { name: "Execution History", desc: "Full history with search and filtering", status: "done" },
      { name: "RAM & System Monitoring", desc: "Live system resource utilization display", status: "done" },
    ],
  },
  {
    title: "Templates & Integrations",
    icon: Globe,
    color: "#0ea5e9",
    features: [
      { name: "10 Working Templates", desc: "Pre-built workflows using OpenRouter & free APIs", status: "done" },
      { name: "LinkedIn Agent", desc: "Auto-generate & post to LinkedIn with scheduling", status: "done" },
      { name: "100+ Integrations", desc: "Gmail, Slack, Notion, Stripe, GitHub, Shopify, etc.", status: "done" },
      { name: "Free API Templates", desc: "Weather, quotes, IP lookup, holidays — no API key", status: "done" },
      { name: "Template Execute & Output", desc: "Execute templates and view real output in-page", status: "done" },
      { name: "OAuth Integrations", desc: "LinkedIn OAuth flow with token management", status: "done" },
    ],
  },
];

// ── Comparison data ──
const competitors = ["FlowCraft", "Zapier", "Make", "n8n", "Power Automate"];
const comparisonRows = [
  { feature: "Open Source / Self-hosted", values: ["check", "x", "x", "check", "x"] },
  { feature: "AI Prompt-to-Workflow", values: ["check", "x", "x", "x", "x"] },
  { feature: "Self-Healing Engine", values: ["check", "x", "x", "x", "x"] },
  { feature: "Live NL Builder", values: ["check", "x", "x", "x", "x"] },
  { feature: "Visual Workflow Canvas", values: ["check", "check", "check", "check", "check"] },
  { feature: "100+ Integrations", values: ["check", "check", "check", "check", "check"] },
  { feature: "Free Tier Available", values: ["check", "check", "check", "check", "x"] },
  { feature: "Workflow Optimizer", values: ["check", "x", "x", "x", "x"] },
  { feature: "Time Machine Replay", values: ["check", "x", "x", "x", "x"] },
  { feature: "Built-in LLM Nodes", values: ["check", "x", "minus", "minus", "x"] },
  { feature: "Real-time Exec Logs", values: ["check", "minus", "check", "check", "minus"] },
  { feature: "Webhook Triggers", values: ["check", "check", "check", "check", "check"] },
  { feature: "Schedule Triggers", values: ["check", "check", "check", "check", "check"] },
  { feature: "LinkedIn Agent Demo", values: ["check", "x", "x", "x", "x"] },
  { feature: "System Resource Monitoring", values: ["check", "x", "x", "x", "x"] },
  { feature: "Code Execution Nodes", values: ["check", "check", "minus", "check", "x"] },
  { feature: "No Vendor Lock-in", values: ["check", "x", "x", "check", "x"] },
];

const roadmapItems = [
  { q: "Q2 2026", items: ["Multi-user collaboration", "Role-based access control", "Workflow versioning & git sync"], status: "planned" },
  { q: "Q3 2026", items: ["Mobile app for monitoring", "Marketplace for community templates", "Advanced error retry policies"], status: "planned" },
  { q: "Q4 2026", items: ["Enterprise SSO (SAML/OIDC)", "Audit logging & compliance", "Custom node SDK for extensions"], status: "planned" },
  { q: "Q1 2027", items: ["Multi-region deployment", "Real-time collaboration canvas", "AI agent chains (multi-step reasoning)"], status: "future" },
];

function formatBytes(bytes: number) {
  if (bytes >= 1073741824) return `${(bytes / 1073741824).toFixed(2)} GB`;
  if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1)} MB`;
  return `${(bytes / 1024).toFixed(0)} KB`;
}

function formatUptime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${h}h ${m}m ${s}s`;
}

export default function DocsPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [workflowCount, setWorkflowCount] = useState(0);
  const [executionCount, setExecutionCount] = useState(0);
  const [successRate, setSuccessRate] = useState(0);

  useEffect(() => {
    getSystemStats().then(setSystemStats).catch(() => {});
    getWorkflows().then(w => setWorkflowCount(w.length)).catch(() => {});
    getExecutions().then(e => {
      setExecutionCount(e.length);
      if (e.length > 0) {
        setSuccessRate(Math.round((e.filter(x => x.status === 'completed').length / e.length) * 100));
      }
    }).catch(() => {});
    const interval = setInterval(() => {
      getSystemStats().then(setSystemStats).catch(() => {});
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const ValIcon = ({ v }: { v: string }) => {
    if (v === "check") return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
    if (v === "x") return <XCircle className="h-4 w-4 text-red-400" />;
    return <Minus className="h-4 w-4 text-amber-400" />;
  };

  return (
    <div className="p-8 max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Documentation</h1>
        <p className="text-sm text-gray-500">FlowCraft — No-Code Workflow Automation Platform</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-8 overflow-x-auto pb-1">
        {tabs.map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                activeTab === t.id
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50 border border-transparent"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ═══ OVERVIEW ═══ */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="rounded-2xl bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 border border-emerald-200 p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center">
                <Zap className="h-6 w-6 text-white" fill="currentColor" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">FlowCraft</h2>
                <p className="text-sm text-gray-600">AI-Powered No-Code Workflow Automation Platform</p>
              </div>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed mb-6">
              FlowCraft is an open-source, self-hosted workflow automation platform that combines visual drag-and-drop building
              with AI-powered intelligence. Build workflows from natural language prompts, connect 100+ services, and let the
              self-healing engine automatically detect and fix failures — all without writing a single line of code.
            </p>
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-white/80 rounded-xl p-4 border border-emerald-100">
                <p className="text-2xl font-bold text-emerald-600">{workflowCount}</p>
                <p className="text-[11px] text-gray-500">Total Workflows</p>
              </div>
              <div className="bg-white/80 rounded-xl p-4 border border-emerald-100">
                <p className="text-2xl font-bold text-blue-600">{executionCount}</p>
                <p className="text-[11px] text-gray-500">Total Executions</p>
              </div>
              <div className="bg-white/80 rounded-xl p-4 border border-emerald-100">
                <p className="text-2xl font-bold text-teal-600">70+</p>
                <p className="text-[11px] text-gray-500">Node Types</p>
              </div>
              <div className="bg-white/80 rounded-xl p-4 border border-emerald-100">
                <p className="text-2xl font-bold text-purple-600">{successRate}%</p>
                <p className="text-[11px] text-gray-500">Success Rate</p>
              </div>
            </div>
          </div>

          {/* Tech Stack */}
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2"><Code className="h-4 w-4 text-gray-400" /> Tech Stack</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Frontend</h4>
                {["Next.js 16 (React 19, TypeScript)", "React Flow (@xyflow/react) — Canvas", "Tailwind CSS — Styling", "Lucide React — Icons", "Turbopack — Dev Server"].map(t => (
                  <div key={t} className="flex items-center gap-2 text-xs text-gray-600"><ArrowRight className="h-3 w-3 text-emerald-500" />{t}</div>
                ))}
              </div>
              <div className="space-y-2">
                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Backend</h4>
                {["Node.js + Express.js", "MongoDB + Mongoose ODM", "node-cron — Job Scheduling", "OpenRouter API — LLM Integration", "Custom Self-Healing Engine"].map(t => (
                  <div key={t} className="flex items-center gap-2 text-xs text-gray-600"><ArrowRight className="h-3 w-3 text-blue-500" />{t}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ ARCHITECTURE ═══ */}
      {activeTab === "architecture" && (
        <div className="space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h3 className="text-sm font-bold text-gray-800 mb-6 flex items-center gap-2"><Layers className="h-4 w-4 text-gray-400" /> System Architecture</h3>
            {/* Architecture diagram using styled divs */}
            <div className="space-y-4">
              {/* Layer 1: Frontend */}
              <div className="rounded-xl bg-blue-50 border border-blue-200 p-4">
                <h4 className="text-xs font-bold text-blue-700 mb-3 flex items-center gap-2"><Globe className="h-4 w-4" /> Presentation Layer (Frontend)</h4>
                <div className="grid grid-cols-5 gap-2">
                  {["Workflow Canvas", "Node Palette", "AI Assistant", "NL Builder", "Config Panel"].map(c => (
                    <div key={c} className="bg-white rounded-lg border border-blue-100 px-3 py-2 text-center text-[10px] font-medium text-blue-700">{c}</div>
                  ))}
                </div>
                <div className="grid grid-cols-5 gap-2 mt-2">
                  {["Dashboard", "Templates", "Monitor", "Time Machine", "Self-Healing UI"].map(c => (
                    <div key={c} className="bg-white rounded-lg border border-blue-100 px-3 py-2 text-center text-[10px] font-medium text-blue-600">{c}</div>
                  ))}
                </div>
              </div>

              {/* Arrow */}
              <div className="flex justify-center"><div className="text-gray-300 text-lg">▼ REST API ▼</div></div>

              {/* Layer 2: API */}
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4">
                <h4 className="text-xs font-bold text-emerald-700 mb-3 flex items-center gap-2"><Server className="h-4 w-4" /> API Layer (Express.js)</h4>
                <div className="grid grid-cols-5 gap-2">
                  {["Workflows API", "Executions API", "AI/NLP API", "Auth/OAuth API", "LinkedIn API"].map(c => (
                    <div key={c} className="bg-white rounded-lg border border-emerald-100 px-3 py-2 text-center text-[10px] font-medium text-emerald-700">{c}</div>
                  ))}
                </div>
              </div>

              {/* Arrow */}
              <div className="flex justify-center"><div className="text-gray-300 text-lg">▼ Function Calls ▼</div></div>

              {/* Layer 3: Engine */}
              <div className="rounded-xl bg-purple-50 border border-purple-200 p-4">
                <h4 className="text-xs font-bold text-purple-700 mb-3 flex items-center gap-2"><Brain className="h-4 w-4" /> Engine Layer</h4>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { name: "Executor", desc: "70+ node handlers" },
                    { name: "Self-Healing", desc: "Failure analysis & fix" },
                    { name: "Optimizer", desc: "Workflow analysis" },
                    { name: "Agent Executor", desc: "Multi-step AI agents" },
                  ].map(c => (
                    <div key={c.name} className="bg-white rounded-lg border border-purple-100 px-3 py-2 text-center">
                      <div className="text-[10px] font-bold text-purple-700">{c.name}</div>
                      <div className="text-[9px] text-gray-500">{c.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Arrow */}
              <div className="flex justify-center"><div className="text-gray-300 text-lg">▼ Read/Write ▼</div></div>

              {/* Layer 4: Data */}
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
                <h4 className="text-xs font-bold text-amber-700 mb-3 flex items-center gap-2"><Database className="h-4 w-4" /> Data Layer</h4>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { name: "Workflows Collection", desc: "Nodes, edges, config" },
                    { name: "Executions Collection", desc: "Steps, logs, duration" },
                    { name: "Integrations Collection", desc: "OAuth tokens, credentials" },
                  ].map(c => (
                    <div key={c.name} className="bg-white rounded-lg border border-amber-100 px-3 py-2 text-center">
                      <div className="text-[10px] font-bold text-amber-700">{c.name}</div>
                      <div className="text-[9px] text-gray-500">{c.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Data flow */}
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h3 className="text-sm font-bold text-gray-800 mb-4">Execution Data Flow</h3>
            <div className="flex items-center gap-2 flex-wrap text-[11px]">
              {["Trigger (Manual/Schedule/Webhook)", "→", "Resolve Template Variables", "→", "Execute Node", "→", "Pass Output to Next", "→", "Check Conditions", "→", "Save Execution Record"].map((step, i) => (
                <span key={i} className={step === "→" ? "text-gray-300 text-lg" : "bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-gray-700 font-medium"}>{step}</span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══ FEATURES ═══ */}
      {activeTab === "features" && (
        <div className="space-y-6">
          {featureCategories.map(cat => {
            const CatIcon = cat.icon;
            return (
              <div key={cat.title} className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${cat.color}15` }}>
                    <CatIcon className="h-4 w-4" style={{ color: cat.color }} />
                  </div>
                  <h3 className="text-sm font-bold text-gray-800">{cat.title}</h3>
                  <span className="ml-auto text-[10px] font-medium text-gray-400">{cat.features.length} features</span>
                </div>
                <div className="divide-y divide-gray-50">
                  {cat.features.map(f => (
                    <div key={f.name} className="flex items-center gap-4 px-6 py-3">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      <div className="flex-1">
                        <span className="text-xs font-semibold text-gray-800">{f.name}</span>
                        <span className="text-[11px] text-gray-400 ml-2">{f.desc}</span>
                      </div>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Implemented</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ═══ COMPARISON ═══ */}
      {activeTab === "comparison" && (
        <div className="space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-800">Platform Comparison</h3>
              <p className="text-[11px] text-gray-500 mt-1">How FlowCraft compares to existing automation platforms</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-6 py-3 font-semibold text-gray-600 w-64">Feature</th>
                    {competitors.map(c => (
                      <th key={c} className={`text-center px-4 py-3 font-semibold ${c === "FlowCraft" ? "text-emerald-700 bg-emerald-50" : "text-gray-600"}`}>{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {comparisonRows.map((row, i) => (
                    <tr key={row.feature} className={`border-b border-gray-50 ${i % 2 === 0 ? "" : "bg-gray-50/50"}`}>
                      <td className="px-6 py-2.5 font-medium text-gray-700">{row.feature}</td>
                      {row.values.map((v, j) => (
                        <td key={j} className={`text-center px-4 py-2.5 ${j === 0 ? "bg-emerald-50/50" : ""}`}>
                          <div className="flex justify-center"><ValIcon v={v} /></div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50 border-t border-gray-200">
                    <td className="px-6 py-3 font-bold text-gray-700">Score</td>
                    {competitors.map((c, i) => {
                      const score = comparisonRows.reduce((acc, row) => acc + (row.values[i] === "check" ? 1 : row.values[i] === "minus" ? 0.5 : 0), 0);
                      return (
                        <td key={c} className={`text-center px-4 py-3 font-bold ${i === 0 ? "text-emerald-700 bg-emerald-50 text-lg" : "text-gray-600"}`}>
                          {score}/{comparisonRows.length}
                        </td>
                      );
                    })}
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Unique selling points */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6">
            <h3 className="text-sm font-bold text-emerald-800 mb-4 flex items-center gap-2"><TrendingUp className="h-4 w-4" /> What Makes FlowCraft Unique</h3>
            <div className="grid grid-cols-3 gap-4">
              {[
                { title: "AI-First Architecture", desc: "Prompt-to-workflow, live NL builder, AI optimizer, self-healing — AI is embedded in every layer, not bolted on.", icon: Brain },
                { title: "Self-Healing Engine", desc: "Automatic failure detection, field-mapping fix, type casting, structure unwrapping — your workflows fix themselves.", icon: Shield },
                { title: "Zero Vendor Lock-in", desc: "Self-hosted, open-source, your data stays on your servers. Switch to any cloud or run on-premise.", icon: Lock },
              ].map(usp => {
                const UIcon = usp.icon;
                return (
                  <div key={usp.title} className="bg-white rounded-xl border border-emerald-100 p-4">
                    <UIcon className="h-5 w-5 text-emerald-600 mb-2" />
                    <h4 className="text-xs font-bold text-gray-800 mb-1">{usp.title}</h4>
                    <p className="text-[10px] text-gray-600 leading-relaxed">{usp.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ═══ SYSTEM STATS ═══ */}
      {activeTab === "system" && (
        <div className="space-y-6">
          {systemStats ? (
            <>
              {/* RAM Bar Chart */}
              <div className="rounded-xl border border-gray-200 bg-white p-6">
                <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2"><Cpu className="h-4 w-4 text-gray-400" /> Memory Utilization</h3>
                <div className="grid grid-cols-2 gap-6">
                  {/* System RAM */}
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">System RAM</p>
                    <div className="h-8 rounded-lg bg-gray-100 overflow-hidden mb-2 relative">
                      <div
                        className={`h-full rounded-lg transition-all ${systemStats.ram.usagePercent > 80 ? 'bg-red-500' : systemStats.ram.usagePercent > 60 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                        style={{ width: `${systemStats.ram.usagePercent}%` }}
                      />
                      <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-gray-700">
                        {systemStats.ram.usagePercent}% — {formatBytes(systemStats.ram.used)} / {formatBytes(systemStats.ram.total)}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-gray-50 rounded-lg p-3"><p className="text-lg font-bold text-gray-800">{formatBytes(systemStats.ram.total)}</p><p className="text-[9px] text-gray-400">Total</p></div>
                      <div className="bg-emerald-50 rounded-lg p-3"><p className="text-lg font-bold text-emerald-600">{formatBytes(systemStats.ram.free)}</p><p className="text-[9px] text-gray-400">Free</p></div>
                      <div className="bg-amber-50 rounded-lg p-3"><p className="text-lg font-bold text-amber-600">{formatBytes(systemStats.ram.used)}</p><p className="text-[9px] text-gray-400">Used</p></div>
                    </div>
                  </div>
                  {/* Process Memory */}
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Node.js Process</p>
                    <div className="space-y-3">
                      {[
                        { label: "Heap Used", value: systemStats.process.heapUsed, max: systemStats.process.heapTotal, color: "bg-blue-500" },
                        { label: "Heap Total", value: systemStats.process.heapTotal, max: systemStats.ram.total, color: "bg-indigo-500" },
                        { label: "RSS (Resident Set)", value: systemStats.process.rss, max: systemStats.ram.total, color: "bg-purple-500" },
                      ].map(m => (
                        <div key={m.label}>
                          <div className="flex justify-between text-[10px] mb-1">
                            <span className="text-gray-600 font-medium">{m.label}</span>
                            <span className="text-gray-500">{formatBytes(m.value)}</span>
                          </div>
                          <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                            <div className={`h-full rounded-full ${m.color} transition-all`} style={{ width: `${Math.min((m.value / m.max) * 100, 100)}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* System Info Table */}
              <div className="rounded-xl border border-gray-200 bg-white p-6">
                <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2"><Server className="h-4 w-4 text-gray-400" /> System Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "Platform", value: systemStats.platform },
                    { label: "CPU Cores", value: String(systemStats.cpus) },
                    { label: "Node.js Version", value: systemStats.nodeVersion },
                    { label: "Server Uptime", value: formatUptime(systemStats.uptime) },
                    { label: "Database", value: "MongoDB (Mongoose)" },
                    { label: "API Port", value: "5000" },
                  ].map(info => (
                    <div key={info.label} className="flex items-center justify-between px-4 py-2.5 bg-gray-50 rounded-lg">
                      <span className="text-xs text-gray-500">{info.label}</span>
                      <span className="text-xs font-semibold text-gray-800">{info.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-20">
              <Cpu className="h-8 w-8 text-gray-300 mx-auto animate-pulse" />
              <p className="text-sm text-gray-400 mt-3">Loading system stats...</p>
            </div>
          )}
        </div>
      )}

      {/* ═══ ROADMAP ═══ */}
      {activeTab === "roadmap" && (
        <div className="space-y-6">
          {roadmapItems.map(quarter => (
            <div key={quarter.q} className="rounded-xl border border-gray-200 bg-white p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className={`px-3 py-1 rounded-full text-xs font-bold ${quarter.status === "planned" ? "bg-blue-50 text-blue-600" : "bg-gray-100 text-gray-500"}`}>
                  {quarter.q}
                </div>
                <span className={`text-[10px] font-medium uppercase tracking-wider ${quarter.status === "planned" ? "text-blue-400" : "text-gray-400"}`}>
                  {quarter.status === "planned" ? "Planned" : "Future Vision"}
                </span>
              </div>
              <div className="space-y-2">
                {quarter.items.map(item => (
                  <div key={item} className="flex items-center gap-3 text-xs text-gray-600">
                    <div className={`w-2 h-2 rounded-full ${quarter.status === "planned" ? "bg-blue-400" : "bg-gray-300"}`} />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
