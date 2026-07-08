"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import type { AttractionDetail, AttractionSummary } from "~/types";

import { AttractionDetailPanel } from "./attraction-detail-panel";

export type AttractionMapStatus = {
  blockId: number | undefined;
  isInAnyBlock: boolean;
  isInSelectedBlock: boolean;
};

export type AttractionMapShellProps = {
  attractions: AttractionSummary[] | AttractionDetail[];
  selectedAttractionId: number | null;
  selectedAttractionDetail?: AttractionDetail | null;
  onAttractionSelect: (attractionId: number | null) => void;
  onHighlightChange?: (
    attractionId: number,
    highlight: "must_see" | "recommended" | "skip" | null,
  ) => void;
  onDeleteAttraction?: (attractionId: number) => void;
  onAddToPlan?: (attraction: AttractionDetail) => void;
  selectedBlockId?: number | null;
  resolveAttractionStatus?: (attraction: AttractionDetail) => AttractionMapStatus;
  className?: string;
  children: (
    panelHeight: number,
    attractionsMap: Map<number, AttractionSummary | AttractionDetail>,
  ) => ReactNode;
};

export function AttractionMapShell({
  attractions,
  selectedAttractionId,
  selectedAttractionDetail,
  onAttractionSelect,
  onHighlightChange,
  onDeleteAttraction,
  onAddToPlan,
  selectedBlockId = null,
  resolveAttractionStatus,
  className,
  children,
}: AttractionMapShellProps) {
  const attractionsMap = useMemo(
    () => new Map(attractions.map((a) => [a.id, a])),
    [attractions],
  );

  const [panelAttraction, setPanelAttraction] = useState<AttractionDetail | null>(null);
  const [panelHeight, setPanelHeight] = useState(0);

  useEffect(() => {
    if (selectedAttractionDetail) {
      setPanelAttraction(selectedAttractionDetail);
    } else if (selectedAttractionId) {
      const fromMap = attractionsMap.get(selectedAttractionId);
      if (fromMap && "city" in fromMap) {
        setPanelAttraction(fromMap as AttractionDetail);
      }
    }
  }, [selectedAttractionDetail, selectedAttractionId, attractionsMap]);

  const handleClose = useCallback(() => {
    onAttractionSelect(null);
  }, [onAttractionSelect]);

  const handlePanelClosed = useCallback(() => {
    setPanelAttraction(null);
  }, []);

  const attractionStatus = useMemo(() => {
    if (!panelAttraction) return null;
    return (
      resolveAttractionStatus?.(panelAttraction) ?? {
        blockId: undefined,
        isInAnyBlock: false,
        isInSelectedBlock: false,
      }
    );
  }, [panelAttraction, resolveAttractionStatus]);

  return (
    <div
      className={`relative h-full overflow-hidden ${className ?? "rounded-lg border border-gray-200 bg-white shadow-sm"}`}
    >
      {children(panelHeight, attractionsMap)}

      {panelAttraction && attractionStatus && (
        <AttractionDetailPanel
          attraction={panelAttraction}
          attractionStatus={attractionStatus}
          selectedBlockId={selectedBlockId}
          isOpen={!!selectedAttractionId}
          onClose={handleClose}
          onClosed={handlePanelClosed}
          onAddToPlan={onAddToPlan && panelAttraction ? () => onAddToPlan(panelAttraction) : undefined}
          onPanelHeightChange={setPanelHeight}
          onHighlightChange={onHighlightChange}
          onDelete={onDeleteAttraction}
        />
      )}
    </div>
  );
}
