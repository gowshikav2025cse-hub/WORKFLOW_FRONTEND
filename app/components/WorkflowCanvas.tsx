'use client';

import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  useReactFlow,
  type Connection,
  type Edge,
  type Node,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  Save, Play, Sparkles, Pen, BarChart3, Loader2,
  ArrowLeft, Settings, CheckCircle2, AlertCircle,
  PanelLeftClose, PanelLeftOpen, ChevronDown,
  Terminal, XCircle, Clock, ChevronRight, X,
} from 'lucide-react';
import Link from 'next/link';
import CustomNode from './CustomNode';
import NodePalette from './NodePalette';
import NodeConfigPanel from './NodeConfigPanel';
import AIAssistant from './AIAssistant';
import LiveNLBuilder from './LiveNLBuilder';
import OptimizerPanel from './OptimizerPanel';
import { getNodeDefinition } from '../lib/nodeDefinitions';
import { saveWorkflow, executeWorkflow, type Workflow, type WorkflowNode, type WorkflowEdge, type Execution } from '../lib/api';

const nodeTypes = { custom: CustomNode };

interface WorkflowCanvasProps {
  workflow?: Workflow;
}

export default function WorkflowCanvas({ workflow }: WorkflowCanvasProps) {
  return (
    <ReactFlowProvider>
      <WorkflowCanvasInner workflow={workflow} />
    </ReactFlowProvider>
  );
}

function WorkflowCanvasInner({ workflow }: WorkflowCanvasProps) {
  const { screenToFlowPosition } = useReactFlow();
  // ── State ──
  const [nodes, setNodes, onNodesChange] = useNodesState(
    workflow?.nodes?.map((n: Node) => ({ ...n, type: 'custom' })) || []
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(workflow?.edges || []);
  const [workflowName, setWorkflowName] = useState(workflow?.name || 'Untitled Workflow');
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [saving, setSaving] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<{ status: string; message?: string } | null>(null);
  const [showPalette, setShowPalette] = useState(true);
  const [activePanel, setActivePanel] = useState<'none' | 'ai' | 'nlBuilder' | 'optimizer'>('none');
  const [executionLog, setExecutionLog] = useState<Execution | null>(null);
  const [showLogs, setShowLogs] = useState(false);
  const [expandedStep, setExpandedStep] = useState<number | null>(null);

  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const workflowId = workflow?._id;

  // ── Node types registered ──
  const memoNodeTypes = useMemo(() => nodeTypes, []);

  // ── Edge connection ──
  const onConnect = useCallback(
    (params: Connection) =>
      setEdges((eds) => addEdge(params, eds).map((e) =>
        e.id === `${params.source}-${params.target}` || (e.source === params.source && e.target === params.target)
          ? { ...e, animated: true, type: 'smoothstep', style: { stroke: '#d1d5db', strokeWidth: 2 } }
          : e
      ) as typeof eds),
    [setEdges]
  );

  // ── Node selection ──
  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  // ── Node double-click → open full config panel ──
  const onNodeDoubleClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
    setActivePanel('none'); // ensure config panel shows (not AI/other panels)
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  // ── Drag & drop ──
  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const nodeType = e.dataTransfer.getData('application/flowcraft-node');
      if (!nodeType) return;

      const def = getNodeDefinition(nodeType);
      if (!def) return;

      // Use screenToFlowPosition for accurate placement regardless of zoom/pan
      const position = screenToFlowPosition({
        x: e.clientX,
        y: e.clientY,
      });

      const newNode: Node = {
        id: `node-${Date.now()}`,
        type: 'custom',
        position,
        data: {
          label: def.label,
          nodeType: def.type,
          config: {},
        },
      };

      setNodes((nds) => [...nds, newNode as typeof nds[0]]);
    },
    [setNodes, screenToFlowPosition]
  );

  // ── Config update ──
  const onConfigUpdate = useCallback(
    (nodeId: string, config: Record<string, unknown>) => {
      setNodes((nds) =>
        nds.map((n) =>
          n.id === nodeId ? { ...n, data: { ...n.data, config } } : n
        )
      );
      if (selectedNode?.id === nodeId) {
        setSelectedNode((prev) =>
          prev ? { ...prev, data: { ...prev.data, config } } : prev
        );
      }
    },
    [setNodes, selectedNode]
  );

  // ── Delete node ──
  const onDeleteNode = useCallback(
    (nodeId: string) => {
      setNodes((nds) => nds.filter((n) => n.id !== nodeId));
      setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
      setSelectedNode(null);
    },
    [setNodes, setEdges]
  );

  // ── Duplicate node ──
  const onDuplicateNode = useCallback(
    (nodeId: string) => {
      setNodes((nds) => {
        const original = nds.find((n) => n.id === nodeId);
        if (!original) return nds;
        const newNode: Node = {
          ...original,
          id: `node-${Date.now()}`,
          position: {
            x: (original.position?.x || 0) + 40,
            y: (original.position?.y || 0) + 40,
          },
          selected: false,
          data: { ...original.data, config: { ...(original.data.config as Record<string, unknown> || {}) } },
        };
        return [...nds, newNode as typeof nds[0]];
      });
    },
    [setNodes]
  );

  // ── Save workflow ──
  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await saveWorkflow({
        _id: workflowId,
        name: workflowName,
        nodes,
        edges,
      });
      setExecutionResult({ status: 'saved', message: 'Workflow saved!' });
      setTimeout(() => setExecutionResult(null), 2500);
    } catch {
      setExecutionResult({ status: 'error', message: 'Failed to save' });
      setTimeout(() => setExecutionResult(null), 3000);
    } finally {
      setSaving(false);
    }
  }, [workflowId, workflowName, nodes, edges]);

  // ── Execute workflow ──
  const handleExecute = useCallback(async () => {
    if (!workflowId) {
      setExecutionResult({ status: 'error', message: 'Save the workflow first' });
      setTimeout(() => setExecutionResult(null), 3000);
      return;
    }
    setExecuting(true);
    setShowLogs(false);

    // Reset execution status on nodes and edges before running
    setNodes((nds) =>
      nds.map((n) => ({ ...n, data: { ...n.data, executionStatus: undefined } }))
    );
    setEdges((eds) =>
      eds.map((e) => ({
        ...e,
        style: { stroke: '#d1d5db', strokeWidth: 2 },
      }))
    );

    try {
      const result = await executeWorkflow(workflowId);
      setExecutionLog(result);
      setShowLogs(true);
      setExpandedStep(null);

      // Build nodeId → status map from execution steps
      const nodeStatusMap: Record<string, string> = {};
      if (result.steps) {
        for (const step of result.steps) {
          const nId = (step as { nodeId?: string }).nodeId;
          if (nId) nodeStatusMap[nId] = step.status;
        }
      }

      // Update node execution status (green/red borders)
      setNodes((nds) =>
        nds.map((n) => ({
          ...n,
          data: {
            ...n.data,
            executionStatus: nodeStatusMap[n.id] || undefined,
          },
        }))
      );

      // Update edge colors based on source/target node status
      setEdges((eds) =>
        eds.map((e) => {
          const srcStatus = nodeStatusMap[e.source];
          const tgtStatus = nodeStatusMap[e.target];
          let strokeColor = '#d1d5db'; // default gray
          if (srcStatus === 'failed' || tgtStatus === 'failed') {
            strokeColor = '#ef4444'; // red
          } else if (srcStatus === 'completed' && tgtStatus === 'completed') {
            strokeColor = '#22c55e'; // green
          } else if (srcStatus === 'completed') {
            strokeColor = '#22c55e'; // green for partial success path
          }
          return {
            ...e,
            style: { stroke: strokeColor, strokeWidth: 2 },
          };
        })
      );

      setExecutionResult({
        status: result.status === 'completed' ? 'success' : 'error',
        message: result.status === 'completed' ? 'Execution complete!' : 'Execution failed',
      });
      setTimeout(() => setExecutionResult(null), 3000);
    } catch (err) {
      setExecutionResult({ status: 'error', message: err instanceof Error ? err.message : 'Execution failed' });
      setTimeout(() => setExecutionResult(null), 3000);
    } finally {
      setExecuting(false);
    }
  }, [workflowId, setNodes, setEdges]);

  // ── Apply AI suggestions ──
  const applyAISuggestion = useCallback(
    (suggestedNodes: WorkflowNode[], suggestedEdges: WorkflowEdge[]) => {
      const newNodes = suggestedNodes.map((n) => ({ ...n, type: 'custom' })) as unknown as Parameters<typeof setNodes>[0];
      setNodes(newNodes);
      setEdges(suggestedEdges as unknown as Parameters<typeof setEdges>[0]);
      setActivePanel('none');
    },
    [setNodes, setEdges]
  );

  // ── Toggle panels ──
  const togglePanel = useCallback((panel: 'ai' | 'nlBuilder' | 'optimizer') => {
    setActivePanel((prev) => (prev === panel ? 'none' : panel));
    setSelectedNode(null);
  }, []);

  return (
    <div className="flex flex-col h-full bg-[var(--background)]">
      {/* ── Top Bar ── */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[var(--card)] border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <Link
            href="/workflows"
            className="p-1.5 rounded-lg hover:bg-white/[0.05] text-white/30 hover:text-white/60 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="h-5 w-px bg-white/[0.06]" />
          <input
            type="text"
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            className="bg-transparent text-sm font-semibold text-white/90 border-none outline-none
                       placeholder-white/25 w-52 focus:text-white"
            placeholder="Workflow name..."
          />
        </div>

        <div className="flex items-center gap-1.5">
          {/* Panel toggles */}
          <button
            onClick={() => togglePanel('ai')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all
              ${activePanel === 'ai'
                ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/20'
                : 'text-white/40 hover:text-white/60 hover:bg-white/[0.04] border border-transparent'
              }`}
          >
            <Sparkles className="w-3 h-3" /> AI Assist
          </button>
          <button
            onClick={() => togglePanel('nlBuilder')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all
              ${activePanel === 'nlBuilder'
                ? 'bg-purple-500/15 text-purple-400 border border-purple-500/20'
                : 'text-white/40 hover:text-white/60 hover:bg-white/[0.04] border border-transparent'
              }`}
          >
            <Pen className="w-3 h-3" /> NL Build
          </button>
          <button
            onClick={() => togglePanel('optimizer')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all
              ${activePanel === 'optimizer'
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                : 'text-white/40 hover:text-white/60 hover:bg-white/[0.04] border border-transparent'
              }`}
          >
            <BarChart3 className="w-3 h-3" /> Optimize
          </button>

          <div className="h-5 w-px bg-white/[0.06] mx-1" />

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium
                       text-white/50 hover:text-white/80 hover:bg-white/[0.05] transition-all
                       disabled:opacity-40 disabled:cursor-not-allowed border border-transparent"
          >
            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
            Save
          </button>

          {/* Logs toggle */}
          {executionLog && (
            <button
              onClick={() => setShowLogs((v) => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium border transition-all
                ${
                  showLogs
                    ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50 border-gray-200'
                }`}
            >
              <Terminal className="w-3 h-3" />
              Logs
              <span className={`px-1.5 rounded-full text-[9px] font-medium ${
                executionLog.status === 'completed' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-500'
              }`}>
                {executionLog.steps?.length ?? 0}
              </span>
            </button>
          )}

          {/* Execute */}
          <button
            onClick={handleExecute}
            disabled={executing || !workflowId}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[11px] font-medium
                       bg-emerald-600 text-white hover:bg-emerald-700 transition-all
                       disabled:opacity-40 disabled:cursor-not-allowed shadow-sm shadow-emerald-600/20"
          >
            {executing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
            Execute
          </button>
        </div>
      </div>

      {/* ── Main Area ── */}
      <div className="flex-1 flex overflow-hidden">
        {/* Palette toggle */}
        <button
          onClick={() => setShowPalette(!showPalette)}
          className="absolute top-16 left-[240px] z-20 p-1 rounded-r-lg bg-white border border-l-0 border-[var(--border)]
                     text-gray-400 hover:text-gray-600 transition-colors"
          style={{ display: 'none' /* toggled via state */ }}
        >
          {showPalette ? <PanelLeftClose className="w-3.5 h-3.5" /> : <PanelLeftOpen className="w-3.5 h-3.5" />}
        </button>

        {/* Node Palette */}
        {showPalette && (
          <div className="w-[260px] shrink-0 animate-slide-left">
            <NodePalette />
          </div>
        )}

        {/* Canvas + Logs column */}
        <div className="flex-1 flex flex-col overflow-hidden min-h-0">

        {/* Canvas */}
        <div className="flex-1 relative min-h-0" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onNodeDoubleClick={onNodeDoubleClick}
            onPaneClick={onPaneClick}
            onDragOver={onDragOver}
            onDrop={onDrop}
            nodeTypes={memoNodeTypes}
            fitView
            snapToGrid
            snapGrid={[16, 16]}
            defaultEdgeOptions={{
              animated: true,
              type: 'smoothstep',
              style: { stroke: '#d1d5db', strokeWidth: 2 },
            }}
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={16}
              size={1}
              color="rgba(0,0,0,0.06)"
            />
            <Controls
              position="bottom-left"
              style={{ marginBottom: 12, marginLeft: 12 }}
            />
            <MiniMap
              position="bottom-right"
              style={{ marginBottom: 12, marginRight: 12 }}
              nodeColor={() => 'rgba(5,150,105,0.4)'}
              maskColor="rgba(255,255,255,0.7)"
            />
          </ReactFlow>

          {/* Empty state */}
          {nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center animate-fade-in">
                <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-7 h-7 text-gray-300" />
                </div>
                <p className="text-sm text-gray-400 mb-1">Start building your workflow</p>
                <p className="text-[11px] text-gray-300">
                  Drag nodes from the palette or use AI Assist
                </p>
              </div>
            </div>
          )}

          {/* Execution result toast */}
          {executionResult && (
            <div className="absolute top-4 right-4 z-50 animate-fade-in-scale">
              <div
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border shadow-lg
                  ${executionResult.status === 'success' || executionResult.status === 'saved'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    : 'bg-red-50 border-red-200 text-red-600'
                  }`}
              >
                {executionResult.status === 'success' || executionResult.status === 'saved' ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <AlertCircle className="w-4 h-4" />
                )}
                <span className="text-xs font-medium">{executionResult.message}</span>
              </div>
            </div>
          )}
        </div>

        {/* ── Execution Log Panel ── */}
        {showLogs && executionLog && (
          <div className="border-t border-gray-200 bg-white flex flex-col shrink-0" style={{ height: 320 }}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 shrink-0">
              <div className="flex items-center gap-2.5">
                <Terminal className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-xs font-semibold text-gray-700">Execution Output</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                  executionLog.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'
                }`}>
                  {executionLog.status}
                </span>
                {executionLog.duration !== undefined && (
                  <span className="flex items-center gap-1 text-[10px] text-gray-400">
                    <Clock className="w-2.5 h-2.5" />{executionLog.duration}ms
                  </span>
                )}
                <span className="text-[10px] text-gray-400">{executionLog.steps?.length ?? 0} steps</span>
              </div>
              <button
                onClick={() => setShowLogs(false)}
                className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            {/* Steps */}
            <div className="flex-1 overflow-y-auto">
              {(executionLog.steps ?? []).map((step, idx) => (
                <div key={idx} className="border-b border-gray-50 last:border-0">
                  <button
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left"
                    onClick={() => setExpandedStep(expandedStep === idx ? null : idx)}
                  >
                    <div className="shrink-0">
                      {step.status === 'completed' ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      ) : step.status === 'failed' ? (
                        <XCircle className="w-3.5 h-3.5 text-red-400" />
                      ) : (
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-medium text-gray-700">{(step as { nodeName?: string; nodeId?: string }).nodeName || (step as { nodeId?: string }).nodeId}</span>
                      <span className="ml-2 text-[10px] text-gray-400 capitalize">{(step as { nodeType?: string }).nodeType}</span>
                    </div>
                    {(step as { duration?: number }).duration !== undefined && (
                      <span className="text-[10px] text-gray-400 shrink-0">{(step as { duration?: number }).duration}ms</span>
                    )}
                    {((step as { output?: unknown }).output || step.error) && (
                      <ChevronRight className={`w-3.5 h-3.5 text-gray-300 shrink-0 transition-transform ${
                        expandedStep === idx ? 'rotate-90' : ''
                      }`} />
                    )}
                  </button>
                  {expandedStep === idx && (
                    <div className="px-4 pb-3 bg-gray-50">
                      {step.error ? (
                        <div>
                          <p className="text-[9px] font-bold text-red-400 uppercase tracking-wider mb-1">Error</p>
                          <pre className="text-[10px] text-red-500 font-mono leading-relaxed whitespace-pre-wrap bg-red-50 rounded p-2 border border-red-100">{step.error}</pre>
                        </div>
                      ) : (step as { output?: unknown }).output ? (
                        <div>
                          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Output</p>
                          <pre className="text-[10px] text-gray-600 font-mono leading-relaxed overflow-x-auto max-h-40 whitespace-pre-wrap bg-white rounded p-2 border border-gray-100">{JSON.stringify((step as { output?: unknown }).output, null, 2)}</pre>
                        </div>
                      ) : (
                        <p className="text-[10px] text-gray-400 italic">No output data</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        </div>{/* end Canvas + Logs column */}

        {/* Node Config Modal — renders as full-screen overlay */}
        {selectedNode && activePanel === 'none' && (
          <NodeConfigPanel
            node={selectedNode as unknown as WorkflowNode | null}
            nodes={nodes as unknown as WorkflowNode[]}
            edges={edges as unknown as { source: string; target: string }[]}
            onConfigUpdate={onConfigUpdate}
            onClose={() => setSelectedNode(null)}
            onDelete={onDeleteNode}
            onDuplicate={onDuplicateNode}
          />
        )}

        {activePanel === 'ai' && (
          <div className="w-[340px] shrink-0 border-l border-[var(--border)] animate-slide-right overflow-y-auto">
            <AIAssistant
              onApply={applyAISuggestion}
              onClose={() => setActivePanel('none')}
            />
          </div>
        )}

        {activePanel === 'nlBuilder' && (
          <div className="w-[340px] shrink-0 border-l border-[var(--border)] animate-slide-right overflow-y-auto">
            <LiveNLBuilder
              onApply={applyAISuggestion}
              onClose={() => setActivePanel('none')}
            />
          </div>
        )}

        {activePanel === 'optimizer' && workflowId && (
          <div className="w-[340px] shrink-0 border-l border-[var(--border)] animate-slide-right overflow-y-auto">
            <OptimizerPanel
              workflowId={workflowId}
              onClose={() => setActivePanel('none')}
            />
          </div>
        )}
      </div>
    </div>
  );
}
