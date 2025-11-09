"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { TRPCClientError } from "@trpc/client";
import {
  Clipboard,
  Globe,
  Loader2,
  Map as MapIcon,
  MapPin,
  Plus,
  Save,
  Scan,
} from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { CountryCitySelector } from "~/app/_components/geo/country-city-selector";
import { Button } from "~/app/_components/ui/button";
import { Input } from "~/app/_components/ui/input";
import { Label } from "~/app/_components/ui/label";
import { Textarea } from "~/app/_components/ui/textarea";
import { api, type RouterOutputs } from "~/trpc/react";

type City = RouterOutputs["geo"]["getCitiesByCountry"][number];
type Country = RouterOutputs["geo"]["getCountries"][number];
type Attraction = RouterOutputs["attraction"]["getAttractionById"];

type AttractionFormProps = {
  mode: "create" | "edit";
  attraction?: Attraction;
};

const attractionSchema = z.object({
  name: z.string().min(1, "Name is required").max(256),
  nameLocal: z.string().max(256).optional(),
  description: z.string().optional(),
  address: z.string().max(256).optional(),
  latitude: z.coerce.number().min(-90).max(90).optional().nullable(),
  longitude: z.coerce.number().min(-180).max(180).optional().nullable(),
  sourceUrl: z
    .union([z.string().url().max(256), z.literal("")])
    .optional()
    .nullable(),
  cityId: z.number().min(1, "City is required"),
  countryCode: z.string().length(2, "Country is required"),
});

type AttractionFormData = z.infer<typeof attractionSchema>;

const getErrorMessage = (error: unknown): string => {
  if (error instanceof TRPCClientError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "An unexpected error occurred";
};

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
      <div className="flex h-[400px] w-full items-center justify-center rounded-lg border border-gray-200 bg-gray-50">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-gray-400" />
          <p className="mt-2 text-sm text-gray-600">Loading map...</p>
        </div>
      </div>
    ),
  },
);

export function AttractionForm({ mode, attraction }: AttractionFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(
    mode === "edit" ? attraction?.countryCode : "",
  );
  const [selectedCity, setSelectedCity] = useState(
    mode === "edit" ? attraction?.city?.name : "",
  );

  const isEditMode = mode === "edit";

  const form = useForm<AttractionFormData>({
    resolver: zodResolver(attractionSchema),
    defaultValues: isEditMode
      ? {
          name: attraction?.name ?? "",
          nameLocal: attraction?.nameLocal ?? "",
          description: attraction?.description ?? "",
          address: attraction?.address ?? "",
          latitude: attraction?.latitude ?? undefined,
          longitude: attraction?.longitude ?? undefined,
          sourceUrl: attraction?.sourceUrl ?? undefined,
          countryCode: attraction?.countryCode ?? "",
          cityId: attraction?.city?.id,
        }
      : {
          name: "",
          nameLocal: "",
          description: "",
          address: "",
          latitude: undefined,
          longitude: undefined,
          sourceUrl: undefined,
          countryCode: "",
        },
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
        description: getErrorMessage(error),
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
        description: getErrorMessage(err),
      });
      setIsSubmitting(false);
    },
  });

  const updateMutation = api.attraction.update.useMutation({
    onSuccess: () => {
      toast.success("Attraction updated!", {
        description: "Changes have been saved successfully.",
      });
      setIsSubmitting(false);
    },
    onError: (err) => {
      toast.error("Failed to update attraction", {
        description: getErrorMessage(err),
      });
      setIsSubmitting(false);
    },
  });

  const handleParseSourceUrl = () => {
    const url = form.watch("sourceUrl");
    if (!url?.trim()) {
      toast.error("Source URL required", {
        description: "Please enter a URL to parse.",
      });
      return;
    }
    parseSiteMutation.mutate({ url });
  };

  const onSubmit = async (data: AttractionFormData) => {
    setIsSubmitting(true);

    if (isEditMode && attraction) {
      await updateMutation.mutateAsync({
        id: attraction.id,
        ...data,
      });
    } else {
      await createMutation.mutateAsync(data);
    }
  };

  const handleLocationChange = (country: Country | null, city: City | null) => {
    if (country) {
      setSelectedCountry(country.cca2);
      form.setValue("countryCode", country.cca2);
      form.clearErrors("countryCode");
    } else {
      setSelectedCountry("");
      form.setValue("countryCode", "");
    }

    if (city) {
      setSelectedCity(city.name);
      form.setValue("cityId", city.id);
      form.clearErrors("cityId");
    } else {
      setSelectedCity("");
      form.setValue("cityId", undefined as unknown as number);
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

  const openMap = (mapType: "osm" | "google") => {
    if (!hasValidLatitude || !hasValidLongitude) return;

    const url =
      mapType === "osm"
        ? `https://www.openstreetmap.org/?mlat=${mapLatitude}&mlon=${mapLongitude}#map=16/${mapLatitude}/${mapLongitude}`
        : `https://www.google.com/maps/@${mapLatitude},${mapLongitude},16z`;

    window.open(url, "_blank");
  };

  const currentLatitude = form.watch("latitude");
  const currentLongitude = form.watch("longitude");
  const hasValidLatitude = isValidCoordinate(currentLatitude);
  const hasValidLongitude = isValidCoordinate(currentLongitude);

  const mapLatitude =
    hasValidLatitude && currentLatitude != null
      ? currentLatitude
      : isEditMode
        ? (attraction?.latitude ?? attraction?.city?.latitude ?? 0)
        : 0;

  const mapLongitude =
    hasValidLongitude && currentLongitude != null
      ? currentLongitude
      : isEditMode
        ? (attraction?.longitude ?? attraction?.city?.longitude ?? 0)
        : 0;

  const currentCity = isEditMode ? attraction?.city : undefined;

  return (
    <div className="mx-auto max-w-4xl">
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6"
        autoComplete="nope"
      >
        {/* Basic Information Card */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3 border-b pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-100">
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

          <div className="space-y-5">
            {/* Name */}
            <div>
              <Label
                htmlFor="name"
                className="text-sm font-medium text-gray-700"
              >
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                autoComplete="nope"
                {...form.register("name")}
                className="mt-1.5 h-12"
                placeholder="Enter attraction name"
              />
              {form.formState.errors.name && (
                <p className="mt-1 text-sm text-red-600">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            {/* Local Name */}
            <div>
              <Label
                htmlFor="nameLocal"
                className="text-sm font-medium text-gray-700"
              >
                Local Name
              </Label>
              <Input
                id="nameLocal"
                autoComplete="nope"
                {...form.register("nameLocal")}
                className="mt-1.5 h-12"
                placeholder="Enter local name (optional)"
              />
              {form.formState.errors.nameLocal && (
                <p className="mt-1 text-sm text-red-600">
                  {form.formState.errors.nameLocal.message}
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <Label
                htmlFor="description"
                className="text-sm font-medium text-gray-700"
              >
                Description
              </Label>
              <Textarea
                id="description"
                {...form.register("description")}
                className="mt-1.5 min-h-[120px] resize-none"
                placeholder="Enter a description of the attraction"
              />
              {form.formState.errors.description && (
                <p className="mt-1 text-sm text-red-600">
                  {form.formState.errors.description.message}
                </p>
              )}
            </div>

            {/* Source URL */}
            <div>
              <Label
                htmlFor="sourceUrl"
                className="text-sm font-medium text-gray-700"
              >
                Source URL
              </Label>
              <div className="mt-1.5 flex items-end gap-2">
                <div className="grow">
                  <Input
                    id="sourceUrl"
                    autoComplete="nope"
                    type="url"
                    {...form.register("sourceUrl")}
                    className="h-12 w-full font-mono text-sm"
                    placeholder="https://example.com"
                  />
                </div>
                <Button
                  type="button"
                  onClick={handleParseSourceUrl}
                  disabled={parseSiteMutation.isPending}
                  title="Parse site for data"
                  variant="outline"
                  className="h-12 w-12 p-0"
                >
                  {parseSiteMutation.isPending ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Scan className="h-5 w-5" />
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

        {/* Location Card */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3 border-b pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100">
              <Globe className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Location</h2>
              <p className="text-sm text-gray-500">
                Geographic information and address
              </p>
            </div>
          </div>

          <div className="space-y-5">
            {/* Country & City */}
            <div>
              <Label className="mb-1.5 block text-sm font-medium text-gray-700">
                Country & City <span className="text-red-500">*</span>
              </Label>
              <CountryCitySelector
                initialCountry={selectedCountry}
                initialCity={selectedCity}
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

            {/* Address */}
            <div>
              <Label
                htmlFor="address"
                className="text-sm font-medium text-gray-700"
              >
                Address
              </Label>
              <Input
                id="address"
                autoComplete="nope"
                {...form.register("address")}
                className="mt-1.5 h-12"
                placeholder="Enter street address"
              />
              {form.formState.errors.address && (
                <p className="mt-1 text-sm text-red-600">
                  {form.formState.errors.address.message}
                </p>
              )}
            </div>

            {/* Coordinates */}
            <div className="flex flex-col items-end gap-4 sm:flex-row">
              <div className="grid grow grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Latitude */}
                <div>
                  <Label htmlFor="latitude">Latitude</Label>
                  <div className="relative mt-1.5">
                    <Input
                      id="latitude"
                      autoComplete="nope"
                      type="number"
                      step="any"
                      {...form.register("latitude", { valueAsNumber: true })}
                      className="h-12 pr-10 font-mono"
                      placeholder="e.g., 40.712776"
                    />
                    <button
                      type="button"
                      onClick={() => handlePasteCoordinates("latitude")}
                      title="Paste from clipboard"
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                    >
                      <Clipboard className="h-5 w-5" />
                    </button>
                  </div>
                  {form.formState.errors.latitude && (
                    <p className="mt-1 text-sm text-red-600">
                      {form.formState.errors.latitude.message}
                    </p>
                  )}
                </div>

                {/* Longitude */}
                <div>
                  <Label htmlFor="longitude">Longitude</Label>
                  <div className="relative mt-1.5">
                    <Input
                      id="longitude"
                      autoComplete="nope"
                      type="number"
                      step="any"
                      {...form.register("longitude", { valueAsNumber: true })}
                      className="h-12 pr-10 font-mono"
                      placeholder="e.g., -74.005974"
                    />
                    <button
                      type="button"
                      onClick={() => handlePasteCoordinates("longitude")}
                      title="Paste from clipboard"
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                    >
                      <Clipboard className="h-5 w-5" />
                    </button>
                  </div>
                  {form.formState.errors.longitude && (
                    <p className="mt-1 text-sm text-red-600">
                      {form.formState.errors.longitude.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Map Action Buttons */}
              <div className="flex gap-2 sm:self-end">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => openMap("osm")}
                  title="Open in OpenStreetMap"
                  disabled={!hasValidLatitude || !hasValidLongitude}
                  className="h-12 w-12"
                >
                  <MapIcon className="h-5 w-5" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => openMap("google")}
                  title="Open in Google Maps"
                  disabled={!hasValidLatitude || !hasValidLongitude}
                  className="h-12 w-12"
                >
                  <MapPin className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Map Preview */}
            <div>
              <Label className="mb-1.5 block text-sm font-medium text-gray-700">
                Map Preview
              </Label>
              <DynamicAttractionMap
                latitude={mapLatitude}
                longitude={mapLongitude}
                currentCity={currentCity}
                onCoordinatesChange={handleMapCoordinatesChange}
                className="h-[400px] w-full"
              />
              <p className="mt-1.5 text-xs text-gray-500">
                {hasValidLatitude && hasValidLongitude
                  ? "Click on the map to update the marker position, or enter coordinates manually."
                  : "Enter coordinates or click on the map to set the location."}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
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
            disabled={isSubmitting}
            className="h-12 bg-orange-500 px-6 hover:bg-orange-600"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isEditMode ? "Saving..." : "Creating..."}
              </>
            ) : (
              <>
                {isEditMode ? (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Attraction
                  </>
                )}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
