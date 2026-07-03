import type { ReactNode } from "react";

type MapPageLayoutProps = {
  navbar: ReactNode;
  children: ReactNode;
};

export function MapPageLayout({ navbar, children }: MapPageLayoutProps) {
  return (
    <div className="min-h-screen">
      {navbar}
      <main className="flex h-[calc(100vh-73px)] flex-col">
        <div className="min-h-0 flex-1">{children}</div>
      </main>
    </div>
  );
}
