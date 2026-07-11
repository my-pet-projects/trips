import { MapPin } from "lucide-react";
import { type Metadata } from "next";

import { MapPageLayout } from "~/app/_components/map-page-layout";
import { Navbar } from "~/app/_components/navbar";
import { HydrateClient } from "~/trpc/server";
import { RawTriageMap } from "./_components/raw-triage-map";

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
      <MapPageLayout
        navbar={
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
        }
      >
        <RawTriageMap countryCode={country} />
      </MapPageLayout>
    </HydrateClient>
  );
}
