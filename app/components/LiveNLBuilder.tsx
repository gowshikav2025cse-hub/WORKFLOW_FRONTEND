'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Pen, Loader2, Sparkles, X, ChevronRight, Wand2, RefreshCw } from 'lucide-react';
import { liveBuild } from '../lib/api';
import type { WorkflowNode, WorkflowEdge, AISuggestResponse } from '../lib/api';

// ─── Props ────────────────────────────────────────────────────────────────────
interface LiveNLBuilderProps {
  onApply: (nodes: WorkflowNode[], edges: WorkflowEdge[]) => void;
  onClose: () => void;
}

// ─── Preview list ─────────────────────────────────────────────────────────────
function PreviewNodeList({ nodes }: { nodes: WorkflowNode[] }) {
  return (
    <div className="space-y-1">
      {nodes.map((n, i) => (
        <div key={n.id} className="flex items-center gap-2 text-[11px]">
          <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-600 text-[9px] flex items-center justify-center shrink-0 font-bold">
            {i + 1}
          </span>
          <span className="text-gray-700 truncate">{(n.data?.label as string) || n.type}</span>
          <span className="ml-auto text-[9px] font-mono text-gray-400 shrink-0 capitalize">
            {(n.data?.category as string) || ''}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function LiveNLBuilder({ onApply, onClose }: LiveNLBuilderProps) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<AISuggestResponse | null>(null);
  const [error, setError] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const buildWorkflow = useCallback(async (text: string) => {
    const t = text.trim();
    if (!t || t.length < 10) return;
    setLoading(true);
    setError('');
    try {
      const res = await liveBuild(t);
      setPreview(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Build failed');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setPrompt(val);
    // Debounce – auto-build after 800ms of inactivity
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (val.trim().length >= 15) {
      debounceRef.current = setTimeout(() => buildWorkflow(val), 800);
    } else {
      setPreview(null);
    }
  };

  const handleApply = () => {
    if (!preview?.nodes) return;
    onApply(preview.nodes, preview.edges || []);
    onClose();
  };

  const examplePrompts = [
    'Every morning at 9am, fetch sales report and email to team',
    'When a new GitHub PR is opened, notify Slack and create Jira ticket',
    'On new Stripe payment, add row to Sheets and send confirmation SMS',
    'Daily: run AI summary on yesterday\'s HubSpot leads and post to Slack',
  ];

  return (
    <div className="w-80 flex-shrink-0 flex flex-col h-full bg-white border-l border-gray-200 animate-slide-right">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
            <Pen className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-[12px] font-semibold text-gray-800">NL Builder</h3>
            <p className="text-[9px] text-gray-400">Type → live workflow preview</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-6 h-6 rounded flex items-center justify-center hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-200">
        {/* Input */}
        <div>
          <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-2">
            Describe your automation
          </label>
          <textarea
            value={prompt}
            onChange={handleChange}
            placeholder="Start typing... e.g. When a new Stripe payment arrives, send a Slack message and update Airtable"
            rows={5}
            className="w-full px-3 py-2 text-[11px] bg-gray-50 border border-gray-200 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:border-emerald-400 focus:bg-white transition-all resize-none"
          />
          <div className="flex items-center justify-between mt-1">
            <p className="text-[9px] text-gray-400">Auto-builds as you type</p>
            {loading && (
              <div className="flex items-center gap-1 text-[9px] text-emerald-500">
                <Loader2 className="w-2.5 h-2.5 animate-spin" />
                <span>Building…</span>
              </div>
            )}
          </div>
        </div>

        {/* Examples */}
        {!preview && !loading && (
          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">
              Examples
            </p>
            <div className="space-y-1.5">
              {examplePrompts.map((p, i) => (
                <button
                  key={i}
                  onClick={() => { setPrompt(p); buildWorkflow(p); }}
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
          <div className="p-3 rounded-lg border border-rose-500/20 bg-rose-500/5">
            <p className="text-[11px] text-rose-300">{error}</p>
          </div>
        )}

        {/* Preview */}
        {preview && !loading && (
          <div className="animate-fade-in space-y-4">
            {/* Analysis badges */}
            <div className="space-y-2">
              {preview.analysis.detectedServices.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5">
                    Services detected
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {preview.analysis.detectedServices.map(s => (
                      <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 capitalize">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Confidence */}
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-gray-500">AI confidence</span>
                <span className="font-mono text-emerald-600">
                  {Math.round((preview.analysis.confidence || 0) * 100)}%
                </span>
              </div>
              <div className="h-1 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all"
                  style={{ width: `${Math.round((preview.analysis.confidence || 0) * 100)}%` }}
                />
              </div>
            </div>

            {/* Node preview */}
            {preview.nodes && preview.nodes.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">
                    Preview — {preview.nodes.length} nodes
                  </p>
                  <Sparkles className="w-3 h-3 text-emerald-500" />
                </div>
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <PreviewNodeList nodes={preview.nodes} />
                </div>
              </div>
            )}

            {/* Edges info */}
            {preview.edges && preview.edges.length > 0 && (
              <div className="flex items-center gap-2 text-[10px] text-gray-400">
                <ChevronRight className="w-3 h-3" />
                <span>{preview.edges.length} connections</span>
              </div>
            )}

            {/* Reasoning */}
            {preview.analysis.reasoning && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Wand2 className="w-3 h-3 text-emerald-600" />
                  <span className="text-[10px] font-semibold text-emerald-700">Reasoning</span>
                </div>
                <p className="text-[10px] text-gray-600 leading-relaxed">{preview.analysis.reasoning}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-200 space-y-2">
        {preview && (
          <button
            onClick={handleApply}
            disabled={!preview.nodes || preview.nodes.length === 0}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-[12px] font-semibold transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Apply to Canvas
          </button>
        )}
        {preview && (
          <button
            onClick={() => { setPreview(null); setPrompt(''); }}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 text-[11px] text-gray-400 hover:text-gray-600 transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            Start over
          </button>
        )}
      </div>
    </div>
  );
}
