"use client";

import { AlertCircle, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Navbar } from "./navbar";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
  title: string;
  subtitle?: string;
};

export function ErrorPage({ error, reset, title, subtitle }: ErrorPageProps) {
  useEffect(() => {
    console.error(`${title} error:`, error);
  }, [error, title]);

  return (
    <div className="min-h-screen bg-linear-to-br from-sky-50 via-white to-orange-50">
      <Navbar title={title} subtitle={subtitle ?? "Something went wrong"} />

      <main className="container mx-auto px-4 py-6">
        <div className="mx-auto max-w-2xl">
          <Card className="border-red-200 bg-red-50 ring-0">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <CardTitle className="text-red-900">
                    Error Loading {title}
                  </CardTitle>
                  <CardDescription className="text-red-700">
                    We encountered a problem while loading this page
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <div className="rounded border border-red-300 bg-white p-4">
                <p className="font-mono text-sm text-red-800">
                  {error.message || "An unexpected error occurred"}
                </p>
                {error.digest && (
                  <p className="mt-2 text-xs text-red-600">
                    Error ID: {error.digest}
                  </p>
                )}
              </div>
            </CardContent>

            <CardFooter className="flex-col gap-3 border-red-200 bg-transparent sm:flex-row">
              <Button
                type="button"
                onClick={reset}
                className="h-11 w-full bg-red-600 hover:bg-red-700 sm:w-auto"
              >
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-11 w-full bg-white sm:w-auto"
              >
                <Link href="/">Go Home</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </main>
    </div>
  );
}
