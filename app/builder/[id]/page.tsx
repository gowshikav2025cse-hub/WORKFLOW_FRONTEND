"use client";

import { use, useEffect, useState } from "react";
import { getWorkflow, type Workflow } from "../../lib/api";
import WorkflowCanvas from "../../components/WorkflowCanvas";

export default function EditBuilderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const data = await getWorkflow(id);
        setWorkflow(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load workflow");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-pulse text-muted">Loading workflow…</div>
      </div>
    );
  }

  if (error || !workflow) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-danger mb-2">{error || "Workflow not found"}</p>
          <a href="/workflows" className="text-accent-light text-sm hover:underline">
            Back to workflows
          </a>
        </div>
      </div>
    );
  }

  return <WorkflowCanvas workflow={workflow} />;
}
