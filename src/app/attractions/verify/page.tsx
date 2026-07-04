import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { type Metadata } from "next";
import { redirect } from "next/navigation";

import { Navbar } from "~/app/_components/navbar";
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
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <VerifyCountryPanel
              countries={countries}
              selectedCountryCode={country}
            />
          </div>

          {!country ? (
            <p className="mt-8 text-center text-sm text-gray-500">
              Select a country to start verifying.
            </p>
          ) : allVerified ? (
            <div className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 p-8 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle2 className="h-8 w-8 text-emerald-600" />
              </div>
              <h2 className="text-xl font-semibold text-emerald-900">
                All attractions verified
              </h2>
              <Link
                href={`/attractions?country=${encodeURIComponent(country)}`}
                className="mt-6 inline-flex items-center rounded-lg border border-emerald-200 bg-white px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100"
              >
                Back to attractions
              </Link>
            </div>
          ) : null}
        </main>
      </div>
    </HydrateClient>
  );
}
