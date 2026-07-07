"use client";

import { Calendar, Eye, Pencil } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { buttonVariants } from "~/app/_components/ui/button";
import { cn } from "~/lib/utils";

type TripModeNavProps = {
  tripId: number;
};

const MODES = [
  {
    href: (id: number) => `/trips/${id}/edit`,
    label: "Edit",
    icon: Pencil,
    segment: "edit",
  },
  {
    href: (id: number) => `/trips/${id}/itinerary`,
    label: "Itinerary",
    icon: Calendar,
    segment: "itinerary",
  },
  {
    href: (id: number) => `/trips/${id}/view`,
    label: "View",
    icon: Eye,
    segment: "view",
  },
] as const;

export function TripModeNav({ tripId }: TripModeNavProps) {
  const pathname = usePathname();
  const activeSegment = pathname.split("/").pop();

  return (
    <nav
      aria-label="Trip mode"
      className="flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1"
    >
      {MODES.map(({ href, label, icon: Icon, segment }) => {
        const active = activeSegment === segment;
        return (
          <Link
            key={segment}
            href={href(tripId)}
            prefetch
            aria-current={active ? "page" : undefined}
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "gap-1.5 px-2.5 sm:px-3",
              active
                ? "bg-sky-600 text-white hover:bg-sky-700 hover:text-white"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
            )}
          >
            <Icon className="h-4 w-4" />
            <span className="hidden sm:inline">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
