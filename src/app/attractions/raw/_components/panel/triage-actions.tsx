"use client";

import type { ApproveHighlight } from "../types";

interface TriageActionsProps {
  attractionId: number;
  isMutating: boolean;
  onApprove: (id: number, highlight?: ApproveHighlight) => void;
  onReject: (id: number) => void;
  onDuplicated: (id: number) => void;
}

export function TriageActions({
  attractionId,
  isMutating,
  onApprove,
  onReject,
  onDuplicated,
}: TriageActionsProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <button
        type="button"
        disabled={isMutating}
        onClick={() => onApprove(attractionId, "must_see")}
        className="rounded-lg bg-cyan-500 px-2 py-2 text-xs font-semibold text-white hover:bg-cyan-600 disabled:opacity-50"
      >
        ★ Must see
      </button>
      <button
        type="button"
        disabled={isMutating}
        onClick={() => onApprove(attractionId, "recommended")}
        className="rounded-lg bg-emerald-500 px-2 py-2 text-xs font-semibold text-white hover:bg-emerald-600 disabled:opacity-50"
      >
        👍 Recommended
      </button>
      <button
        type="button"
        disabled={isMutating}
        onClick={() => onApprove(attractionId)}
        className="rounded-lg bg-green-500 px-2 py-2 text-xs font-semibold text-white hover:bg-green-600 disabled:opacity-50"
      >
        ✓ Approve
      </button>
      <button
        type="button"
        disabled={isMutating}
        onClick={() => onDuplicated(attractionId)}
        className="rounded-lg bg-purple-500 px-2 py-2 text-xs font-semibold text-white hover:bg-purple-600 disabled:opacity-50"
      >
        ⊕ Duplicate
      </button>
      <button
        type="button"
        disabled={isMutating}
        onClick={() => onReject(attractionId)}
        className="col-span-2 rounded-lg bg-red-500 px-2 py-2 text-xs font-semibold text-white hover:bg-red-600 disabled:opacity-50"
      >
        ✕ Reject
      </button>
    </div>
  );
}
