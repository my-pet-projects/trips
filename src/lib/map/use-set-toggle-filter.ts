import { useCallback, useState } from "react";

export function useSetToggleFilter<T extends string>(initialKeys: T[]) {
  const [visible, setVisible] = useState<Set<T>>(() => new Set(initialKeys));

  const toggle = useCallback((key: T) => {
    setVisible((prev) => {
      if (prev.has(key) && prev.size === 1) return prev;
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  return { visible, toggle, setVisible };
}
