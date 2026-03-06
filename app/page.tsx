'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  GitBranch, Activity, Zap, TrendingUp, CheckCircle2,
  ArrowRight, Sparkles, Clock, Plus, Play, Send, Loader2, Cpu, MemoryStick,
} from 'lucide-react';
import { getWorkflows, getExecutions, createDemoFlow, liveBuild, saveWorkflow, getSystemStats, type Workflow, type Execution, type SystemStats } from './lib/api';
import BrandIcon, { getBrandColor } from './components/BrandIcon';

const integrationHighlights = [
  { brand: 'gmail', label: 'Gmail' },
  { brand: 'slack', label: 'Slack' },
  { brand: 'shopify', label: 'Shopify' },
  { brand: 'hubspot', label: 'HubSpot' },
  { brand: 'stripe', label: 'Stripe' },
  { brand: 'notion', label: 'Notion' },
  { brand: 'github', label: 'GitHub' },
  { brand: 'openai', label: 'OpenAI' },
];

export default function DashboardPage() {
  const router = useRouter();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [loading, setLoading] = useState(true);
  const [demoLoading, setDemoLoading] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [promptLoading, setPromptLoading] = useState(false);
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);

  const handleDemoFlow = async () => {
    setDemoLoading(true);
    try {
      const { workflow } = await createDemoFlow();
      router.push(`/builder/${workflow._id}`);
    } catch (err) {
      console.error('Demo flow error:', err);
    } finally {
      setDemoLoading(false);
    }
  };

  const handlePromptBuild = async () => {
    if (!prompt.trim() || prompt.trim().length < 10) return;
    setPromptLoading(true);
    try {
      const result = await liveBuild(prompt.trim());
      if (result.nodes && result.nodes.length > 0) {
        const saved = await saveWorkflow({
          name: result.template?.name || prompt.trim().slice(0, 50),
          description: result.template?.description || prompt.trim(),
          nodes: result.nodes,
          edges: result.edges,
        });
        router.push(`/builder/${saved._id}`);
      }
    } catch (err) {
      console.error('Prompt build error:', err);
    } finally {
      setPromptLoading(false);
    }
  };

  useEffect(() => {
    async function load() {
      try {
        const [w, e] = await Promise.all([getWorkflows(), getExecutions()]);
        setWorkflows(w);
        setExecutions(e);
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
    // Poll system stats
    const fetchStats = () => getSystemStats().then(setSystemStats).catch(() => {});
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const totalWorkflows = workflows.length;
  const activeWorkflows = workflows.filter((w) => w.isActive).length;
  const todayExecutions = executions.filter((e) => {
    const d = new Date(e.startedAt);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  }).length;
  const successRate =
    executions.length > 0
      ? Math.round((executions.filter((e) => e.status === 'completed').length / executions.length) * 100)
      : 100;

  const stats = [
    { label: 'Total Workflows', value: totalWorkflows, icon: GitBranch, bg: 'bg-emerald-50', iconColor: 'text-emerald-600', accent: 'border-emerald-100' },
    { label: 'Active', value: activeWorkflows, icon: Zap, bg: 'bg-blue-50', iconColor: 'text-blue-600', accent: 'border-blue-100' },
    { label: 'Runs Today', value: todayExecutions, icon: Activity, bg: 'bg-amber-50', iconColor: 'text-amber-600', accent: 'border-amber-100' },
    { label: 'Success Rate', value: `${successRate}%`, icon: TrendingUp, bg: 'bg-teal-50', iconColor: 'text-teal-600', accent: 'border-teal-100' },
  ];

  return (
    <div className="min-h-screen gradient-mesh">
      {/* Header Section */}
      <div className="px-8 pt-8 pb-2">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1.5 tracking-tight">
              Dashboard
            </h1>
            <p className="text-sm text-gray-500">
              Monitor your automations and workflow performance
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleDemoFlow}
              disabled={demoLoading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100
                         text-emerald-700 text-xs font-medium border border-emerald-200
                         hover:border-emerald-300 transition-all disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5" />
              {demoLoading ? 'Creating...' : 'Try Demo Flow'}
            </button>
            <Link
              href="/builder"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700
                         text-white text-xs font-medium shadow-lg shadow-emerald-600/20
                         hover:shadow-emerald-600/30 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              New Workflow
            </Link>
          </div>
        </div>

        {/* Prompt-to-Workflow */}
        <div className="mb-6 p-5 rounded-2xl bg-gradient-to-r from-emerald-50 via-green-50 to-teal-50 border border-emerald-200">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-emerald-600" />
            <h2 className="text-sm font-bold text-gray-800">Build Workflow from Prompt</h2>
          </div>
          <p className="text-xs text-gray-500 mb-3">Describe what you want to automate in plain English — AI will build the workflow for you.</p>
          <div className="flex gap-2">
            <input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handlePromptBuild()}
              placeholder="e.g. When a new Stripe payment arrives, send a Slack message and add a row to Google Sheets"
              className="flex-1 px-4 py-2.5 rounded-xl border border-emerald-200 bg-white text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400"
            />
            <button
              onClick={handlePromptBuild}
              disabled={promptLoading || prompt.trim().length < 10}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {promptLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {promptLoading ? 'Building...' : 'Build'}
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-5 gap-4 mb-8">
          {stats.map((stat, i) => {
            const IconComp = stat.icon;
            return (
              <div
                key={stat.label}
                className={`animate-fade-in delay-${i * 100} glass-card p-5 border ${stat.accent}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-9 h-9 rounded-xl ${stat.bg} flex items-center justify-center`}>
                    <IconComp className={`w-4 h-4 ${stat.iconColor}`} />
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900 mb-0.5 tracking-tight">
                  {loading ? '—' : stat.value}
                </p>
                <p className="text-[11px] text-gray-400">{stat.label}</p>
              </div>
            );
          })}
          {/* RAM Usage Card */}
          <div className="animate-fade-in glass-card p-5 border border-purple-100">
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center">
                <Cpu className="w-4 h-4 text-purple-600" />
              </div>
            </div>
            {systemStats ? (
              <>
                <p className="text-2xl font-bold text-gray-900 mb-0.5 tracking-tight">{systemStats.ram.usagePercent}%</p>
                <p className="text-[11px] text-gray-400">RAM Usage</p>
                <div className="mt-2 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${systemStats.ram.usagePercent > 80 ? 'bg-red-500' : systemStats.ram.usagePercent > 60 ? 'bg-amber-500' : 'bg-purple-500'}`} style={{ width: `${systemStats.ram.usagePercent}%` }} />
                </div>
                <p className="text-[9px] text-gray-400 mt-1">{(systemStats.ram.used / 1073741824).toFixed(1)}GB / {(systemStats.ram.total / 1073741824).toFixed(1)}GB</p>
              </>
            ) : (
              <>
                <p className="text-2xl font-bold text-gray-900 mb-0.5">—</p>
                <p className="text-[11px] text-gray-400">RAM Usage</p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-8 pb-8 grid grid-cols-3 gap-6">
        {/* Recent Workflows */}
        <div className="col-span-2 glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-gray-400" />
              <h2 className="text-sm font-semibold text-gray-800">Recent Workflows</h2>
            </div>
            <Link
              href="/workflows"
              className="text-[11px] text-emerald-600 hover:text-emerald-700 flex items-center gap-1 transition-colors"
            >
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 rounded-lg animate-shimmer bg-gray-50" />
              ))}
            </div>
          ) : workflows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
                <GitBranch className="w-6 h-6 text-gray-300" />
              </div>
              <p className="text-sm text-gray-500 mb-1">No workflows yet</p>
              <p className="text-[11px] text-gray-400 mb-4">Create your first automation to get started</p>
              <Link
                href="/builder"
                className="px-4 py-2 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-200 hover:bg-emerald-100 transition-colors"
              >
                <Plus className="w-3 h-3 inline mr-1" /> Create Workflow
              </Link>
            </div>
          ) : (
            <div className="space-y-1">
              {workflows.slice(0, 6).map((w) => (
                <Link
                  key={w._id}
                  href={`/builder/${w._id}`}
                  className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-gray-50 transition-colors group"
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      w.isActive
                        ? 'bg-emerald-50 text-emerald-600'
                        : 'bg-gray-50 text-gray-400'
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-700 truncate group-hover:text-gray-900 transition-colors">
                      {w.name}
                    </p>
                    <p className="text-[10px] text-gray-400 truncate">
                      {w.nodes?.length || 0} nodes · Updated {new Date(w.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[9px] font-medium ${
                      w.isActive
                        ? 'bg-emerald-50 text-emerald-600'
                        : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {w.isActive ? 'Active' : 'Draft'}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* AI Quick Start */}
          <div className="glass-card p-5 border border-emerald-100">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-semibold text-gray-800">AI Quick Start</h3>
            </div>
            <p className="text-[11px] text-gray-500 mb-4 leading-relaxed">
              Describe what you want to automate and AI will build the workflow for you.
            </p>
            <div className="space-y-2 mb-4">
              {['Send email when order placed', 'Sync Slack messages to Sheets', 'Social media scheduler'].map((ex, i) => (
                <Link
                  key={i}
                  href="/builder"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 border border-gray-100
                             hover:border-emerald-200 hover:bg-emerald-50/50 text-[10px] text-gray-500
                             hover:text-gray-700 transition-all"
                >
                  <Play className="w-2.5 h-2.5" /> {ex}
                </Link>
              ))}
            </div>
            <Link
              href="/builder"
              className="block w-full text-center px-4 py-2.5 rounded-lg bg-emerald-50 text-emerald-700
                         text-xs font-medium border border-emerald-200 hover:bg-emerald-100
                         transition-colors"
            >
              Open AI Builder <ArrowRight className="w-3 h-3 inline ml-1" />
            </Link>
          </div>

          {/* Recent Executions */}
          <div className="glass-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-4 h-4 text-gray-400" />
              <h3 className="text-sm font-semibold text-gray-800">Recent Runs</h3>
            </div>
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-10 rounded-lg animate-shimmer bg-gray-50" />
                ))}
              </div>
            ) : executions.length === 0 ? (
              <p className="text-[11px] text-gray-400 text-center py-6">No executions yet</p>
            ) : (
              <div className="space-y-1">
                {executions.slice(0, 5).map((e) => (
                  <Link
                    key={e._id}
                    href={`/monitor/${e._id}`}
                    className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <CheckCircle2
                      className={`w-3.5 h-3.5 shrink-0 ${
                        e.status === 'completed'
                          ? 'text-emerald-500'
                          : e.status === 'failed'
                          ? 'text-red-400'
                          : 'text-amber-400'
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] text-gray-600 truncate">{e.workflowName || 'Workflow'}</p>
                    </div>
                    <div className="flex items-center gap-1 text-[9px] text-gray-400">
                      <Clock className="w-2.5 h-2.5" />
                      {new Date(e.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Integrations Highlight */}
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">100+ Integrations</h3>
            <div className="grid grid-cols-4 gap-2 mb-3">
              {integrationHighlights.map(({ brand, label }) => (
                <div key={label} className="flex flex-col items-center gap-1.5 py-2.5 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors group cursor-default">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${getBrandColor(brand)}15` }}>
                    <BrandIcon name={brand} size={16} />
                  </div>
                  <span className="text-[8px] text-gray-400 group-hover:text-gray-600 transition-colors">{label}</span>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-gray-400 text-center">
              Gmail, Slack, Notion, Stripe, GitHub + 95 more
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
