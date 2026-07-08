"use client";

import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  MapPin,
  Route,
  Trash2,
} from "lucide-react";

import { usePlanBlockRoute } from "~/lib/itinerary/use-plan-block-route-map";
import { getPlanBlockColor } from "~/lib/map/colors";
import type { PlanBlock, PlanBlockFieldPatch, Trip } from "~/types";
import { PlanDateRange } from "./plan-date-range";
import { Badge } from "~/app/_components/ui/badge";
import { Button } from "~/app/_components/ui/button";
import { Input } from "~/app/_components/ui/input";
import { Separator } from "~/app/_components/ui/separator";
import { Spinner } from "~/app/_components/ui/spinner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/app/_components/ui/tooltip";
import { PlanBlockAttractionList } from "./plan-block-attraction-list";
import { PlanBlockPdfButton } from "./plan-block-pdf-export-button";

export type PlanBlockCardState = {
  isSelected: boolean;
  isRemoving: boolean;
  selectedAttractionId: number | null;
};

export type PlanBlockCardActions = {
  select: () => void;
  update: (patch: PlanBlockFieldPatch) => void;
  remove: () => void;
  move: (direction: "up" | "down") => void;
  selectAttraction: (attractionId: number) => void;
  hoverAttraction: (attractionId: number | null) => void;
  removeAttraction: (attractionId: number) => void;
  reorderAttractions: (attractions: PlanBlock["attractions"]) => void;
};

export type PlanBlockCardProps = {
  block: PlanBlock;
  index: number;
  trip: Pick<Trip, "startDate" | "endDate">;
  state: PlanBlockCardState;
  actions: PlanBlockCardActions;
};

export function PlanBlockCard({
  block,
  index,
  trip,
  state,
  actions,
}: PlanBlockCardProps) {
  const { isSelected, isRemoving, selectedAttractionId } = state;
  const {
    select,
    update,
    remove,
    move,
    selectAttraction,
    hoverAttraction,
    removeAttraction,
    reorderAttractions,
  } = actions;

  const color = getPlanBlockColor(index);

  const { routeData, isLoadingRoute, routeError } = usePlanBlockRoute(
    block.id,
    block.attractions,
  );

  const attractionCount = block.attractions.length;

  return (
    <div
      onClick={select}
      className={`group/card w-full cursor-pointer rounded-xl border-2 bg-white p-4 transition-all duration-300 ${
        isSelected
          ? "ring-opacity-20 shadow-lg ring-2"
          : "border-gray-200 shadow-sm hover:border-gray-300 hover:shadow-md"
      } ${
        isRemoving
          ? "pointer-events-none scale-95 opacity-50 blur-sm grayscale"
          : ""
      }`}
      style={
        isSelected
          ? ({
              borderColor: color,
              "--tw-ring-color": color,
            } as React.CSSProperties)
          : {}
      }
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <div
            className="h-4 w-4 shrink-0 rounded-full border-2 border-white shadow-md ring-1 ring-gray-200 transition-transform group-hover/card:scale-110"
            style={{ backgroundColor: color }}
          />
          <div className="min-w-0 flex-1">
            <Input
              value={block.name}
              maxLength={100}
              aria-label="Plan name"
              className="h-8 border-transparent bg-transparent px-1 font-semibold shadow-none hover:border-gray-200 focus-visible:border-input"
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
              onChange={(e) => update({ name: e.target.value })}
              onBlur={() => {
                const trimmed = block.name.trim();
                if (!trimmed) {
                  update({ name: `Plan ${block.blockNumber}` });
                } else if (trimmed !== block.name) {
                  update({ name: trimmed });
                }
              }}
            />
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <div className="flex overflow-hidden rounded-lg border border-gray-300 bg-linear-to-b from-white to-gray-50 shadow-sm">
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="px-2 py-1.5 text-gray-600 hover:bg-blue-50 hover:text-blue-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                    onClick={(e) => {
                      e.stopPropagation();
                      move("up");
                    }}
                    disabled={block.blockNumber === 1 || isRemoving}
                    aria-label="Move plan up"
                  />
                }
              >
                <ChevronUp className="h-4 w-4 transition-transform" />
              </TooltipTrigger>
              <TooltipContent>Move plan up</TooltipContent>
            </Tooltip>
            <Separator orientation="vertical" className="h-auto" />
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="px-2 py-1.5 text-gray-600 hover:bg-blue-50 hover:text-blue-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                    onClick={(e) => {
                      e.stopPropagation();
                      move("down");
                    }}
                    disabled={isRemoving}
                    aria-label="Move plan down"
                  />
                }
              >
                <ChevronDown className="h-4 w-4 transition-transform" />
              </TooltipTrigger>
              <TooltipContent>Move plan down</TooltipContent>
            </Tooltip>
          </div>
          {attractionCount > 0 && (
            <Badge variant="muted" className="gap-1 px-2.5 py-1 font-semibold shadow-sm ring-1 ring-gray-300/50">
              <MapPin className="h-3 w-3" />
              {attractionCount}
            </Badge>
          )}
          {attractionCount > 0 && (
            <PlanBlockPdfButton
              block={block}
              color={color}
              disabled={isRemoving}
            />
          )}
          <Tooltip>
            <TooltipTrigger
              type="button"
              aria-label="Remove plan"
              onClick={(e) => {
                e.stopPropagation();
                remove();
              }}
              disabled={isRemoving}
              className="rounded-lg p-1.5 text-gray-400 transition-all hover:bg-red-50 hover:text-red-600 hover:shadow-sm active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Trash2 className="h-4 w-4" />
            </TooltipTrigger>
            <TooltipContent>Remove plan</TooltipContent>
          </Tooltip>
        </div>
      </div>

      <PlanDateRange
        value={{
          pinnedStartDate: block.pinnedStartDate,
          pinnedEndDate: block.pinnedEndDate,
        }}
        tripStartDate={trip.startDate}
        tripEndDate={trip.endDate}
        onChange={update}
      />

      {attractionCount >= 2 && (
        <div className="mb-3 flex items-center gap-3 rounded-lg bg-linear-to-r from-blue-50 to-sky-50 px-3 py-2 text-xs">
          {isLoadingRoute ? (
            <>
              <Spinner className="h-4 w-4 text-sky-600" />
              <span className="text-gray-600">Calculating route...</span>
            </>
          ) : routeData ? (
            <>
              <div className="flex items-center gap-1.5 text-gray-700">
                <Route className="h-3.5 w-3.5 text-sky-600" />
                <span className="font-semibold">
                  {routeData.totalKm.toFixed(1)} km
                </span>
              </div>
              <div className="h-3 w-px bg-sky-200" />
              <div className="flex items-center gap-1.5 text-gray-700">
                <Clock className="h-3.5 w-3.5 text-sky-600" />
                <span className="font-semibold">
                  {Math.round(routeData.totalDurationMinutes)} min
                </span>
              </div>
            </>
          ) : routeError ? (
            <div className="flex flex-col gap-0.5 text-amber-600">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span className="font-medium">Unable to calculate route</span>
              </div>
              <p className="ml-5 text-xs text-amber-700">{routeError}</p>
            </div>
          ) : null}
        </div>
      )}

      {attractionCount === 0 ? (
        <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 py-8 transition-colors group-hover/card:border-gray-300 group-hover/card:bg-gray-100">
          <p className="text-sm text-gray-400 italic">
            Click attractions on the map to add them
          </p>
        </div>
      ) : (
        <PlanBlockAttractionList
          attractions={block.attractions}
          color={color}
          selectedAttractionId={selectedAttractionId}
          routeLegs={routeData?.legs}
          onSelectAttraction={selectAttraction}
          onHoverAttraction={hoverAttraction}
          onRemoveAttraction={removeAttraction}
          onReorder={reorderAttractions}
        />
      )}
    </div>
  );
}
