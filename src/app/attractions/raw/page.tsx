import { MapPin } from "lucide-react";
import { type Metadata } from "next";

import { HydrateClient } from "~/trpc/server";
import { Navbar } from "~/app/_components/navbar";
import { RawAttractionsMap } from "./_components/raw-attractions-map";

export const metadata: Metadata = {
  title: "Raw Attractions",
};

interface PageProps {
  searchParams: Promise<{ country?: string }>;
}

export default async function RawAttractionsPage({ searchParams }: PageProps) {
  const { country } = await searchParams;

  return (
    <HydrateClient>
      <Navbar
        title="Raw Attractions"
        subtitle="Triage imported attractions"
        backHref="/attractions"
        icon={
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100">
            <MapPin className="h-6 w-6 text-violet-600" />
          </div>
        }
      />
      <main className="flex h-[calc(100vh-73px)] flex-col">
        <div className="min-h-0 flex-1">
          <RawAttractionsMap countryCode={country} />
        </div>
      </main>
    </HydrateClient>
  );
}
