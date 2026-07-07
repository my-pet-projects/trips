import { TRPCError } from "@trpc/server";
import { Plus } from "lucide-react";
import { type Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Navbar } from "~/app/_components/navbar";
import { buttonVariants } from "~/app/_components/ui/button";
import { AttractionForm, type AttractionFormMode } from "~/app/attractions/_components/forms/attraction-form";
import { cn, validateReturnTo } from "~/lib/utils";
import { api } from "~/trpc/server";

type EditAttractionPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    returnTo?: string;
    verifyCountry?: string;
  }>;
};

const PAGE_HEADERS = {
  edit: {
    title: "Edit Attraction",
    subtitle: "Update attraction details",
  },
  verify: {
    title: "Verify Attraction",
    subtitle: "Review details and mark as verified",
  },
} as const satisfies Record<
  Exclude<AttractionFormMode, "create">,
  { title: string; subtitle: string }
>;

function buildVerifyNavbarSubtitle(
  countryName: string,
  attractionId: number,
  queue: { total: number; ids: number[] },
): string {
  const index = queue.ids.indexOf(attractionId);
  if (queue.total > 0 && index >= 0) {
    return `${countryName} · ${index + 1} of ${queue.total} unverified`;
  }
  if (queue.total > 0) {
    return `${countryName} · ${queue.total} unverified`;
  }
  return `${countryName} · all verified`;
}

export async function generateMetadata({
  searchParams,
}: EditAttractionPageProps): Promise<Metadata> {
  const { verifyCountry } = await searchParams;
  const isVerify = verifyCountry?.length === 2;

  return {
    title: isVerify ? "Verify Attraction" : "Edit Attraction",
    description: isVerify
      ? "Review and verify attraction location and details"
      : "Update information about the attraction",
  };
}

export default async function EditAttractionPage({
  params,
  searchParams,
}: EditAttractionPageProps) {
  const { id } = await params;
  const { returnTo, verifyCountry } = await searchParams;
  const attractionId = parseInt(id, 10);
  const queueCountry =
    verifyCountry?.length === 2 ? verifyCountry.toUpperCase() : undefined;
  const mode = queueCountry ? "verify" : "edit";
  const backHref = validateReturnTo(returnTo) ?? "/attractions";
  const pageHeader = PAGE_HEADERS[mode];

  if (isNaN(attractionId)) {
    notFound();
  }

  let attraction;
  try {
    attraction = await api.attraction.getAttractionById({
      id: attractionId,
    });
  } catch (error) {
    if (error instanceof TRPCError && error.code === "NOT_FOUND") {
      notFound();
    }
    throw error;
  }

  if (!attraction) {
    notFound();
  }

  let navbarSubtitle: string = pageHeader.subtitle;
  let verificationQueue: { ids: number[]; total: number } | undefined;

  if (mode === "verify" && queueCountry) {
    try {
      verificationQueue = await api.attraction.getVerificationQueue({
        countryCode: queueCountry,
      });
      navbarSubtitle = buildVerifyNavbarSubtitle(
        attraction.city.country.name,
        attractionId,
        verificationQueue,
      );
    } catch {
      navbarSubtitle = `${attraction.city.country.name} · verification queue unavailable`;
    }
  }

  return (
    <div className="flex h-dvh flex-col bg-linear-to-br from-sky-50 via-white to-orange-50">
      <Navbar
        title={pageHeader.title}
        subtitle={navbarSubtitle}
        backHref={backHref}
        actions={
          mode === "edit" ? (
            <Link
              href={`/attractions/new?isNew=true&country=${attraction.countryCode}&city=${attraction.city.name}`}
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              <Plus className="h-4 w-4" />
              New Attraction in Same Location
            </Link>
          ) : undefined
        }
      />

      <main className="flex min-h-0 flex-1 flex-col px-4 pb-4 pt-3 lg:px-6">
        {mode === "verify" && queueCountry ? (
          <AttractionForm
            mode="verify"
            attraction={attraction}
            returnTo={backHref}
            verifyCountry={queueCountry}
            verificationQueue={verificationQueue}
          />
        ) : (
          <AttractionForm
            mode="edit"
            attraction={attraction}
            returnTo={backHref}
          />
        )}
      </main>
    </div>
  );
}
