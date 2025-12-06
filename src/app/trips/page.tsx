import { UserButton } from "@clerk/nextjs";
import { Building, Calendar, Plus } from "lucide-react";
import Link from "next/link";

import { TripsList } from "~/app/trips/_components/trip-list";

export const metadata = {
  title: "Trip List",
  description: "Manage your travel plans",
};

export default async function TripsPage() {
  return (
    <div className="min-h-screen bg-linear-to-br from-sky-50 via-white to-orange-50">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10" />
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-100">
                <Calendar className="h-6 w-6 text-sky-600" />
              </div>
              <div>
                <h1 className="text-foreground text-2xl font-bold">Trips</h1>
                <p className="text-muted-foreground text-sm">
                  Manage your travel plans
                </p>
              </div>
            </div>
            <nav className="flex items-center gap-4">
              <Link
                href="/attractions"
                className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
              >
                <Building className="mr-2 h-4 w-4" />
                Attractions
              </Link>
              <Link
                href="/trips/new"
                className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
              >
                <Plus className="mr-2 h-4 w-4" />
                New Trip
              </Link>
              <UserButton />
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <TripsList />
      </main>
    </div>
  );
}
