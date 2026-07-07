"use client";

import {
  ArrowLeft,
  Building,
  Calendar,
  CheckCircle2,
  Compass,
  CopyPlus,
  Database,
  MapPin,
  Menu,
  Plane,
  Plus,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode, useState } from "react";

import { cn } from "~/lib/utils";
import { AuthButton } from "./auth-button";
import { Button } from "./ui/button";

type NavbarProps = {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  backHref?: string;
  actions?: ReactNode;
};

function NavSectionLink({
  href,
  active,
  activeClassName,
  onClick,
  children,
}: {
  href: string;
  active: boolean;
  activeClassName: string;
  onClick?: () => void;
  children: ReactNode;
}) {
  return (
    <Button
      asChild
      variant="ghost"
      className={cn(
        "h-9 px-3",
        active
          ? activeClassName
          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
      )}
    >
      <Link
        href={href}
        onClick={onClick}
        aria-current={active ? "page" : undefined}
      >
        {children}
      </Link>
    </Button>
  );
}

function NavCtaLink({
  href,
  onClick,
  className,
  children,
}: {
  href: string;
  onClick?: () => void;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Button asChild className={className}>
      <Link href={href} onClick={onClick}>
        {children}
      </Link>
    </Button>
  );
}

function NavOutlineLink({
  href,
  onClick,
  className,
  children,
}: {
  href: string;
  onClick?: () => void;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Button asChild variant="outline" className={className}>
      <Link href={href} onClick={onClick}>
        {children}
      </Link>
    </Button>
  );
}

export function Navbar({
  title,
  subtitle,
  icon,
  backHref,
  actions,
}: NavbarProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isTripsSection = pathname.startsWith("/trips");
  const isAttractionsSection = pathname.startsWith("/attractions");
  const isRawAttractionsSection = pathname.startsWith("/attractions/raw");
  const isTripsRoot = pathname === "/trips";
  const isAttractionsRoot = pathname === "/attractions";

  const defaultIcon = isTripsSection ? (
    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-100">
      <Calendar className="h-6 w-6 text-sky-600" />
    </div>
  ) : isRawAttractionsSection ? (
    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100">
      <Database className="h-6 w-6 text-violet-600" />
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

  const closeMobileMenu = () => setMobileMenuOpen(false);

  const attractionOutlineClass =
    "border-orange-500 bg-orange-50 text-orange-700 hover:bg-orange-100 hover:text-orange-800";

  return (
    <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {backHref && (
              <Button
                asChild
                variant="outline"
                size="icon"
                className="size-10"
              >
                <Link href={backHref} data-testid="navbar-back-button">
                  <ArrowLeft className="h-5 w-5" />
                  <span className="sr-only">Back</span>
                </Link>
              </Button>
            )}
            <Link
              href="/"
              className="flex items-center gap-3 transition-opacity hover:opacity-80"
            >
              {icon ?? defaultIcon}
              <div className="hidden sm:block">
                <h1 className="text-foreground text-2xl font-bold">{title}</h1>
                {subtitle && (
                  <p className="text-muted-foreground text-sm">{subtitle}</p>
                )}
              </div>
            </Link>

            <div className="ml-6 hidden items-center gap-2 md:flex">
              <NavSectionLink
                href="/trips"
                active={isTripsSection}
                activeClassName="bg-sky-50 text-sky-700 hover:bg-sky-100 hover:text-sky-800"
              >
                <Plane className="h-4 w-4" />
                Trips
              </NavSectionLink>
              <NavSectionLink
                href="/attractions"
                active={isAttractionsSection}
                activeClassName="bg-orange-50 text-orange-700 hover:bg-orange-100 hover:text-orange-800"
              >
                <Building className="h-4 w-4" />
                Attractions
              </NavSectionLink>
            </div>
          </div>

          <nav className="hidden items-center gap-3 md:flex">
            {isTripsRoot && (
              <NavCtaLink
                href="/trips/new"
                className="bg-sky-600 text-white hover:bg-sky-700"
              >
                <Plus className="h-4 w-4" />
                New Trip
              </NavCtaLink>
            )}
            {isAttractionsRoot && (
              <>
                <NavCtaLink
                  href="/attractions/new"
                  className="bg-orange-500 text-white hover:bg-orange-600"
                >
                  <Plus className="h-4 w-4" />
                  New Attraction
                </NavCtaLink>
                <NavOutlineLink
                  href="/attractions/parse"
                  className={attractionOutlineClass}
                >
                  <CopyPlus className="h-4 w-4" />
                  Parse Attractions
                </NavOutlineLink>
                <NavOutlineLink
                  href="/attractions/map"
                  className={attractionOutlineClass}
                >
                  <MapPin className="h-4 w-4" />
                  View Map
                </NavOutlineLink>
                <NavOutlineLink
                  href="/attractions/raw"
                  className="border-violet-500 bg-violet-50 text-violet-700 hover:bg-violet-100 hover:text-violet-800"
                >
                  <Database className="h-4 w-4" />
                  Raw
                </NavOutlineLink>
                <NavOutlineLink
                  href="/attractions/verify"
                  className="border-emerald-500 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Verify
                </NavOutlineLink>
              </>
            )}

            {actions}
            <AuthButton />
          </nav>

          <div className="flex items-center gap-3 md:hidden">
            <AuthButton />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-nav-menu"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div id="mobile-nav-menu" className="mt-4 border-t pt-4 md:hidden">
            <div className="flex flex-col gap-2">
              <NavSectionLink
                href="/trips"
                active={isTripsSection}
                activeClassName="bg-sky-50 text-sky-700 hover:bg-sky-100 hover:text-sky-800"
                onClick={closeMobileMenu}
              >
                <Plane className="h-5 w-5" />
                Trips
              </NavSectionLink>
              <NavSectionLink
                href="/attractions"
                active={isAttractionsSection}
                activeClassName="bg-orange-50 text-orange-700 hover:bg-orange-100 hover:text-orange-800"
                onClick={closeMobileMenu}
              >
                <Building className="h-5 w-5" />
                Attractions
              </NavSectionLink>

              {isTripsRoot && (
                <NavCtaLink
                  href="/trips/new"
                  onClick={closeMobileMenu}
                  className="mt-2 h-11 bg-sky-600 text-white hover:bg-sky-700"
                >
                  <Plus className="h-4 w-4" />
                  New Trip
                </NavCtaLink>
              )}
              {isAttractionsRoot && (
                <>
                  <NavCtaLink
                    href="/attractions/new"
                    onClick={closeMobileMenu}
                    className="mt-2 h-11 bg-orange-500 text-white hover:bg-orange-600"
                  >
                    <Plus className="h-4 w-4" />
                    New Attraction
                  </NavCtaLink>
                  <NavOutlineLink
                    href="/attractions/parse"
                    onClick={closeMobileMenu}
                    className={cn("h-11", attractionOutlineClass)}
                  >
                    <CopyPlus className="h-4 w-4" />
                    Parse Attractions
                  </NavOutlineLink>
                  <NavOutlineLink
                    href="/attractions/map"
                    onClick={closeMobileMenu}
                    className={cn("h-11", attractionOutlineClass)}
                  >
                    <MapPin className="h-4 w-4" />
                    View Map
                  </NavOutlineLink>
                  <NavOutlineLink
                    href="/attractions/raw"
                    onClick={closeMobileMenu}
                    className="h-11 border-violet-500 bg-violet-50 text-violet-700 hover:bg-violet-100 hover:text-violet-800"
                  >
                    <Database className="h-4 w-4" />
                    Raw
                  </NavOutlineLink>
                  <NavOutlineLink
                    href="/attractions/verify"
                    onClick={closeMobileMenu}
                    className="h-11 border-emerald-500 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Verify
                  </NavOutlineLink>
                </>
              )}

              {actions && <div className="mt-2">{actions}</div>}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
