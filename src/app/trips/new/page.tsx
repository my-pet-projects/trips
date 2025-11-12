import { ArrowLeft, Calendar } from "lucide-react";
import Link from "next/link";

import { TripForm } from "~/app/trips/_components/trip-form";

export const metadata = {
  title: "Create New Trip",
  description: "Plan a new travel adventure",
};

export default function CreateTripPage() {
  return (
    <div className="min-h-screen bg-linear-to-br from-sky-50 via-white to-orange-50">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                href={`/trips`}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition-colors hover:bg-gray-50"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-100">
                <Calendar className="h-6 w-6 text-sky-600" />
              </div>
              <div>
                <h1 className="text-foreground text-2xl font-bold">
                  Create Trip
                </h1>
                <p className="text-muted-foreground text-sm">
                  Plan a new travel adventure
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <TripForm mode="create" />
      </main>
    </div>
  );
}
