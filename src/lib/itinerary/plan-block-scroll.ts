const pendingScrollBlockIds = new Set<number>();

export function markPlanBlockForScroll(blockId: number) {
  pendingScrollBlockIds.add(blockId);
}

export function consumePlanBlockScroll(blockId: number) {
  if (!pendingScrollBlockIds.has(blockId)) return false;
  pendingScrollBlockIds.delete(blockId);
  return true;
}
