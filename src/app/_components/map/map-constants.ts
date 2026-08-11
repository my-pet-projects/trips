import type { LabeledConnectorRoute, OvernightStop, RouteData } from "~/types";

/** Stable empty map instances — avoid new Map() on every render. */
export const EMPTY_ATTRACTION_TO_BLOCK = new Map<number, number>();
export const EMPTY_BLOCK_COLORS = new Map<number, string>();
export const EMPTY_BLOCK_ORDERS = new Map<number, number>();
export const EMPTY_BLOCK_ROUTES = new Map<number, RouteData>();
export const EMPTY_LABELED_CONNECTOR_ROUTES: LabeledConnectorRoute[] = [];
export const EMPTY_BASIC_ATTRACTIONS: never[] = [];
export const EMPTY_OVERNIGHT_STOPS: OvernightStop[] = [];
