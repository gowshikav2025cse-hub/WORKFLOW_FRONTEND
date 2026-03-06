"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  executionsApi,
  type Execution,
} from "../lib/api";
import {
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Trash2,
  ExternalLink,
} from "lucide-react";

export default function MonitorPage() {
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadExecutions();
  }, []);

  async function loadExecutions() {
    try {
      const data = await executionsApi.list(100);
      setExecutions(data);
    } catch {
      // API not ready
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await executionsApi.delete(id);
      setExecutions((prev) => prev.filter((e) => e._id !== id));
    } catch {
      alert("Failed to delete execution");
    }
  }

  const filtered = executions.filter(
    (e) =>
      e.workflowName?.toLowerCase().includes(search.toLowerCase()) ||
      e.status.includes(search.toLowerCase())
  );

  const statusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-5 w-5 text-success" />;
      case "failed":
        return <XCircle className="h-5 w-5 text-danger" />;
      case "running":
        return <Clock className="h-5 w-5 text-warning animate-pulse" />;
      default:
        return <Clock className="h-5 w-5 text-muted" />;
    }
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      completed: "bg-success/10 text-success",
      failed: "bg-danger/10 text-danger",
      running: "bg-warning/10 text-warning",
      cancelled: "bg-zinc-500/10 text-zinc-400",
    };
    return (
      <span
        className={`text-[11px] font-medium px-2 py-0.5 rounded-full capitalize ${
          colors[status] || colors.cancelled
        }`}
      >
        {status}
      </span>
    );
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Execution Monitor
        </h1>
        <p className="text-sm text-muted mt-1">
          Track and inspect workflow execution history
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search executions…"
          className="w-full rounded-lg border border-card-border bg-card pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-pulse text-muted">Loading…</div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="h-16 w-16 rounded-2xl bg-accent/10 flex items-center justify-center mb-4">
            <Activity className="h-8 w-8 text-accent-light" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-1">
            No executions yet
          </h3>
          <p className="text-sm text-muted max-w-xs">
            Run a workflow to see execution logs here.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-card-border bg-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-card-border">
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider">
                  Workflow
                </th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider">
                  Trigger
                </th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider">
                  Steps
                </th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider">
                  Duration
                </th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider">
                  Started
                </th>
                <th className="text-right px-4 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((ex) => (
                <tr
                  key={ex._id}
                  className="border-b border-card-border/50 hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {statusIcon(ex.status)}
                      {statusBadge(ex.status)}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-foreground">
                      {ex.workflowName}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-muted capitalize">
                      {ex.triggerType || 'manual'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-muted">
                      {(ex.steps || []).length} steps
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-mono text-muted">
                      {ex.duration != null ? `${ex.duration}ms` : '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-muted">
                      {new Date(ex.startedAt).toLocaleString()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/monitor/${ex._id}`}
                        className="p-1.5 rounded-md hover:bg-gray-100 text-muted hover:text-foreground transition-colors"
                        title="View details"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                      <button
                        onClick={() => handleDelete(ex._id)}
                        className="p-1.5 rounded-md hover:bg-danger/10 text-zinc-600 hover:text-danger transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
