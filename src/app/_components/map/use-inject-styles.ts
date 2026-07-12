import { useEffect } from "react";

const refCounts = new Map<string, number>();

export const useInjectStyles = (id: string, css: string) => {
  useEffect(() => {
    const count = refCounts.get(id) ?? 0;
    refCounts.set(id, count + 1);

    let el = document.getElementById(id) as HTMLStyleElement | null;
    if (!el) {
      el = document.createElement("style");
      el.id = id;
      document.head.appendChild(el);
    }
    el.textContent = css;

    return () => {
      const next = (refCounts.get(id) ?? 1) - 1;
      if (next <= 0) {
        refCounts.delete(id);
        document.getElementById(id)?.remove();
      } else {
        refCounts.set(id, next);
      }
    };
  }, [id, css]);
};
