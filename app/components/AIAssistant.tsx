'use client';

import React, { useState, useCallback } from 'react';
import {
  Sparkles, X, Send, Loader2, CheckCircle2, AlertCircle,
  ChevronRight, Wand2, Zap, Tag
} from 'lucide-react';
import { suggestWorkflow, getTemplates } from '../lib/api';
import type { AISuggestResponse, Template, WorkflowNode, WorkflowEdge } from '../lib/api';
import { groupColors, groupMeta } from '../lib/nodeDefinitions';

// ─── Props ────────────────────────────────────────────────────────────────────
interface AIAssistantProps {
  onApply: (nodes: WorkflowNode[], edges: WorkflowEdge[]) => void;
  onClose: () => void;
}

// ─── Confidence bar ───────────────────────────────────────────────────────────
function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color = pct >= 75 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-rose-500';
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[10px] text-gray-500">
        <span>AI Confidence</span>
        <span className={`font-mono ${pct >= 75 ? 'text-emerald-600' : pct >= 50 ? 'text-amber-600' : 'text-rose-600'}`}>
          {pct}%
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ─── Service Tag ──────────────────────────────────────────────────────────────
function ServiceTag({ service }: { service: string }) {
  const metaEntry = Object.entries(groupMeta).find(
    ([, v]) => v.label.toLowerCase().includes(service.toLowerCase())
  );
  const group = metaEntry?.[0] ?? 'core';
  const colors = groupColors[group] ?? groupColors.core;
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${colors.light} ${colors.text} capitalize`}>
      {service}
    </span>
  );
}

// ─── Suggestion Display ───────────────────────────────────────────────────────
function SuggestionCard({
  result,
  onApply,
}: {
  result: AISuggestResponse;
  onApply: () => void;
}) {
  const { analysis, template, nodes } = result;

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Confidence */}
      <ConfidenceBar value={analysis.confidence} />

      {/* Detected services */}
      {analysis.detectedServices.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-2">
            Detected Services
          </p>
          <div className="flex flex-wrap gap-1.5">
            {analysis.detectedServices.map(s => (
              <ServiceTag key={s} service={s} />
            ))}
          </div>
        </div>
      )}

      {/* Template match */}
      {template && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
          <div className="flex items-center gap-2 mb-1">
            <Wand2 className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-[11px] font-semibold text-emerald-700">Template matched</span>
          </div>
          <p className="text-[11px] text-gray-700">{template.name}</p>
          <p className="text-[10px] text-gray-500 mt-0.5">{template.description}</p>
        </div>
      )}

      {/* Reasoning */}
      {analysis.reasoning && (
        <div>
          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-1.5">
            Reasoning
          </p>
          <p className="text-[11px] text-gray-600 leading-relaxed">{analysis.reasoning}</p>
        </div>
      )}

      {/* Suggested nodes */}
      {analysis.suggestedNodes.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-2">
            Suggested Nodes ({nodes?.length || analysis.suggestedNodes.length})
          </p>
          <div className="space-y-1">
            {analysis.suggestedNodes.slice(0, 6).map((n, i) => (
              <div key={i} className="flex items-center gap-2 text-[11px] text-gray-600">
                <ChevronRight className="w-3 h-3 text-gray-400 shrink-0" />
                <span className="font-mono text-[10px] bg-gray-100 px-1.5 py-0.5 rounded">{n}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Apply button */}
      <button
        onClick={onApply}
        disabled={!nodes || nodes.length === 0}
        className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-[12px] font-semibold transition-all"
      >
        <Zap className="w-3.5 h-3.5" />
        Apply to Canvas
      </button>
    </div>
  );
}

// ─── Template Browser ─────────────────────────────────────────────────────────
function TemplateBrowser({ onSelect }: { onSelect: (t: Template) => void }) {
  const [templates, setTemplates] = useState<Template[] | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (templates !== null) return;
    setLoading(true);
    try {
      const t = await getTemplates();
      setTemplates(t);
    } catch {
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => { load(); /* intentionally call without deps */ }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!templates || templates.length === 0) {
    return (
      <p className="text-[11px] text-gray-400 text-center py-4">No templates available.</p>
    );
  }

  return (
    <div className="space-y-2">
      {templates.map(t => (
        <button
          key={t.id}
          onClick={() => onSelect(t)}
          className="w-full text-left rounded-lg border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 p-3 transition-all group"
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[12px] font-semibold text-gray-800">{t.name}</p>
              <p className="text-[10px] text-gray-500 mt-0.5 leading-relaxed">{t.description}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 shrink-0 mt-0.5 transition-colors" />
          </div>
          {t.tags && t.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {t.tags.slice(0, 3).map(tag => (
                <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 flex items-center gap-0.5">
                  <Tag className="w-2 h-2" /> {tag}
                </span>
              ))}
            </div>
          )}
        </button>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AIAssistant({ onApply, onClose }: AIAssistantProps) {
  const [tab, setTab] = useState<'describe' | 'templates'>('describe');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AISuggestResponse | null>(null);

  const handleSuggest = useCallback(async () => {
    const text = description.trim();
    if (!text) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await suggestWorkflow(text);
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get suggestions');
    } finally {
      setLoading(false);
    }
  }, [description]);

  const handleApply = useCallback(() => {
    if (!result?.nodes) return;
    onApply(result.nodes, result.edges || []);
    onClose();
  }, [result, onApply, onClose]);

  const handleTemplateSelect = useCallback((t: Template) => {
    onApply(t.nodes, t.edges || []);
    onClose();
  }, [onApply, onClose]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSuggest();
    }
  };

  const examplePrompts = [
    'When a new Shopify order is placed, send a Slack notification and add a row to Google Sheets',
    'Schedule daily report: fetch data from API, summarize with GPT-4, send via email',
    'When GitHub gets a new issue, create a Jira ticket and DM the team on Slack',
    'Process new HubSpot leads: enrich data and add to Mailchimp list',
  ];

  return (
    <div className="w-80 flex-shrink-0 flex flex-col h-full bg-white border-l border-gray-200 animate-slide-right">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-[12px] font-semibold text-gray-800">AI Assistant</h3>
            <p className="text-[9px] text-gray-400">Auto-build workflows from text</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-6 h-6 rounded flex items-center justify-center hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex px-4 pt-3 gap-1">
        {(['describe', 'templates'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-1.5 text-[11px] font-semibold rounded-md transition-colors ${
              tab === t
                ? 'bg-emerald-600 text-white'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            {t === 'describe' ? 'Describe' : 'Templates'}
          </button>
        ))}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-200">
        {tab === 'describe' ? (
          <>
            {/* Input */}
            <div>
              <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-2">
                Describe your workflow
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="e.g. When a new Stripe payment is received, send a receipt email and notify Slack..."
                rows={4}
                className="w-full px-3 py-2 text-[11px] bg-gray-50 border border-gray-200 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:border-emerald-400 focus:bg-white transition-all resize-none"
              />
              <p className="text-[9px] text-gray-400 mt-1">Ctrl+Enter to run</p>
            </div>

            {/* Example prompts */}
            {!result && !loading && (
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">
                  Try an example
                </p>
                <div className="space-y-1.5">
                  {examplePrompts.map((p, i) => (
                    <button
                      key={i}
                      onClick={() => setDescription(p)}
                      className="w-full text-left text-[10px] text-gray-500 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:border-gray-300 rounded-md px-2.5 py-2 transition-all leading-relaxed"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 p-3 rounded-lg border border-rose-500/20 bg-rose-500/5">
                <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                <p className="text-[11px] text-rose-300">{error}</p>
              </div>
            )}

            {/* Loading */}
            {loading && (
              <div className="flex flex-col items-center gap-3 py-6">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
                <p className="text-[11px] text-gray-500">Analyzing your workflow…</p>
              </div>
            )}

            {/* Result */}
            {result && !loading && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[11px] font-semibold text-emerald-400">Workflow generated!</span>
                </div>
                <SuggestionCard result={result} onApply={handleApply} />
              </div>
            )}
          </>
        ) : (
          <TemplateBrowser onSelect={handleTemplateSelect} />
        )}
      </div>

      {/* Footer — describe tab only */}
      {tab === 'describe' && (
        <div className="px-4 py-3 border-t border-gray-200">
          <button
            onClick={handleSuggest}
            disabled={!description.trim() || loading}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-[12px] font-semibold transition-all"
          >
            {loading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            {loading ? 'Generating…' : 'Generate Workflow'}
          </button>
        </div>
      )}
    </div>
  );
}
