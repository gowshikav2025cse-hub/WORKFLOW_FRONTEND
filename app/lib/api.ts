// api.ts — FlowCraft Frontend API Client
// Centralizes all HTTP calls to backend; supports both server-side and client-side usage.

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WorkflowNode {
  id: string;
  type?: string;
  position: { x: number; y: number };
  data: Record<string, unknown>;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
}

export interface Workflow {
  _id: string;
  name: string;
  description?: string;
  status?: string;
  executionCount?: number;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ExecutionStep {
  nodeId?: string;
  nodeName?: string;
  nodeType?: string;
  status: 'completed' | 'failed' | 'skipped' | 'pending';
  input?: unknown;
  output?: unknown;
  error?: string;
  startedAt?: string;
  completedAt?: string;
  duration?: number;
}

export interface Execution {
  _id: string;
  workflowId: string;
  workflowName?: string;
  status: 'running' | 'completed' | 'failed' | 'pending';
  startedAt: string;
  completedAt?: string;
  duration?: number;
  triggerType?: string;
  logs: string[];
  error?: string;
  steps?: ExecutionStep[];
}

export interface AISuggestResponse {
  analysis: {
    detectedServices: string[];
    suggestedNodes: string[];
    confidence: number;
    reasoning: string;
    triggers: string[];
    actions: string[];
    conditions: string[];
  };
  template?: {
    name: string;
    description: string;
    id: string;
  };
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

export interface Template {
  id: string;
  name: string;
  description: string;
  category?: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  tags?: string[];
}

export interface OptimizationReport {
  score: number;
  suggestions: {
    type: 'warning' | 'info' | 'error' | 'improvement';
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    nodeId?: string;
  }[];
  nodeCount: number;
  edgeCount: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...(options.headers as Record<string, string>) },
    ...options,
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => `HTTP ${res.status}`);
    throw new Error(`API Error ${res.status}: ${msg}`);
  }
  return res.json() as Promise<T>;
}

// ─── Workflows ────────────────────────────────────────────────────────────────

export async function getWorkflows(): Promise<Workflow[]> {
  return apiFetch<Workflow[]>('/api/workflows');
}

export async function getWorkflow(id: string): Promise<Workflow> {
  return apiFetch<Workflow>(`/api/workflows/${id}`);
}

export async function saveWorkflow(
  payload: Partial<Workflow> & { name: string }
): Promise<Workflow> {
  if (payload._id) {
    return apiFetch<Workflow>(`/api/workflows/${payload._id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }
  return apiFetch<Workflow>('/api/workflows', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function deleteWorkflow(id: string): Promise<{ message: string }> {
  return apiFetch(`/api/workflows/${id}`, { method: 'DELETE' });
}

export async function toggleWorkflow(id: string): Promise<Workflow> {
  return apiFetch<Workflow>(`/api/workflows/${id}/toggle`, { method: 'PATCH' });
}

// ─── Executions ───────────────────────────────────────────────────────────────

export async function getExecutions(limit = 20): Promise<Execution[]> {
  return apiFetch<Execution[]>(`/api/executions?limit=${limit}`);
}

export async function getExecution(id: string): Promise<Execution> {
  return apiFetch<Execution>(`/api/executions/${id}`);
}

export async function getWorkflowExecutions(workflowId: string): Promise<Execution[]> {
  return apiFetch<Execution[]>(`/api/executions?workflowId=${workflowId}`);
}

export async function executeWorkflow(workflowId: string): Promise<Execution> {
  return apiFetch<Execution>(`/api/workflows/${workflowId}/execute`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

// ─── Demo Flow ───────────────────────────────────────────────────────────────
export async function createDemoFlow(options?: { scheduledAt?: string; customContent?: string }): Promise<{ workflow: Workflow; scheduled: boolean; scheduledAt: string | null }> {
  return apiFetch('/api/workflows/demo', {
    method: 'POST',
    body: JSON.stringify(options || {}),
  });
}

// ─── AI Suggestions / NLP ────────────────────────────────────────────────────

export async function suggestWorkflow(description: string): Promise<AISuggestResponse> {
  return apiFetch<AISuggestResponse>('/api/ai/suggest', {
    method: 'POST',
    body: JSON.stringify({ description }),
  });
}

export async function liveBuild(
  description: string
): Promise<AISuggestResponse> {
  return apiFetch<AISuggestResponse>('/api/ai/live-build', {
    method: 'POST',
    body: JSON.stringify({ description }),
  });
}

export async function optimizeWorkflow(workflowId: string): Promise<OptimizationReport> {
  return apiFetch<OptimizationReport>(`/api/ai/optimize/${workflowId}`);
}

// ─── Templates ───────────────────────────────────────────────────────────────

export async function getTemplates(): Promise<Template[]> {
  return apiFetch<Template[]>('/api/ai/templates');
}

export async function getTemplate(id: string): Promise<Template> {
  return apiFetch<Template>(`/api/ai/templates/${id}`);
}

// ─── Workflow Templates (real working templates) ────────────────────────────

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  tags: string[];
  color: string;
}

export async function getWorkflowTemplates(): Promise<WorkflowTemplate[]> {
  return apiFetch<WorkflowTemplate[]>('/api/workflows/templates');
}

export async function createFromTemplate(templateId: string): Promise<{ workflow: Workflow }> {
  return apiFetch<{ workflow: Workflow }>(`/api/workflows/templates/${templateId}/create`, {
    method: 'POST',
  });
}

/** Create from template AND execute immediately — returns workflow + execution output */
export async function runTemplate(templateId: string): Promise<{ workflow: Workflow; execution: Execution }> {
  const { workflow } = await createFromTemplate(templateId);
  const execution = await executeWorkflow(workflow._id);
  return { workflow, execution };
}

// ─── Backward-Compat Namespace Exports ───────────────────────────────────────
// These shims allow older files that use the workflowsApi / executionsApi / aiApi
// pattern to continue working without changes.

export const workflowsApi = {
  list: () => getWorkflows(),
  get: (id: string) => getWorkflow(id),
  save: (payload: Partial<Workflow> & { name: string }) => saveWorkflow(payload),
  delete: (id: string) => deleteWorkflow(id),
  toggle: (id: string) => toggleWorkflow(id),
  execute: (id: string) => executeWorkflow(id),
};

export const executionsApi = {
  list: (limit?: number) => getExecutions(limit),
  get: (id: string) => getExecution(id),
  forWorkflow: (workflowId: string) => getWorkflowExecutions(workflowId),
  /** replay — re-execute from a given step with optional input override */
  replay: (executionId: string, fromIndex?: number, overrideInputs?: Record<string, unknown>) =>
    apiFetch<Execution>('/api/executions', {
      method: 'POST',
      body: JSON.stringify({ workflowId: executionId, fromIndex, overrideInputs }),
    }),
  /** delete not yet supported server-side; no-op returning void */
  delete: async (_id: string) => { /* no-op */ },
  /** heal — self-healing analysis (stub until backend implements it) */
  heal: async (executionId: string): Promise<SelfHealingReport> =>
    apiFetch<SelfHealingReport>(`/api/executions/${executionId}/heal`),
  /** applyFix — apply a healing suggestion */
  applyFix: async (executionId: string, nodeId: string, fixIndex: number): Promise<{ success: boolean }> =>
    apiFetch(`/api/executions/${executionId}/fix`, {
      method: 'POST',
      body: JSON.stringify({ nodeId, fixIndex }),
    }),
};

export const aiApi = {
  suggest: (description: string) => suggestWorkflow(description),
  liveBuild: (description: string) => liveBuild(description),
  optimize: (workflowId: string) => optimizeWorkflow(workflowId),
  templates: () => getTemplates(),
  template: (id: string) => getTemplate(id),
};

// Legacy type aliases
export type { AISuggestResponse as LiveBuildResponse };
export type { OptimizationReport as OptimizationSuggestion };

// Self-healing types (for SelfHealingPanel backward compat)
export interface SelfHealingFix {
  description: string;
  confidence?: number;
}

export interface SelfHealingSuggestion {
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  autoFixable: boolean;
  fixes: SelfHealingFix[];
}

export interface SelfHealingStepAnalysis {
  nodeId: string;
  nodeName: string;
  error: string;
  healable: boolean;
  suggestions: SelfHealingSuggestion[];
}

export interface SelfHealingReport {
  executionId: string;
  totalIssues: number;
  autoFixable: number;
  steps: SelfHealingStepAnalysis[];
}

// ─── LinkedIn ─────────────────────────────────────────────────────────────────

export interface LinkedInStatus {
  connected: boolean;
  expired?: boolean;
  displayName?: string;
  email?: string;
  profilePicture?: string;
  connectedAt?: string;
}

export interface ScheduledPost {
  _id: string;
  name: string;
  content: string;
  scheduledAt: string | null;
  status: string;
  executionCount: number;
  isRunning: boolean;
  lastRun: { status: string; at: string } | null;
}

export async function getLinkedInStatus(): Promise<LinkedInStatus> {
  return apiFetch<LinkedInStatus>('/api/auth/linkedin/status');
}

export async function disconnectLinkedIn(): Promise<{ message: string }> {
  return apiFetch('/api/auth/linkedin', { method: 'DELETE' });
}

export async function scheduleLinkedInPost(payload: {
  content: string;
  scheduledAt: string;
  repeat?: 'none' | 'daily' | 'weekly';
  imageUrl?: string;
}): Promise<{ message: string; workflowId: string; scheduledAt: string; cronExpression: string }> {
  return apiFetch('/api/linkedin/schedule', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function postLinkedInNow(payload: {
  content: string;
  imageUrl?: string;
}): Promise<{ message: string; workflowId: string }> {
  return apiFetch('/api/linkedin/post-now', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getScheduledLinkedInPosts(): Promise<ScheduledPost[]> {
  return apiFetch<ScheduledPost[]>('/api/linkedin/scheduled');
}

export async function cancelScheduledPost(id: string): Promise<{ message: string }> {
  return apiFetch(`/api/linkedin/scheduled/${id}`, { method: 'DELETE' });
}

export function getLinkedInAuthUrl(): string {
  return `${BASE_URL}/api/auth/linkedin`;
}

// ─── System Stats ─────────────────────────────────────────────────────────────

export interface SystemStats {
  ram: { total: number; free: number; used: number; usagePercent: number };
  process: { heapUsed: number; heapTotal: number; rss: number; external: number };
  uptime: number;
  platform: string;
  cpus: number;
  nodeVersion: string;
}

export async function getSystemStats(): Promise<SystemStats> {
  return apiFetch<SystemStats>('/api/system/stats');
}

// ─── Self-Healing Demo ───────────────────────────────────────────────────────

export interface SelfHealingDemoResult {
  workflow: Workflow;
  failedExecution: { _id: string; status: string; steps: ExecutionStep[] };
  healingReport: SelfHealingReport;
  appliedFixes: { nodeId: string; fix: string }[];
  healedExecution: { _id: string; status: string; steps: ExecutionStep[] };
}

export async function createSelfHealingDemo(): Promise<SelfHealingDemoResult> {
  return apiFetch<SelfHealingDemoResult>('/api/workflows/demo-selfheal', {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

