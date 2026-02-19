"use client";

import { useAuth, UserButton } from "@clerk/nextjs";
import { LogIn } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function AuthButtonInner() {
  const { isLoaded, isSignedIn } = useAuth();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const search = searchParams.toString();
  const rawUrl = search ? `${pathname}?${search}` : pathname;
  const currentUrl = encodeURIComponent(rawUrl);

  if (!isLoaded) {
    return (
      <button
        type="button"
        disabled
        className="inline-flex cursor-not-allowed items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-400"
      >
        Loading...
      </button>
    );
  }

  if (isSignedIn) {
    return <UserButton />;
  } else {
    return (
      <Link
        href={`/sign-in?redirect_url=${currentUrl}`}
        className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
      >
        <LogIn className="mr-2 h-4 w-4" />
        Sign In
      </Link>
    );
  }
}

export function AuthButton() {
  return (
    <Suspense
      fallback={
        <button
          type="button"
          disabled
          className="inline-flex cursor-not-allowed items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-400"
        >
          Loading...
        </button>
      }
    >
      <AuthButtonInner />
    </Suspense>
  );
}
