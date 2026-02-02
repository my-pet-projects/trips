"use client";

import { TRPCClientError } from "@trpc/client";
import {
  AlertCircle,
  CheckCircle2,
  Globe,
  Loader2,
  MapPin,
  Plus,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { CountryCitySelector } from "~/app/_components/geo/country-city-selector";
import { Button } from "~/app/_components/ui/button";
import { Label } from "~/app/_components/ui/label";
import { api, type RouterOutputs } from "~/trpc/react";

type City = RouterOutputs["geo"]["getCitiesByCountry"][number];
type Country = RouterOutputs["geo"]["getCountries"][number];

const urlListSchema = z
  .string()
  .transform((t) =>
    t
      .split("\n")
      .map((u) => u.trim())
      .filter(Boolean),
  )
  .refine((arr) => arr.length > 0, "Paste at least one URL")
  .refine(
    (arr) => arr.every((u) => z.string().url().safeParse(u).success),
    "Every line must be a valid URL",
  );

type UrlProcessingStatus = {
  url: string;
  status: "pending" | "parsing" | "creating" | "success" | "error";
  error?: string;
  attractionId?: number;
};

function useUrlListValidation(initialValue: string = "") {
  const [raw, setRaw] = useState(initialValue);

  const parseResult = useMemo(() => {
    const result = urlListSchema.safeParse(raw);
    return result;
  }, [raw]);

  const parsedUrls = parseResult.success ? parseResult.data : [];
  const error = parseResult.success
    ? null
    : z.treeifyError(parseResult.error).errors.join(", ");
  const isValid = parseResult.success;

  const onChange = useCallback((v: string) => {
    setRaw(v);
  }, []);

  return { raw, urls: parsedUrls, onChange, error, isValid };
}

const getErrorMessage = (error: unknown): string => {
  if (error instanceof TRPCClientError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "An unexpected error occurred";
};

export function AttractionParseForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [urlStatuses, setUrlStatuses] = useState<UrlProcessingStatus[]>([]);
  const [showResults, setShowResults] = useState(false);

  const {
    raw: urlRaw,
    urls,
    onChange: setUrlRaw,
    error: urlListError,
    isValid: isUrlListValid,
  } = useUrlListValidation();

  const parseSiteMutation = api.attractionScraper.parseUrl.useMutation();
  const createMutation = api.attraction.create.useMutation();

  const handleLocationChange = useCallback(
    (country: Country | null, city: City | null) => {
      setSelectedCountry(country);
      setSelectedCity(city);
    },
    [],
  );

  const updateUrlStatus = useCallback(
    (url: string, updates: Partial<UrlProcessingStatus>) => {
      setUrlStatuses((prev) =>
        prev.map((status) =>
          status.url === url ? { ...status, ...updates } : status,
        ),
      );
    },
    [],
  );

  const parseAndCreateAll = async () => {
    if (!selectedCountry || !selectedCity) {
      toast.error("Please select a country and city first.", {
        description: "Location information is required for new attractions.",
      });
      return;
    }
    if (!isUrlListValid || urls.length === 0) {
      toast.error("Please provide at least one valid URL to parse.", {
        description: urlListError ?? "No valid URLs found",
      });
      return;
    }

    setIsSubmitting(true);
    setShowResults(true);

    // Initialize status for all URLs
    const initialStatuses: UrlProcessingStatus[] = urls.map((url) => ({
      url,
      status: "pending",
    }));
    setUrlStatuses(initialStatuses);

    let successfulCreations = 0;
    const totalUrls = urls.length;
    const failedUrls: string[] = [];

    const toastId = toast.loading(`Processing 0/${totalUrls} attractions...`, {
      description: "This might take a moment.",
    });

    try {
      for (let i = 0; i < urls.length; i++) {
        const url = urls[i]!;

        try {
          // Update status to parsing
          updateUrlStatus(url, { status: "parsing" });
          toast.loading(`Processing ${i + 1}/${totalUrls} attractions...`, {
            id: toastId,
            description: `Parsing: ${url.substring(0, 50)}${url.length > 50 ? "..." : ""}`,
          });

          const scrapedData = await parseSiteMutation.mutateAsync({ url });

          // Update status to creating
          updateUrlStatus(url, { status: "creating" });
          toast.loading(`Processing ${i + 1}/${totalUrls} attractions...`, {
            id: toastId,
            description: `Creating: ${scrapedData.name}`,
          });

          const created = await createMutation.mutateAsync({
            ...scrapedData,
            sourceUrl: url,
            countryCode: selectedCountry.cca2,
            cityId: selectedCity.id,
          });

          // Update status to success
          updateUrlStatus(url, {
            status: "success",
            attractionId: created.id,
          });
          successfulCreations++;
        } catch (e) {
          const errorMessage = getErrorMessage(e);
          updateUrlStatus(url, {
            status: "error",
            error: errorMessage,
          });
          failedUrls.push(url);

          // Show individual error but don't break the flow
          console.error(`Failed to process ${url}:`, errorMessage);
        }
      }

      // Final summary toast
      if (successfulCreations === totalUrls) {
        toast.success(`Successfully created all ${totalUrls} attractions! 🎉`, {
          id: toastId,
          duration: 5000,
        });
      } else if (successfulCreations > 0) {
        toast.warning(
          `Created ${successfulCreations} out of ${totalUrls} attractions`,
          {
            id: toastId,
            description: `${failedUrls.length} failed. See details below.`,
            duration: 7000,
          },
        );
      } else {
        toast.error(`Failed to create any attractions`, {
          id: toastId,
          description: "Check the errors below for details.",
          duration: 7000,
        });
      }

      if (successfulCreations > 0) {
        router.refresh();
      }
    } catch (globalError) {
      toast.error("An unexpected error occurred during bulk processing.", {
        description: getErrorMessage(globalError),
        id: toastId,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = useCallback(() => {
    setUrlRaw("");
    setUrlStatuses([]);
    setShowResults(false);
  }, [setUrlRaw]);

  const isFormValid =
    selectedCountry !== null && selectedCity !== null && isUrlListValid;

  const successCount = urlStatuses.filter((s) => s.status === "success").length;
  const errorCount = urlStatuses.filter((s) => s.status === "error").length;
  const processingCount = urlStatuses.filter(
    (s) => s.status === "parsing" || s.status === "creating",
  ).length;

  return (
    <div className="mx-auto max-w-4xl">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void parseAndCreateAll();
        }}
        className="space-y-6"
        autoComplete="off"
      >
        {/* Location Card */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3 border-b pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100">
              <Globe className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Location</h2>
              <p className="text-sm text-gray-500">
                Geographic information for new attractions
              </p>
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <Label className="mb-1.5 block text-sm font-medium text-gray-700">
                Country & City <span className="text-red-500">*</span>
              </Label>
              <CountryCitySelector
                onChange={handleLocationChange}
                showLabels={false}
              />
              {!selectedCountry && (
                <p className="mt-2 flex items-center gap-1.5 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  Please select a country.
                </p>
              )}
              {!selectedCity && selectedCountry && (
                <p className="mt-2 flex items-center gap-1.5 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  Please select a city.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* URLs to scrape Card */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3 border-b pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-100">
              <MapPin className="h-5 w-5 text-sky-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                URLs to scrape
              </h2>
              <p className="text-sm text-gray-500">
                Provide one attraction URL per line
              </p>
            </div>
          </div>
          <div className="space-y-5">
            <div>
              <textarea
                value={urlRaw}
                onChange={(e) => setUrlRaw(e.target.value)}
                placeholder="https://example.com/attraction1&#10;https://example.com/attraction2&#10;https://example.com/attraction3"
                className={`w-full rounded-md border p-3 text-sm transition-colors ${
                  urlListError
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                    : "border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                }`}
                rows={8}
                disabled={isSubmitting}
              />
              {urlListError && (
                <p className="mt-2 flex items-center gap-1.5 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  {urlListError}
                </p>
              )}
              {urls.length > 0 && !urlListError && (
                <div className="mt-3 rounded-md bg-green-50 p-3">
                  <p className="text-sm font-medium text-green-800">
                    ✓ Ready to process {urls.length} URL
                    {urls.length !== 1 ? "s" : ""}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Processing Results */}
        {showResults && urlStatuses.length > 0 && (
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between border-b pb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Processing Results
              </h2>
              <div className="flex gap-4 text-sm">
                {successCount > 0 && (
                  <span className="flex items-center gap-1 text-green-600">
                    <CheckCircle2 className="h-4 w-4" />
                    {successCount} success
                  </span>
                )}
                {errorCount > 0 && (
                  <span className="flex items-center gap-1 text-red-600">
                    <XCircle className="h-4 w-4" />
                    {errorCount} failed
                  </span>
                )}
                {processingCount > 0 && (
                  <span className="flex items-center gap-1 text-blue-600">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {processingCount} processing
                  </span>
                )}
              </div>
            </div>
            <div className="max-h-96 space-y-2 overflow-y-auto">
              {urlStatuses.map((status, idx) => (
                <div
                  key={idx}
                  className={`rounded-md p-3 text-sm ${
                    status.status === "success"
                      ? "border border-green-200 bg-green-50"
                      : status.status === "error"
                        ? "border border-red-200 bg-red-50"
                        : status.status === "parsing" ||
                            status.status === "creating"
                          ? "border border-blue-200 bg-blue-50"
                          : "border border-gray-200 bg-gray-50"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {status.status === "success" && (
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
                    )}
                    {status.status === "error" && (
                      <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                    )}
                    {(status.status === "parsing" ||
                      status.status === "creating") && (
                      <Loader2 className="mt-0.5 h-5 w-5 shrink-0 animate-spin text-blue-600" />
                    )}
                    {status.status === "pending" && (
                      <div className="mt-0.5 h-5 w-5 shrink-0 rounded-full border-2 border-gray-300" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-gray-900">
                        {status.url}
                      </p>
                      {status.error && (
                        <p className="mt-1 text-red-700">{status.error}</p>
                      )}
                      {status.status === "parsing" && (
                        <p className="mt-1 text-blue-700">
                          Parsing attraction data...
                        </p>
                      )}
                      {status.status === "creating" && (
                        <p className="mt-1 text-blue-700">
                          Creating attraction...
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          {showResults && !isSubmitting && (
            <Button
              type="button"
              variant="outline"
              onClick={resetForm}
              className="h-12 px-6"
            >
              Process More URLs
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
            className="h-12 px-6"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || !isFormValid}
            className="h-12 bg-orange-500 px-6 hover:bg-orange-600 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Parse and Create{" "}
                {urls.length > 0 ? `(${urls.length})` : "Attractions"}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
