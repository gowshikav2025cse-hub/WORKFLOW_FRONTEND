"use client";

import React, { useState, useMemo } from "react";
import {
  X, Eye, EyeOff, Copy, Check, Trash2, Code2,
  ChevronDown, ChevronRight, Play, Loader2, Plus, Minus,
  ArrowRight, Table, Braces, FileText, AlertCircle,
  CheckCircle2, Clock, Settings,
} from "lucide-react";
import {
  getNodeDefinition,
  categoryColors,
  type ConfigField,
} from "../lib/nodeDefinitions";
import type { WorkflowNode } from "../lib/api";
import { NodeIcon } from "./CustomNode";
import { getBrandColor } from "./BrandIcon";

/* ── Types ── */
interface NodeConfigPanelProps {
  node: WorkflowNode | null;
  nodes?: WorkflowNode[];
  edges?: { source: string; target: string }[];
  onConfigUpdate?: (nodeId: string, config: Record<string, unknown>) => void;
  onUpdate?: (nodeId: string, config: Record<string, unknown>) => void;
  onClose: () => void;
  onDelete?: (nodeId: string) => void;
  onDuplicate?: (nodeId: string) => void;
}

type PanelTab = "input" | "params" | "output";
type ParamSubTab = "parameters" | "settings";
type DataView = "table" | "json" | "schema";

/* ══════════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT — n8n-style full-width 3-panel modal
   ══════════════════════════════════════════════════════════════════════════════ */
export default function NodeConfigPanel({
  node,
  nodes = [],
  edges = [],
  onConfigUpdate,
  onUpdate,
  onClose,
  onDelete,
  onDuplicate,
}: NodeConfigPanelProps) {
  const updateFn = onConfigUpdate ?? onUpdate ?? (() => {});
  const [activeTab, setActiveTab] = useState<PanelTab>("params");
  const [paramSubTab, setParamSubTab] = useState<ParamSubTab>("parameters");
  const [outputView, setOutputView] = useState<DataView>("table");
  const [inputView, setInputView] = useState<DataView>("table");
  const [showJson, setShowJson] = useState(false);
  const [testResult, setTestResult] = useState<Record<string, unknown> | null>(null);
  const [testError, setTestError] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);
  const [executionTime, setExecutionTime] = useState<number | null>(null);

  if (!node) return null;

  const def = getNodeDefinition(node.data.nodeType as string);
  const category = (node.data.category as string) || def?.category || "action";
  const config = (node.data.config || {}) as Record<string, string>;
  const brandColor = getBrandColor(node.data.nodeType as string);
  const accent = brandColor || "#6366f1";
  const isTrigger = category === "trigger";

  /* Compute input data from upstream node */
  const inputData = useMemo(() => {
    const incoming = edges.filter((e) => e.target === node.id);
    if (incoming.length === 0) return null;
    const sourceId = incoming[0].source;
    const sourceNode = nodes.find((n) => n.id === sourceId);
    if (!sourceNode) return null;
    return {
      nodeId: sourceNode.id,
      nodeLabel: (sourceNode.data.label as string) || "Previous Node",
      nodeType: sourceNode.data.nodeType as string,
      data: (sourceNode.data._lastOutput as Record<string, unknown>) || {
        message: "No execution data yet. Run the workflow or test the previous step first.",
      },
    };
  }, [node.id, nodes, edges]);

  const handleChange = (key: string, value: string) => {
    updateFn(node.id, { ...config, [key]: value });
  };

  /* ── Execute single node via backend ── */
  const handleExecuteStep = async () => {
    setTesting(true);
    setTestResult(null);
    setTestError(null);
    setExecutionTime(null);
    try {
      const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const payload = {
        node: { id: node.id, data: { ...node.data, config } },
        inputData: inputData?.data || {},
      };
      const res = await fetch(`${API}/api/nodes/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        setTestError(json.error || `HTTP ${res.status}`);
      } else {
        setTestResult(json.output || json);
        setExecutionTime(json._executionTime || null);
        setActiveTab("output");
      }
    } catch (err: unknown) {
      setTestError(err instanceof Error ? err.message : "Network error");
    } finally {
      setTesting(false);
    }
  };

  /* ── Visible fields (dependsOn filtering) ── */
  const visibleFields = useMemo(() => {
    if (!def?.configFields) return [];
    return def.configFields.filter((f) => {
      if (!f.dependsOn) return true;
      return config[f.dependsOn.key] === f.dependsOn.value;
    });
  }, [def, config]);

  const requiredFields = visibleFields.filter((f) => f.required);
  const optionalFields = visibleFields.filter((f) => !f.required);

  /* ── n8n-style 3 top-level tabs ── */
  const panelTabs: { id: PanelTab; label: string; count?: number }[] = [
    { id: "input", label: "Input", count: inputData ? 1 : 0 },
    { id: "params", label: "Parameters" },
    { id: "output", label: "Output", count: testResult ? 1 : 0 },
  ];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-stretch bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex flex-col w-full max-w-5xl mx-auto my-4 bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden animate-fade-in-scale">
        {/* ══ HEADER ══ */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: `${accent}18`, border: `1px solid ${accent}30` }}
            >
              <NodeIcon nodeType={node.data.nodeType as string} lucideIcon={def?.icon || "Zap"} size={18} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-800">
                {(config.__label as string) || def?.label || (node.data.label as string) || "Node"}
              </h2>
              {def?.description && <p className="text-[10px] text-gray-400">{def.description}</p>}
            </div>
            <span
              className={`ml-2 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                categoryColors[category as keyof typeof categoryColors]?.bg || "bg-gray-100"
              } ${categoryColors[category as keyof typeof categoryColors]?.text || "text-gray-500"}`}
            >
              {category}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {onDuplicate && (
              <button
                onClick={() => onDuplicate(node.id)}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all"
                title="Duplicate"
              >
                <Copy className="w-4 h-4" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(node.id)}
                className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <div className="w-px h-5 bg-gray-200 mx-1" />
            <button
              onClick={handleExecuteStep}
              disabled={testing}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[11px] font-semibold transition-all disabled:opacity-50"
              style={{ background: `${accent}20`, color: accent, border: `1px solid ${accent}35` }}
            >
              {testing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
              {isTrigger ? "Test Trigger" : "Test Step"}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ══ 3-PANEL TABS ══ */}
        <div className="flex border-b border-gray-200">
          {panelTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wider transition-all relative ${
                activeTab === tab.id ? "text-gray-800" : "text-gray-400 hover:text-gray-600"
              }`}
            >
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className="w-4 h-4 rounded-full text-[9px] flex items-center justify-center bg-emerald-500/20 text-emerald-400">
                  {tab.count}
                </span>
              )}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full" style={{ background: accent }} />
              )}
            </button>
          ))}
        </div>

        {/* ══ BODY CONTENT ══ */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {/* ─── INPUT TAB ─── */}
          {activeTab === "input" && (
            <div className="p-5 animate-fade-in">
              {inputData ? (
                <div>
                  <div className="flex items-center gap-1 mb-4">
                    {(["table", "json", "schema"] as DataView[]).map((v) => (
                      <button
                        key={v}
                        onClick={() => setInputView(v)}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-semibold uppercase tracking-wider transition-all ${
                          inputView === v ? "bg-emerald-50 text-emerald-700" : "text-gray-400 hover:text-gray-600"
                        }`}
                      >
                        {v === "table" && <Table className="w-3 h-3" />}
                        {v === "json" && <Braces className="w-3 h-3" />}
                        {v === "schema" && <FileText className="w-3 h-3" />}
                        {v}
                      </button>
                    ))}
                    <div className="ml-auto text-[10px] text-gray-400">
                      From: <span className="text-gray-600 font-medium">{inputData.nodeLabel}</span>
                    </div>
                  </div>

                  {inputView === "table" && <DataTable data={inputData.data} />}
                  {inputView === "json" && (
                    <pre className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-[11px] text-gray-600 font-mono overflow-auto max-h-[500px] whitespace-pre-wrap">
                      {JSON.stringify(inputData.data, null, 2)}
                    </pre>
                  )}
                  {inputView === "schema" && <SchemaView data={inputData.data} />}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
                    <ArrowRight className="w-6 h-6 text-gray-300" />
                  </div>
                  <p className="text-sm text-gray-400 font-medium">No input data</p>
                  <p className="text-[11px] text-gray-300 mt-1.5 max-w-xs">
                    {isTrigger
                      ? 'Trigger nodes don\'t have input data. Click "Test Trigger" to generate output.'
                      : "Connect a node to the input or execute the previous step first."}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ─── PARAMETERS TAB ─── */}
          {activeTab === "params" && (
            <div className="animate-fade-in">
              {/* Sub-tabs: Parameters | Settings */}
              <div className="flex border-b border-gray-200 px-5">
                {(["parameters", "settings"] as ParamSubTab[]).map((st) => (
                  <button
                    key={st}
                    onClick={() => setParamSubTab(st)}
                    className={`px-4 py-2.5 text-[11px] font-semibold capitalize tracking-wider transition-all relative ${
                      paramSubTab === st ? "text-gray-700" : "text-gray-400 hover:text-gray-600"
                    }`}
                  >
                    {st}
                    {paramSubTab === st && (
                      <div className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full" style={{ background: accent }} />
                    )}
                  </button>
                ))}
              </div>

              {/* Parameters sub-tab */}
              {paramSubTab === "parameters" && (
                <div className="p-5 space-y-5">
                  {/* General / Label */}
                  <FieldGroup title="General">
                    <Field
                      field={{ key: "__label", label: "Node Label", type: "text", placeholder: def?.label }}
                      value={(config.__label as string) || ""}
                      onChange={(v) => handleChange("__label", v)}
                      accent={accent}
                      config={config}
                    />
                  </FieldGroup>

                  {/* Required Fields */}
                  {requiredFields.length > 0 && (
                    <FieldGroup
                      title="Required"
                      badge={`${requiredFields.filter((f) => config[f.key]?.trim()).length}/${requiredFields.length}`}
                    >
                      {requiredFields.map((f) => (
                        <Field
                          key={f.key}
                          field={f}
                          value={config[f.key] || (f.defaultValue != null ? String(f.defaultValue) : "")}
                          onChange={(v) => handleChange(f.key, v)}
                          accent={accent}
                          config={config}
                        />
                      ))}
                    </FieldGroup>
                  )}

                  {/* Optional Fields */}
                  {optionalFields.length > 0 && (
                    <FieldGroup title="Optional" collapsible defaultOpen={optionalFields.length <= 5} badge={`${optionalFields.length}`}>
                      {optionalFields.map((f) => (
                        <Field
                          key={f.key}
                          field={f}
                          value={config[f.key] || (f.defaultValue != null ? String(f.defaultValue) : "")}
                          onChange={(v) => handleChange(f.key, v)}
                          accent={accent}
                          config={config}
                        />
                      ))}
                    </FieldGroup>
                  )}

                  {/* No config fields */}
                  {visibleFields.length === 0 && (
                    <div className="text-center py-10">
                      <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                        style={{ background: `${accent}10`, border: `1px solid ${accent}15` }}
                      >
                        <Settings className="w-6 h-6" style={{ color: `${accent}60` }} />
                      </div>
                      <p className="text-sm text-gray-400 font-medium">No configuration needed</p>
                      <p className="text-[11px] text-gray-300 mt-1.5">This node works with default settings</p>
                    </div>
                  )}
                </div>
              )}

              {/* Settings sub-tab (Advanced) */}
              {paramSubTab === "settings" && (
                <div className="p-5 space-y-5">
                  <FieldGroup title="Error Handling">
                    <Field
                      field={{ key: "__retryCount", label: "Retry Count", type: "number", placeholder: "0" }}
                      value={config["__retryCount"] || ""}
                      onChange={(v) => handleChange("__retryCount", v)}
                      accent={accent}
                      config={config}
                    />
                    <Field
                      field={{ key: "__retryDelay", label: "Retry Delay (ms)", type: "number", placeholder: "1000" }}
                      value={config["__retryDelay"] || ""}
                      onChange={(v) => handleChange("__retryDelay", v)}
                      accent={accent}
                      config={config}
                    />
                    <Field
                      field={{
                        key: "__onError",
                        label: "On Error",
                        type: "select",
                        options: [
                          { label: "Stop Workflow", value: "stop" },
                          { label: "Continue", value: "continue" },
                          { label: "Retry", value: "retry" },
                        ],
                      }}
                      value={config["__onError"] || ""}
                      onChange={(v) => handleChange("__onError", v)}
                      accent={accent}
                      config={config}
                    />
                  </FieldGroup>

                  <FieldGroup title="Timing">
                    <Field
                      field={{ key: "__timeout", label: "Timeout (ms)", type: "number", placeholder: "30000" }}
                      value={config["__timeout"] || ""}
                      onChange={(v) => handleChange("__timeout", v)}
                      accent={accent}
                      config={config}
                    />
                  </FieldGroup>

                  <FieldGroup title="Notes">
                    <Field
                      field={{ key: "__notes", label: "Developer Notes", type: "textarea", placeholder: "Add notes about this node…" }}
                      value={config["__notes"] || ""}
                      onChange={(v) => handleChange("__notes", v)}
                      accent={accent}
                      config={config}
                    />
                  </FieldGroup>

                  {/* JSON View */}
                  <div>
                    <button
                      onClick={() => setShowJson(!showJson)}
                      className="flex items-center gap-2 text-[11px] text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <Code2 className="w-3.5 h-3.5" />
                      {showJson ? "Hide" : "Show"} Raw Config
                    </button>
                    {showJson && (
                      <pre className="mt-2 p-3 rounded-xl bg-gray-50 border border-gray-200 text-[10px] text-gray-500 font-mono overflow-auto max-h-44">
                        {JSON.stringify(config, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ─── OUTPUT TAB ─── */}
          {activeTab === "output" && (
            <div className="p-5 animate-fade-in">
              {testResult ? (
                <div>
                  <div className="flex items-center gap-1 mb-4">
                    {(["table", "json", "schema"] as DataView[]).map((v) => (
                      <button
                        key={v}
                        onClick={() => setOutputView(v)}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-semibold uppercase tracking-wider transition-all ${
                          outputView === v ? "bg-emerald-50 text-emerald-700" : "text-gray-400 hover:text-gray-600"
                        }`}
                      >
                        {v === "table" && <Table className="w-3 h-3" />}
                        {v === "json" && <Braces className="w-3 h-3" />}
                        {v === "schema" && <FileText className="w-3 h-3" />}
                        {v}
                      </button>
                    ))}
                    <div className="ml-auto flex items-center gap-3 text-[10px]">
                      {executionTime != null && (
                        <span className="flex items-center gap-1 text-gray-400">
                          <Clock className="w-3 h-3" /> {executionTime}ms
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-emerald-400/60">
                        <CheckCircle2 className="w-3 h-3" /> 1 item
                      </span>
                    </div>
                  </div>

                  {outputView === "table" && <DataTable data={testResult} />}
                  {outputView === "json" && (
                    <pre className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-[11px] text-gray-600 font-mono overflow-auto max-h-[500px] whitespace-pre-wrap">
                      {JSON.stringify(testResult, null, 2)}
                    </pre>
                  )}
                  {outputView === "schema" && <SchemaView data={testResult} />}
                </div>
              ) : testError ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center mb-4">
                    <AlertCircle className="w-6 h-6 text-red-400/60" />
                  </div>
                  <p className="text-sm text-red-400/80 font-medium">Execution failed</p>
                  <p className="text-[11px] text-red-400/40 mt-1.5 max-w-sm font-mono">{testError}</p>
                  <button
                    onClick={handleExecuteStep}
                    disabled={testing}
                    className="mt-4 flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[11px] font-semibold bg-gray-100 text-gray-500 hover:text-gray-700 transition-all"
                  >
                    {testing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                    Retry
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
                    <Play className="w-6 h-6 text-gray-300" />
                  </div>
                  <p className="text-sm text-gray-400 font-medium">No output data yet</p>
                  <p className="text-[11px] text-gray-300 mt-1.5 max-w-xs">
                    Click &ldquo;{isTrigger ? "Test Trigger" : "Test Step"}&rdquo; in the header to execute this node and see its output.
                  </p>
                  <button
                    onClick={handleExecuteStep}
                    disabled={testing}
                    className="mt-5 flex items-center gap-1.5 px-5 py-2 rounded-lg text-[11px] font-semibold transition-all"
                    style={{ background: `${accent}18`, color: accent, border: `1px solid ${accent}30` }}
                  >
                    {testing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                    {isTrigger ? "Test Trigger" : "Execute Step"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ══ FOOTER ══ */}
        <div className="px-5 py-2.5 border-t border-gray-200 flex items-center justify-between bg-gray-50">
          <p className="text-[9px] text-gray-400 font-mono">{node.id}</p>
          <p className="text-[9px] text-gray-400">{def?.type || (node.data.nodeType as string)}</p>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   DATA TABLE — n8n-style key/value rendering
   ═══════════════════════════════════════════════════════════════════════════════ */
function DataTable({ data }: { data: Record<string, unknown> }) {
  if (!data || typeof data !== "object") {
    return <p className="text-[11px] text-gray-400 text-center py-6">No data</p>;
  }

  const entries = Object.entries(data);
  if (entries.length === 0) {
    return <p className="text-[11px] text-gray-400 text-center py-6">Empty object</p>;
  }

  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-50">
            <th className="text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider px-4 py-2 border-b border-gray-200">
              Key
            </th>
            <th className="text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider px-4 py-2 border-b border-gray-200">
              Value
            </th>
            <th className="text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider px-4 py-2 border-b border-gray-200 w-16">
              Type
            </th>
          </tr>
        </thead>
        <tbody>
          {entries.map(([key, val], i) => (
            <tr key={key} className={`${i % 2 === 0 ? "bg-white" : "bg-gray-50/50"} hover:bg-gray-50 transition-colors`}>
              <td className="px-4 py-2 text-[11px] font-mono text-gray-600 border-b border-gray-100">{key}</td>
              <td className="px-4 py-2 text-[11px] font-mono text-gray-800 border-b border-gray-100 max-w-xs truncate">
                {typeof val === "object" ? JSON.stringify(val) : String(val ?? "")}
              </td>
              <td className="px-4 py-2 border-b border-gray-100">
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">
                  {Array.isArray(val) ? "array" : typeof val}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   SCHEMA VIEW — shows data structure / types
   ═══════════════════════════════════════════════════════════════════════════════ */
function SchemaView({ data }: { data: Record<string, unknown> }) {
  if (!data || typeof data !== "object") {
    return <p className="text-[11px] text-gray-400 text-center py-6">No schema</p>;
  }

  return (
    <div className="space-y-1.5">
      {Object.entries(data).map(([key, val]) => (
        <div key={key} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
          <span className="text-[11px] font-mono text-gray-600">{key}</span>
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full border border-gray-200 text-gray-500">
            {Array.isArray(val) ? `array[${val.length}]` : typeof val}
          </span>
          {typeof val === "string" && (
            <span className="text-[10px] text-gray-400 truncate max-w-[200px] ml-auto">
              &ldquo;{val.slice(0, 50)}&rdquo;
            </span>
          )}
          {typeof val === "number" && <span className="text-[10px] text-emerald-600 ml-auto">{val}</span>}
          {typeof val === "boolean" && (
            <span className={`text-[10px] ml-auto ${val ? "text-emerald-600" : "text-red-500"}`}>{String(val)}</span>
          )}
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   FIELD GROUP — collapsible section
   ═══════════════════════════════════════════════════════════════════════════════ */
function FieldGroup({
  title,
  badge,
  collapsible = false,
  defaultOpen = true,
  children,
}: {
  title: string;
  badge?: string;
  collapsible?: boolean;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div>
      <button
        onClick={collapsible ? () => setIsOpen(!isOpen) : undefined}
        className={`flex items-center gap-2 mb-2.5 w-full text-left ${collapsible ? "cursor-pointer" : "cursor-default"}`}
      >
        {collapsible && (isOpen ? <ChevronDown className="w-3 h-3 text-gray-400" /> : <ChevronRight className="w-3 h-3 text-gray-400" />)}
        <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{title}</span>
        {badge && <span className="text-[9px] text-gray-400 ml-auto">{badge}</span>}
      </button>
      {isOpen && <div className="space-y-3">{children}</div>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   FIELD — renders all input types including keyvalue, multiselect, code
   ═══════════════════════════════════════════════════════════════════════════════ */
function Field({
  field,
  value,
  onChange,
  accent,
  config,
}: {
  field: ConfigField;
  value: string;
  onChange: (v: string) => void;
  accent?: string;
  config?: Record<string, string>;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  const baseClass =
    "w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-[13px] text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-emerald-400 transition-all duration-200";

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  /* ── Key-Value pairs ── */
  if (field.type === "keyvalue") {
    let pairs: [string, string][] = [];
    try {
      pairs = JSON.parse(value || "[]");
    } catch {
      pairs = [];
    }
    if (!Array.isArray(pairs)) pairs = [];

    const updatePairs = (newPairs: [string, string][]) => {
      onChange(JSON.stringify(newPairs));
    };

    return (
      <div>
        <label className="block text-[11px] font-medium text-gray-600 mb-1.5">
          {field.label}
          {field.required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        {field.hint && <p className="text-[10px] text-gray-400 mb-2">{field.hint}</p>}
        <div className="space-y-1.5">
          {pairs.map(([k, v], i) => (
            <div key={i} className="flex items-center gap-1.5">
              <input
                type="text"
                value={k}
                onChange={(e) => {
                  const np = [...pairs];
                  np[i] = [e.target.value, np[i][1]];
                  updatePairs(np);
                }}
                placeholder="Key"
                className={`${baseClass} flex-1 !py-2 text-[12px]`}
              />
              <input
                type="text"
                value={v}
                onChange={(e) => {
                  const np = [...pairs];
                  np[i] = [np[i][0], e.target.value];
                  updatePairs(np);
                }}
                placeholder="Value"
                className={`${baseClass} flex-1 !py-2 text-[12px]`}
              />
              <button
                onClick={() => {
                  const np = pairs.filter((_, idx) => idx !== i);
                  updatePairs(np);
                }}
                className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all"
              >
                <Minus className="w-3 h-3" />
              </button>
            </div>
          ))}
          <button
            onClick={() => updatePairs([...pairs, ["", ""]])}
            className="flex items-center gap-1 text-[10px] font-medium px-2.5 py-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-all"
          >
            <Plus className="w-3 h-3" /> Add pair
          </button>
        </div>
      </div>
    );
  }

  /* ── Multi-select ── */
  if (field.type === "multiselect") {
    let selected: string[] = [];
    try {
      selected = JSON.parse(value || "[]");
    } catch {
      selected = value ? [value] : [];
    }
    if (!Array.isArray(selected)) selected = [];

    const toggleOption = (val: string) => {
      const newSelected = selected.includes(val) ? selected.filter((s) => s !== val) : [...selected, val];
      onChange(JSON.stringify(newSelected));
    };

    return (
      <div>
        <label className="block text-[11px] font-medium text-gray-600 mb-1.5">
          {field.label}
          {field.required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        {field.hint && <p className="text-[10px] text-gray-400 mb-2">{field.hint}</p>}
        <div className="flex flex-wrap gap-1.5">
          {field.options?.map((opt) => {
            const isActive = selected.includes(opt.value);
            return (
              <button
                key={opt.value}
                onClick={() => toggleOption(opt.value)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all border ${
                  isActive
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-gray-200 bg-gray-50 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  /* ── Code editor ── */
  if (field.type === "code") {
    return (
      <div>
        <label className="block text-[11px] font-medium text-gray-600 mb-1.5">
          {field.label}
          {field.required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        {field.hint && <p className="text-[10px] text-gray-400 mb-2">{field.hint}</p>}
        <textarea
          rows={10}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder || "// Write your code here..."}
          className={`${baseClass} resize-y font-mono text-[12px] leading-relaxed bg-gray-50 min-h-[200px]`}
          spellCheck={false}
        />
      </div>
    );
  }

  /* ── Standard fields ── */
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="block text-[11px] font-medium text-gray-600">
          {field.label}
          {field.required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        {value && (
          <button onClick={handleCopy} className="text-[9px] text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-0.5">
            {copied ? <Check className="w-2.5 h-2.5" /> : <Copy className="w-2.5 h-2.5" />}
          </button>
        )}
      </div>
      {field.hint && <p className="text-[10px] text-gray-400 mb-2">{field.hint}</p>}

      {field.type === "select" ? (
        <select value={value} onChange={(e) => onChange(e.target.value)} className={baseClass}>
          <option value="">Select…</option>
          {field.options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : field.type === "textarea" ? (
        <textarea
          rows={3}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className={`${baseClass} resize-none font-mono text-[12px]`}
        />
      ) : field.type === "password" ? (
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder || "••••••••"}
            className={`${baseClass} pr-9`}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
        </div>
      ) : field.type === "toggle" ? (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onChange(value === "true" ? "false" : "true")}
            className={`relative w-11 h-6 rounded-full transition-all duration-200 ${
              value === "true" ? "bg-emerald-500/30" : "bg-gray-200"
            }`}
          >
            <div
              className={`absolute top-1 w-4 h-4 rounded-full transition-all duration-200 ${
                value === "true" ? "bg-emerald-400" : "bg-gray-400"
              }`}
              style={{ left: value === "true" ? "24px" : "4px" }}
            />
          </button>
          <span className="text-[11px] text-gray-500">{value === "true" ? "Enabled" : "Disabled"}</span>
        </div>
      ) : (
        <input
          type={field.type === "number" ? "number" : "text"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className={baseClass}
        />
      )}
    </div>
  );
}
