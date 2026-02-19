import { Building, MapPin, Plane, Plus } from "lucide-react";
import Link from "next/link";

import { HydrateClient } from "~/trpc/server";
import { Navbar } from "./_components/navbar";

export default async function Home() {
  return (
    <HydrateClient>
      <Navbar title="Trip Manager" subtitle="Plan your perfect journey" />
      <main className="min-h-screen bg-linear-to-br from-sky-50 via-white to-orange-50">
        <div className="container mx-auto px-4 py-16">
          {/* Hero Section */}
          <div className="mb-16 text-center">
            <h1 className="mb-4 text-4xl font-bold text-gray-900 sm:text-5xl">
              Plan Your Perfect Journey
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-gray-600">
              Organize your trips, discover attractions, and create memorable
              itineraries all in one place.
            </p>
          </div>

          {/* Main Cards */}
          <div className="mx-auto grid max-w-4xl gap-8 sm:grid-cols-2">
            {/* Trips Card */}
            <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm transition-shadow hover:shadow-md">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-sky-100">
                <Plane className="h-7 w-7 text-sky-600" />
              </div>
              <h2 className="mb-2 text-2xl font-bold text-gray-900">Trips</h2>
              <p className="mb-6 text-gray-600">
                Create and manage your travel plans. Build day-by-day
                itineraries with your favorite attractions.
              </p>
              <div className="flex gap-3">
                <Link
                  href="/trips"
                  className="inline-flex items-center rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-sky-700"
                >
                  View Trips
                </Link>
                <Link
                  href="/trips/new"
                  className="inline-flex items-center rounded-lg border border-sky-600 px-4 py-2 text-sm font-medium text-sky-600 transition-colors hover:bg-sky-50"
                >
                  <Plus className="mr-1 h-4 w-4" />
                  New Trip
                </Link>
              </div>
            </div>

            {/* Attractions Card */}
            <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm transition-shadow hover:shadow-md">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-orange-100">
                <MapPin className="h-7 w-7 text-orange-600" />
              </div>
              <h2 className="mb-2 text-2xl font-bold text-gray-900">
                Attractions
              </h2>
              <p className="mb-6 text-gray-600">
                Discover and save places to visit. Build your collection of
                must-see destinations.
              </p>
              <div className="flex gap-3">
                <Link
                  href="/attractions"
                  className="inline-flex items-center rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-600"
                >
                  <Building className="mr-2 h-4 w-4" />
                  View Attractions
                </Link>
                <Link
                  href="/attractions/new"
                  className="inline-flex items-center rounded-lg border border-orange-500 px-4 py-2 text-sm font-medium text-orange-600 transition-colors hover:bg-orange-50"
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Add New
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </HydrateClient>
  );
}
