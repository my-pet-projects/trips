"use client";

import { useAuth, UserButton } from "@clerk/nextjs";
import { LogIn } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";

import { Button } from "~/app/_components/ui/button";
import { Skeleton } from "~/app/_components/ui/skeleton";

function AuthButtonInner() {
  const { isLoaded, isSignedIn } = useAuth();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const search = searchParams.toString();
  const rawUrl = search ? `${pathname}?${search}` : pathname;
  const currentUrl = encodeURIComponent(rawUrl);

  if (!isLoaded) {
    return <Skeleton className="h-10 w-24 rounded-lg" />;
  }

  if (isSignedIn) {
    return <UserButton />;
  }

  return (
    <Button variant="outline" asChild>
      <Link href={`/sign-in?redirect_url=${currentUrl}`}>
        <LogIn className="h-4 w-4" />
        Sign In
      </Link>
    </Button>
  );
}

export function AuthButton() {
  return (
    <Suspense fallback={<Skeleton className="h-10 w-24 rounded-lg" />}>
      <AuthButtonInner />
    </Suspense>
  );
}
