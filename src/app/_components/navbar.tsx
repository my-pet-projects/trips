"use client";

import {
  ArrowLeft,
  Building,
  Calendar,
  Compass,
  CopyPlus,
  MapPin,
  Plane,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode } from "react";
import { AuthButton } from "./auth-button";

type NavbarProps = {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  backHref?: string;
  actions?: ReactNode;
};

export function Navbar({
  title,
  subtitle,
  icon,
  backHref,
  actions,
}: NavbarProps) {
  const pathname = usePathname();

  const isTripsSection = pathname.startsWith("/trips");
  const isAttractionsSection = pathname.startsWith("/attractions");
  const isTripsRoot = pathname === "/trips";
  const isAttractionsRoot = pathname === "/attractions";

  // Default icons based on section
  const defaultIcon = isTripsSection ? (
    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-100">
      <Calendar className="h-6 w-6 text-sky-600" />
    </div>
  ) : isAttractionsSection ? (
    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500 text-white">
      <MapPin className="h-6 w-6" />
    </div>
  ) : (
    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-linear-to-br from-sky-500 to-orange-500 text-white">
      <Compass className="h-6 w-6" />
    </div>
  );

  return (
    <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Left side */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              {backHref && (
                <Link
                  href={backHref}
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition-colors hover:bg-gray-50"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              )}
              <Link
                href="/"
                className="flex items-center gap-3 transition-opacity hover:opacity-80"
              >
                {icon ?? defaultIcon}
                <div>
                  <h1 className="text-foreground text-2xl font-bold">
                    {title}
                  </h1>
                  {subtitle && (
                    <p className="text-muted-foreground text-sm">{subtitle}</p>
                  )}
                </div>
              </Link>
            </div>

            {/* Section tabs */}
            <div className="flex items-center gap-2">
              <Link
                href="/trips"
                className={`inline-flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isTripsSection
                    ? "bg-sky-50 text-sky-700"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <Plane className="mr-2 h-4 w-4" />
                Trips
              </Link>
              <Link
                href="/attractions"
                className={`inline-flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isAttractionsSection
                    ? "bg-orange-50 text-orange-700"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <Building className="mr-2 h-4 w-4" />
                Attractions
              </Link>
            </div>
          </div>

          {/* Right side */}
          <nav className="flex items-center gap-3">
            {/* New item buttons - only on root pages */}
            {isTripsRoot && (
              <Link
                href="/trips/new"
                className="inline-flex items-center justify-center rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-sky-700 focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:outline-none"
              >
                <Plus className="mr-2 h-4 w-4" />
                New Trip
              </Link>
            )}
            {isAttractionsRoot && (
              <>
                <Link
                  href="/attractions/new"
                  className="inline-flex items-center justify-center rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-600 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:outline-none"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  New Attraction
                </Link>
                <Link
                  href="/attractions/parse"
                  className="inline-flex items-center justify-center rounded-lg border border-orange-500 bg-orange-50 px-4 py-2 text-sm font-medium text-orange-700 transition-colors hover:bg-orange-100 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:outline-none"
                >
                  <CopyPlus className="mr-2 h-4 w-4" />
                  Parse Attractions
                </Link>
              </>
            )}

            {/* Custom actions */}
            {actions}

            {/* Auth button */}
            <AuthButton />
          </nav>
        </div>
      </div>
    </header>
  );
}
