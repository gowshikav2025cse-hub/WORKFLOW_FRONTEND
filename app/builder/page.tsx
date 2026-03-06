"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import WorkflowCanvas from "../components/WorkflowCanvas";

function BuilderContent() {
  const searchParams = useSearchParams();
  const showAI = searchParams.get("ai") === "1";

  return <WorkflowCanvas />;
}

export default function BuilderPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          <div className="animate-pulse text-muted">Loading builder…</div>
        </div>
      }
    >
      <BuilderContent />
    </Suspense>
  );
}
