import type { ReactNode } from "react";

type MapPageLayoutProps = {
  navbar: ReactNode;
  children: ReactNode;
};

export function MapPageLayout({ navbar, children }: MapPageLayoutProps) {
  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      {navbar}
      <main className="flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1">{children}</div>
      </main>
    </div>
  );
}
