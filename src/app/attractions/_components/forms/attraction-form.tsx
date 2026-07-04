"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertTriangle,
  CheckCircle,
  Clipboard,
  Globe,
  Loader2,
  Map as MapIcon,
  MapPin,
  Plus,
  Save,
  Scan,
  SkipForward,
  XCircle,
} from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { CountryCitySelector } from "~/app/_components/geo/country-city-selector";
import { Button } from "~/app/_components/ui/button";
import { Input } from "~/app/_components/ui/input";
import { Label } from "~/app/_components/ui/label";
import { Textarea } from "~/app/_components/ui/textarea";
import { getTrpcErrorMessage } from "~/lib/trpc-error-message";
import { validateReturnTo } from "~/lib/utils";
import {
  attractionFormSchema,
  nullableNumberInput,
  nullableStringInput,
  type AttractionFormData,
} from "~/lib/validators/attraction";
import { api } from "~/trpc/react";
import type { AttractionDetail, City, Country } from "~/types";

import { HighlightPicker } from "./highlight-picker";

export type AttractionFormMode = "create" | "edit" | "verify";

type AttractionFormBaseProps = {
  returnTo?: string;
};

type AttractionFormCreateProps = AttractionFormBaseProps & {
  mode: "create";
};

type AttractionFormEditProps = AttractionFormBaseProps & {
  mode: "edit";
  attraction: AttractionDetail;
};

type AttractionFormVerifyProps = AttractionFormBaseProps & {
  mode: "verify";
  attraction: AttractionDetail;
  verifyCountry: string;
  verificationQueue?: { ids: number[] };
};

export type AttractionFormProps =
  | AttractionFormCreateProps
  | AttractionFormEditProps
  | AttractionFormVerifyProps;

function getExistingAttractionDefaultValues(
  attraction: AttractionDetail,
): AttractionFormData {
  return {
    name: attraction.name,
    nameLocal: attraction.nameLocal ?? "",
    description: attraction.description ?? "",
    latitude: attraction.latitude ?? null,
    longitude: attraction.longitude ?? null,
    sourceUrl: attraction.sourceUrl ?? null,
    countryCode: attraction.countryCode,
    cityId: attraction.city.id,
    isVerified: attraction.isVerified ?? false,
    highlight: attraction.highlight ?? null,
  };
}

function getVerificationQueueNextId(
  queueIds: number[] | undefined,
  currentId: number | undefined,
): number | null {
  if (queueIds == null || currentId == null) return null;
  const index = queueIds.indexOf(currentId);
  if (index < 0 || index >= queueIds.length - 1) return null;
  return queueIds[index + 1] ?? null;
}

const isValidCoordinate = (value: number | null | undefined): boolean => {
  return Number.isFinite(value ?? NaN);
};

const DynamicAttractionMap = dynamic(
  () =>
    import("~/app/_components/map/attraction-map").then(
      (mod) => mod.AttractionMap,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full min-h-48 w-full items-center justify-center rounded-lg border border-gray-200 bg-gray-50">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-gray-400" />
          <p className="mt-2 text-sm text-gray-600">Loading map...</p>
        </div>
      </div>
    ),
  },
);

export function AttractionForm(props: AttractionFormProps) {
  const { mode, returnTo } = props;
  const verifyCountry = props.mode === "verify" ? props.verifyCountry : undefined;
  const verificationQueue =
    props.mode === "verify" ? props.verificationQueue : undefined;
  const attraction = props.mode === "create" ? undefined : props.attraction;
  const router = useRouter();
  const searchParams = useSearchParams();
  const isVerifyMode = mode === "verify";
  const verificationQueueNextId = getVerificationQueueNextId(
    verificationQueue?.ids,
    attraction?.id,
  );
  const params = new URLSearchParams(searchParams.toString());
  const isNew = params.get("isNew") === "true";
  const country = isNew ? (params.get("country") ?? undefined) : undefined;
  const city = isNew ? (params.get("city") ?? undefined) : undefined;
  const cancelHref = validateReturnTo(returnTo) ?? "/attractions";
  const initialCountry =
    mode === "create" ? (country ?? "") : (attraction?.countryCode ?? "");
  const initialCity =
    mode === "create" ? (city ?? "") : (attraction?.city.name ?? "");

  const form = useForm<AttractionFormData>({
    resolver: zodResolver(attractionFormSchema),
    defaultValues:
      props.mode === "create"
        ? {
            name: "",
            nameLocal: "",
            description: "",
            latitude: null,
            longitude: null,
            sourceUrl: null,
            countryCode: country ?? "",
            isVerified: false,
            highlight: null,
          }
        : getExistingAttractionDefaultValues(props.attraction),
  });

  const [highlight, isVerified, currentLatitude, currentLongitude, sourceUrl] =
    useWatch({
      control: form.control,
      name: [
        "highlight",
        "isVerified",
        "latitude",
        "longitude",
        "sourceUrl",
      ],
    });

  const parseSiteMutation = api.attractionScraper.parseUrl.useMutation({
    onMutate: () => {
      toast.loading("Parsing site data...", { id: "parse-site" });
    },
    onSuccess: (data) => {
      toast.dismiss("parse-site");

      form.setValue("latitude", data.latitude);
      form.setValue("longitude", data.longitude);
      form.setValue("name", data.name);
      form.setValue("nameLocal", data.localName);
      form.setValue("description", data.description);

      void form.trigger([
        "latitude",
        "longitude",
        "name",
        "nameLocal",
        "description",
      ]);

      toast.success("Site parsed successfully!", {
        description: "Form fields have been updated with parsed data.",
      });
    },
    onError: (error) => {
      toast.dismiss("parse-site");
      toast.error("Failed to parse site", {
        description: getTrpcErrorMessage(error),
      });
    },
  });

  const createMutation = api.attraction.create.useMutation({
    onSuccess: (data) => {
      toast.success("Attraction created!", {
        description: "The attraction has been created successfully.",
      });
      router.push(`/attractions/${data.id}/edit`);
    },
    onError: (err) => {
      toast.error("Failed to create attraction", {
        description: getTrpcErrorMessage(err),
      });
    },
  });

  const updateMutation = api.attraction.update.useMutation({
    onSuccess: () => {
      if (isVerifyMode) {
        toast.success(
          verificationQueueNextId != null
            ? "Verified"
            : "All attractions verified",
        );
        navigateToNextInQueue();
        return;
      }

      toast.success("Attraction updated!", {
        description: "Changes have been saved successfully.",
      });
    },
    onError: (err) => {
      toast.error(
        isVerifyMode ? "Failed to verify attraction" : "Failed to update attraction",
        { description: getTrpcErrorMessage(err) },
      );
    },
  });

  const isSubmitting =
    createMutation.isPending ||
    updateMutation.isPending ||
    parseSiteMutation.isPending;

  const navigateToNextInQueue = () => {
    if (!verifyCountry) return;

    if (verificationQueueNextId != null) {
      router.push(
        `/attractions/${verificationQueueNextId}/edit?${new URLSearchParams({
          verifyCountry,
          returnTo: `/attractions?country=${encodeURIComponent(verifyCountry)}`,
        }).toString()}`,
      );
      return;
    }

    router.push(
      `/attractions?country=${encodeURIComponent(verifyCountry)}`,
    );
  };

  const handleSkipInQueue = () => {
    navigateToNextInQueue();
  };

  const handleParseSourceUrl = () => {
    if (!sourceUrl?.trim()) {
      toast.error("Source URL required", {
        description: "Please enter a URL to parse.",
      });
      return;
    }
    parseSiteMutation.mutate({ url: sourceUrl });
  };

  const onSubmit = async (data: AttractionFormData) => {
    try {
      if (mode === "create") {
        await createMutation.mutateAsync(data);
        return;
      }

      await updateMutation.mutateAsync({
        id: props.attraction.id,
        ...data,
        ...(mode === "verify" ? { isVerified: true } : {}),
      });
    } catch {
      // Mutation onError callbacks show user-facing toasts.
    }
  };

  const handleLocationChange = (country: Country | null, city: City | null) => {
    if (country) {
      form.setValue("countryCode", country.cca2);
      form.clearErrors("countryCode");
    } else {
      form.setValue("countryCode", "");
    }

    if (city) {
      form.setValue("cityId", city.id);
      form.clearErrors("cityId");
    } else {
      form.resetField("cityId");
    }
  };

  const handleMapCoordinatesChange = (lat: number, lng: number) => {
    form.setValue("latitude", lat, { shouldValidate: true, shouldDirty: true });
    form.setValue("longitude", lng, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  const handlePasteCoordinates = async (field: "latitude" | "longitude") => {
    try {
      const text = await navigator.clipboard.readText();
      const numbers = text
        .split(/[\s,]+/)
        .map((token) => token.trim())
        .filter((token) => token.length > 0)
        .map(Number)
        .filter((value) => Number.isFinite(value));

      if (numbers.length >= 2) {
        form.setValue("latitude", numbers[0], {
          shouldValidate: true,
          shouldDirty: true,
        });
        form.setValue("longitude", numbers[1], {
          shouldValidate: true,
          shouldDirty: true,
        });
        await form.trigger(["latitude", "longitude"]);
        toast.success("Coordinates pasted", {
          description: `Lat: ${numbers[0]}, Lng: ${numbers[1]}`,
        });
      } else if (numbers.length === 1) {
        form.setValue(field, numbers[0], {
          shouldValidate: true,
          shouldDirty: true,
        });
        await form.trigger(field);
        toast.success(
          `${field === "latitude" ? "Latitude" : "Longitude"} pasted`,
          { description: `${numbers[0]}` },
        );
      } else {
        toast.error("No valid coordinates found", {
          description: "Clipboard doesn't contain valid numbers.",
        });
      }
    } catch (err) {
      toast.error("Failed to paste", {
        description: "Unable to read clipboard contents.",
      });
      console.error("Failed to read clipboard contents: ", err);
    }
  };

  const hasValidLatitude = isValidCoordinate(currentLatitude);
  const hasValidLongitude = isValidCoordinate(currentLongitude);

  const mapLatitude =
    hasValidLatitude && currentLatitude != null
      ? currentLatitude
      : mode !== "create"
        ? (attraction?.latitude ?? 0)
        : 0;

  const mapLongitude =
    hasValidLongitude && currentLongitude != null
      ? currentLongitude
      : mode !== "create"
        ? (attraction?.longitude ?? 0)
        : 0;

  const openMap = (mapType: "osm" | "google") => {
    if (!hasValidLatitude || !hasValidLongitude) return;

    const url =
      mapType === "osm"
        ? `https://www.openstreetmap.org/?mlat=${mapLatitude}&mlon=${mapLongitude}#map=16/${mapLatitude}/${mapLongitude}`
        : `https://www.google.com/maps?q=${mapLatitude},${mapLongitude}`;

    window.open(url, "_blank");
  };

  const currentCity = mode !== "create" ? attraction?.city : undefined;

  const submitIcon = isSubmitting ? (
    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
  ) : mode === "verify" ? (
    <CheckCircle className="mr-2 h-4 w-4" />
  ) : mode === "create" ? (
    <Plus className="mr-2 h-4 w-4" />
  ) : (
    <Save className="mr-2 h-4 w-4" />
  );

  const submitLabel = isSubmitting
    ? mode === "create"
      ? "Creating..."
      : "Saving…"
    : mode === "verify"
      ? "Verify & next"
      : mode === "create"
        ? "Create Attraction"
        : "Save Changes";

  return (
    <div className="flex h-full min-h-0 flex-col">
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex min-h-0 flex-1 flex-col gap-3 lg:gap-4"
        autoComplete="nope"
      >
        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto lg:flex-row lg:items-stretch lg:gap-4 lg:overflow-hidden">
          {/* Details column */}
          <div className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm lg:min-h-0 lg:flex-1 lg:w-1/2 lg:p-6">
            <div className="shrink-0 flex items-center gap-3 border-b border-gray-200 pb-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-100">
                <MapPin className="h-5 w-5 text-sky-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Basic Information
                </h2>
                <p className="text-sm text-gray-500">
                  Core details about the attraction
                </p>
              </div>
            </div>

            <div className="grid shrink-0 gap-3 lg:grid-cols-2">
              <div>
                <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                  Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  autoComplete="nope"
                  {...form.register("name")}
                  className="mt-1 h-10"
                  placeholder="Enter attraction name"
                />
                {form.formState.errors.name && (
                  <p className="mt-1 text-sm text-red-600">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="nameLocal" className="text-sm font-medium text-gray-700">
                  Local Name
                </Label>
                <Input
                  id="nameLocal"
                  autoComplete="nope"
                  {...form.register("nameLocal")}
                  className="mt-1 h-10"
                  placeholder="Local name (optional)"
                />
                {form.formState.errors.nameLocal && (
                  <p className="mt-1 text-sm text-red-600">
                    {form.formState.errors.nameLocal.message}
                  </p>
                )}
              </div>
            </div>

            <div className="flex min-h-0 flex-col lg:flex-1">
              <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                Description
              </Label>
              <Textarea
                id="description"
                {...form.register("description")}
                className="mt-1 min-h-16 flex-1 resize-none lg:min-h-0"
                placeholder="Enter a description"
              />
              {form.formState.errors.description && (
                <p className="mt-1 shrink-0 text-sm text-red-600">
                  {form.formState.errors.description.message}
                </p>
              )}
            </div>

            <div className="flex shrink-0 flex-col gap-3 lg:mt-auto lg:pt-1">
              <HighlightPicker
                value={highlight}
                compact
                onChange={(value) =>
                  form.setValue("highlight", value, { shouldDirty: true })
                }
              />

              <div>
                <Label htmlFor="sourceUrl" className="text-sm font-medium text-gray-700">
                  Source URL
                </Label>
                <div className="mt-1 flex items-center gap-2">
                  <Input
                    id="sourceUrl"
                    autoComplete="nope"
                    type="url"
                    {...form.register("sourceUrl", {
                      setValueAs: nullableStringInput,
                    })}
                    className="h-10 font-mono text-sm"
                    placeholder="https://example.com"
                  />
                  <Button
                    type="button"
                    onClick={handleParseSourceUrl}
                    disabled={parseSiteMutation.isPending}
                    title="Parse site for data"
                    variant="outline"
                    className="h-10 w-10 shrink-0 p-0"
                  >
                    {parseSiteMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Scan className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {form.formState.errors.sourceUrl && (
                  <p className="mt-1 text-sm text-red-600">
                    {form.formState.errors.sourceUrl.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Location column */}
          <div className="flex min-h-48 flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm lg:min-h-0 lg:flex-1 lg:w-1/2 lg:overflow-hidden lg:p-6">
            <div className="flex items-center gap-3 border-b border-gray-200 pb-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-100">
                <Globe className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Location</h2>
                <p className="text-sm text-gray-500">Geographic information</p>
              </div>
            </div>

            <div className="relative z-10 shrink-0">
              <Label className="mb-1 block text-sm font-medium text-gray-700">
                Country & City <span className="text-red-500">*</span>
              </Label>
              <CountryCitySelector
                initialCountry={initialCountry}
                initialCity={initialCity}
                onChange={handleLocationChange}
                showLabels={false}
              />
              {(form.formState.errors.countryCode ??
                form.formState.errors.cityId) && (
                <p className="mt-1 text-sm text-red-600">
                  {form.formState.errors.countryCode?.message ??
                    form.formState.errors.cityId?.message}
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-end gap-2">
              <div className="grid min-w-0 flex-1 grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="latitude" className="text-xs">
                    Latitude
                  </Label>
                  <div className="relative mt-1">
                    <Input
                      id="latitude"
                      autoComplete="nope"
                      type="number"
                      step="any"
                      {...form.register("latitude", {
                        setValueAs: nullableNumberInput,
                      })}
                      className="h-10 pr-9 font-mono text-sm"
                      placeholder="40.712776"
                    />
                    <button
                      type="button"
                      onClick={() => handlePasteCoordinates("latitude")}
                      title="Paste from clipboard"
                      className="absolute inset-y-0 right-0 flex items-center pr-2 text-gray-400 hover:text-gray-600"
                    >
                      <Clipboard className="h-4 w-4" />
                    </button>
                  </div>
                  {form.formState.errors.latitude && (
                    <p className="mt-1 text-xs text-red-600">
                      {form.formState.errors.latitude.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="longitude" className="text-xs">
                    Longitude
                  </Label>
                  <div className="relative mt-1">
                    <Input
                      id="longitude"
                      autoComplete="nope"
                      type="number"
                      step="any"
                      {...form.register("longitude", {
                        setValueAs: nullableNumberInput,
                      })}
                      className="h-10 pr-9 font-mono text-sm"
                      placeholder="-74.005974"
                    />
                    <button
                      type="button"
                      onClick={() => handlePasteCoordinates("longitude")}
                      title="Paste from clipboard"
                      className="absolute inset-y-0 right-0 flex items-center pr-2 text-gray-400 hover:text-gray-600"
                    >
                      <Clipboard className="h-4 w-4" />
                    </button>
                  </div>
                  {form.formState.errors.longitude && (
                    <p className="mt-1 text-xs text-red-600">
                      {form.formState.errors.longitude.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => openMap("osm")}
                  title="Open in OpenStreetMap"
                  disabled={!hasValidLatitude || !hasValidLongitude}
                  className="h-10 w-10"
                >
                  <MapIcon className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => openMap("google")}
                  title="Open in Google Maps"
                  disabled={!hasValidLatitude || !hasValidLongitude}
                  className="h-10 w-10"
                >
                  <MapPin className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="relative z-0 min-h-48 flex-1 lg:min-h-0">
              <DynamicAttractionMap
                latitude={mapLatitude}
                longitude={mapLongitude}
                currentCity={currentCity}
                onCoordinatesChange={handleMapCoordinatesChange}
                className="absolute inset-0 h-full w-full"
              />
            </div>

            <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 rounded-md border border-dashed border-gray-300 bg-gray-50 px-3 py-2">
              <div className="min-w-0">
                <p className="text-xs font-medium text-gray-900">
                  Location verification
                </p>
                <p className="text-xs text-gray-600">
                  {isVerifyMode
                    ? "Check the marker, then verify below."
                    : "Confirm the marker is correct."}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {isVerified ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
                    <CheckCircle className="h-3.5 w-3.5" />
                    Verified
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2.5 py-1 text-xs font-medium text-yellow-700">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Not verified
                  </span>
                )}

                {!isVerifyMode ? (
                  !isVerified ? (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => form.setValue("isVerified", true)}
                      disabled={!hasValidLatitude || !hasValidLongitude}
                      className="h-8 gap-1.5 px-2.5 text-xs"
                    >
                      <CheckCircle className="h-3.5 w-3.5" />
                      Mark verified
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => form.setValue("isVerified", false)}
                      className="h-8 gap-1.5 px-2.5 text-xs"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      Unverify
                    </Button>
                  )
                ) : null}
              </div>
            </div>

            {!hasValidLatitude || !hasValidLongitude ? (
              <p className="text-xs text-gray-500">
                Coordinates are required before verification.
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-end gap-3 border-t border-gray-200 pt-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(cancelHref)}
            disabled={isSubmitting}
            className="h-10 px-5"
          >
            {isVerifyMode ? "Exit queue" : "Cancel"}
          </Button>
          {isVerifyMode ? (
            <Button
              type="button"
              variant="outline"
              onClick={handleSkipInQueue}
              disabled={isSubmitting}
              className="h-10 px-5"
              data-testid="skip-in-queue-button"
            >
              <SkipForward className="mr-2 h-4 w-4" />
              Skip for now
            </Button>
          ) : null}
          <Button
            type="submit"
            disabled={
              isSubmitting ||
              (isVerifyMode && (!hasValidLatitude || !hasValidLongitude))
            }
            className={
              isVerifyMode
                ? "h-10 bg-emerald-600 px-5 hover:bg-emerald-700"
                : "h-10 bg-orange-500 px-5 hover:bg-orange-600"
            }
            data-testid={isVerifyMode ? "verify-and-next-button" : undefined}
          >
            {submitIcon}
            {submitLabel}
          </Button>
        </div>
      </form>
    </div>
  );
}
