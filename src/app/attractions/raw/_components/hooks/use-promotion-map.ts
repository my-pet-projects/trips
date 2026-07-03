import { useCallback, useRef } from "react";

export function usePromotionMap() {
  const promotionMapRef = useRef(new Map<number, number>());

  const setPromotion = useCallback((rawId: number, realId: number) => {
    promotionMapRef.current.set(rawId, realId);
  }, []);

  const clearPromotion = useCallback((rawId: number) => {
    promotionMapRef.current.delete(rawId);
  }, []);

  const resolveExistingId = useCallback((id: number): number => {
    if (id >= 0) return id;
    return promotionMapRef.current.get(-id) ?? id;
  }, []);

  return { promotionMapRef, setPromotion, clearPromotion, resolveExistingId };
}
