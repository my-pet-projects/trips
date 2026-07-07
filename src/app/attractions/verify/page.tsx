import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { type Metadata } from "next";
import { redirect } from "next/navigation";

import { Navbar } from "~/app/_components/navbar";
import { Button } from "~/app/_components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "~/app/_components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "~/app/_components/ui/empty";
import { HydrateClient, api } from "~/trpc/server";

import { VerifyCountryPanel } from "./_components/verify-country-panel";

export const metadata: Metadata = {
  title: "Verify Attractions",
  description: "Review and verify attraction locations and details",
};

type PageProps = {
  searchParams: Promise<{ country?: string }>;
};

export default async function VerifyAttractionsPage({ searchParams }: PageProps) {
  const { country: rawCountry } = await searchParams;
  const country =
    rawCountry?.length === 2 ? rawCountry.toUpperCase() : undefined;

  let allVerified = false;

  if (country) {
    const queue = await api.attraction.getVerificationQueue({
      countryCode: country,
    });

    if (queue.total > 0) {
      const firstId = queue.ids[0];
      if (firstId != null) {
        redirect(
          `/attractions/${firstId}/edit?${new URLSearchParams({
            verifyCountry: country,
            returnTo: `/attractions?country=${encodeURIComponent(country)}`,
          }).toString()}`,
        );
      }
    }

    allVerified = queue.total === 0;
  }

  const countries = await api.geo.getCountries();

  return (
    <HydrateClient>
      <div className="min-h-screen bg-linear-to-br from-sky-50 via-white to-orange-50">
        <Navbar
          title="Verify Attractions"
          subtitle="Review locations and mark attractions as verified"
          backHref="/attractions"
          icon={
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            </div>
          }
        />

        <main className="container mx-auto max-w-3xl px-4 py-8">
          <Card className="border border-gray-200 bg-white shadow-sm ring-0">
            <CardHeader>
              <CardTitle>Select a country</CardTitle>
            </CardHeader>
            <CardContent>
              <VerifyCountryPanel
                countries={countries}
                selectedCountryCode={country}
              />
            </CardContent>
          </Card>

          {!country ? (
            <Empty className="mt-8 border-gray-200 bg-white/70">
              <EmptyHeader>
                <EmptyMedia>
                  <CheckCircle2 className="size-10 text-emerald-500" />
                </EmptyMedia>
                <EmptyTitle>Select a country to start</EmptyTitle>
                <EmptyDescription>
                  Choose a country above to review unverified attractions.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : allVerified ? (
            <Empty className="mt-6 border-emerald-200 bg-emerald-50">
              <EmptyHeader>
                <EmptyMedia>
                  <CheckCircle2 className="size-10 text-emerald-600" />
                </EmptyMedia>
                <EmptyTitle className="text-emerald-900">
                  All attractions verified
                </EmptyTitle>
                <EmptyDescription className="text-emerald-800">
                  Every attraction in this country has been reviewed.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button variant="outline" className="border-emerald-200 text-emerald-700" asChild>
                  <Link href={`/attractions?country=${encodeURIComponent(country)}`}>
                    Back to attractions
                  </Link>
                </Button>
              </EmptyContent>
            </Empty>
          ) : null}
        </main>
      </div>
    </HydrateClient>
  );
}
