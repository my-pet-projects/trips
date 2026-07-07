"use client";

import { Copy, X } from "lucide-react";

import { HIGHLIGHT_OPTIONS } from "~/app/_components/highlight-toggle-group";
import { Button } from "~/app/_components/ui/button";
import { HIGHLIGHT_COLORS, RAW_STATUS_COLORS } from "~/lib/map/colors";
import { cn } from "~/lib/utils";
import type { ApproveHighlight } from "../types";

interface TriageActionsProps {
  attractionId: number;
  isMutating: boolean;
  onApprove: (id: number, highlight?: ApproveHighlight) => void;
  onReject: (id: number) => void;
  onDuplicated: (id: number) => void;
}

const APPROVE_HIGHLIGHTS = HIGHLIGHT_OPTIONS.filter(
  (option): option is (typeof HIGHLIGHT_OPTIONS)[number] & {
    value: "must_see" | "recommended";
  } => option.value === "must_see" || option.value === "recommended",
);

const actionButtonClass = "h-auto py-2 text-xs font-semibold";

export function TriageActions({
  attractionId,
  isMutating,
  onApprove,
  onReject,
  onDuplicated,
}: TriageActionsProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {APPROVE_HIGHLIGHTS.map(({ value, label, icon: Icon }) => (
        <Button
          key={value}
          type="button"
          disabled={isMutating}
          onClick={() => onApprove(attractionId, value)}
          className={cn(actionButtonClass, HIGHLIGHT_COLORS[value].button)}
        >
          <Icon className="h-3.5 w-3.5" />
          {label}
        </Button>
      ))}
      <Button
        type="button"
        disabled={isMutating}
        onClick={() => onApprove(attractionId)}
        className={cn(actionButtonClass, HIGHLIGHT_COLORS.none.button)}
      >
        Approve
      </Button>
      <Button
        type="button"
        disabled={isMutating}
        onClick={() => onDuplicated(attractionId)}
        className={cn(actionButtonClass, RAW_STATUS_COLORS.duplicated.button)}
      >
        <Copy className="h-3.5 w-3.5" />
        Duplicate
      </Button>
      <Button
        type="button"
        disabled={isMutating}
        onClick={() => onReject(attractionId)}
        className={cn(
          actionButtonClass,
          "col-span-2",
          RAW_STATUS_COLORS.rejected.button,
        )}
      >
        <X className="h-3.5 w-3.5" />
        Reject
      </Button>
    </div>
  );
}
