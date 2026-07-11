import {
  BASE_CIRCLE_MARKER_SIZE,
  circleMarkerDivIcon,
  type CircleMarkerIconOptions,
} from "./marker-icons/circle";
import { getCircleMarkerColor, type MarkerMeta } from "./marker-meta";
import { type MarkerVisual } from "./use-marker-layer";

const HOVERED_SIZE_BUMP = 4;
const SELECTED_SIZE_BUMP = 8;

export type CircleMarkerContext = {
  attractionToBlockMap: Map<number, number>;
  blockColors: Map<number, string>;
  selectedBlockId: number | null;
  selectedBlockAttractionOrders: Map<number, number>;
  markerMeta: Map<number, MarkerMeta> | undefined;
  hoveredAttractionId: number | null;
  selectedAttractionId: number | null;
};

export type CircleMarkerDescriptor = {
  icon: CircleMarkerIconOptions;
  zIndexOffset: number;
  meta: MarkerMeta | undefined;
};

/**
 * Single source of truth for how a circle marker should look, used both when a
 * marker is first created and when its visuals are updated on interaction.
 */
export function computeCircleMarkerDescriptor(
  attractionId: number,
  ctx: CircleMarkerContext,
): CircleMarkerDescriptor {
  const attractionBlockId = ctx.attractionToBlockMap.get(attractionId);
  const isInAnyBlock = attractionBlockId !== undefined;
  const isInSelectedBlock = attractionBlockId === ctx.selectedBlockId;
  const isHovered = ctx.hoveredAttractionId === attractionId;
  const isSelected = ctx.selectedAttractionId === attractionId;
  const meta = ctx.markerMeta?.get(attractionId);
  const color = getCircleMarkerColor(
    attractionId,
    ctx.markerMeta,
    ctx.attractionToBlockMap,
    ctx.blockColors,
  );
  const orderNumber = ctx.selectedBlockAttractionOrders.get(attractionId);
  const size = isSelected
    ? BASE_CIRCLE_MARKER_SIZE + SELECTED_SIZE_BUMP
    : isHovered
      ? BASE_CIRCLE_MARKER_SIZE + HOVERED_SIZE_BUMP
      : BASE_CIRCLE_MARKER_SIZE;

  return {
    icon: {
      color,
      size,
      isInBlock: isInAnyBlock,
      isHighlighted: isHovered || isSelected,
      orderNumber: isInSelectedBlock ? orderNumber : undefined,
      isVerified: (meta?.isVerified ?? false) && !isInAnyBlock,
    },
    zIndexOffset: isSelected ? 1000 : isHovered ? 500 : 0,
    meta,
  };
}

/**
 * Descriptor turned into a ready-to-apply {@link MarkerVisual} for the browse /
 * itinerary maps, where a marker's look is derived from block/highlight/hover/
 * selection state rather than a single status.
 */
export function circleMarkerVisual(
  attractionId: number,
  ctx: CircleMarkerContext,
): MarkerVisual {
  const descriptor = computeCircleMarkerDescriptor(attractionId, ctx);
  return {
    icon: circleMarkerDivIcon(descriptor.icon),
    zIndexOffset: descriptor.zIndexOffset,
    tag: descriptor.meta
      ? { key: descriptor.meta.tag, color: descriptor.meta.color }
      : null,
  };
}
