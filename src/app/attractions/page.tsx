"use client";

import { MapPin, Plane, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "~/app/_components/ui/button";

export default function AttractionsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-linear-to-br from-sky-50 via-white to-orange-50">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500 text-white">
                <MapPin className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-foreground text-2xl font-bold">
                  Attractions
                </h1>
                <p className="text-muted-foreground text-sm">
                  Discover and manage places to visit
                </p>
              </div>
            </div>
            <nav className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => router.push("/")}>
                <Plane className="mr-2 h-4 w-4" />
                My Trips
              </Button>
              <Button onClick={() => router.push("/attractions/new")}>
                <Plus className="mr-2 h-4 w-4" />
                New Attraction
              </Button>
            </nav>
          </div>
        </div>
      </header>
    </div>
  );
}
