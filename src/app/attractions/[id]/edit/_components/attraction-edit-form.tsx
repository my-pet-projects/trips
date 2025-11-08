"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { TRPCClientError } from "@trpc/client";
import { Globe, Loader2, MapPin, Save } from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { CountryCitySelector } from "~/app/_components/geo/country-city-selector";
import { Button } from "~/app/_components/ui/button";
import { Input } from "~/app/_components/ui/input";
import { Label } from "~/app/_components/ui/label";
import { Textarea } from "~/app/_components/ui/textarea";
import { api, type RouterOutputs } from "~/trpc/react";

type City = RouterOutputs["geo"]["getCitiesByCountry"][number];
type Country = RouterOutputs["geo"]["getCountries"][number];

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

type Attraction = RouterOutputs["attraction"]["getAttractionById"];

type AttractionEditFormProps = {
  attraction: Attraction;
};

function getErrorMessage(error: unknown): string {
  if (error instanceof TRPCClientError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "An unexpected error occurred";
}

const DynamicAttractionMap = dynamic(
  () =>
    import("~/app/_components/map/attraction-map").then(
      (mod) => mod.AttractionMap,
    ),
  { ssr: false },
);

export function AttractionEditForm({ attraction }: AttractionEditFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(
    attraction.countryCode,
  );
  const [selectedCity, setSelectedCity] = useState(attraction.city?.name);

  const form = useForm<AttractionFormData>({
    resolver: zodResolver(attractionSchema),
    defaultValues: {
      name: attraction.name,
      nameLocal: attraction.nameLocal ?? "",
      description: attraction.description ?? "",
      address: attraction.address ?? "",
      latitude: attraction.latitude ?? 0,
      longitude: attraction.longitude ?? 0,
      sourceUrl: attraction.sourceUrl ?? undefined,
      countryCode: attraction.countryCode,
      cityId: attraction.city?.id,
    },
  });

  const updateMutation = api.attraction.update.useMutation({
    onSuccess: () => {
      setSuccess(true);
      setError(null);
      setIsSubmitting(false);
    },
    onError: (err) => {
      setError(getErrorMessage(err));
      setSuccess(false);
      setIsSubmitting(false);
    },
  });

  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => setSuccess(false), 5000);
    return () => clearTimeout(timer);
  }, [success]);

  const onSubmit = async (data: AttractionFormData) => {
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    await updateMutation.mutateAsync({
      id: attraction.id,
      ...data,
    });
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

  const currentLatitude = form.watch("latitude");
  const currentLongitude = form.watch("longitude");

  const handleMapCoordinatesChange = (lat: number, lng: number) => {
    form.setValue("latitude", lat, { shouldValidate: true, shouldDirty: true });
    form.setValue("longitude", lng, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  return (
    <div className="mx-auto max-w-4xl">
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6"
        autoComplete="nope"
      >
        {/* Main Info Card */}
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

            {/* Name Local */}
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
              <Input
                id="sourceUrl"
                autoComplete="nope"
                type="url"
                {...form.register("sourceUrl")}
                className="mt-1.5 h-12 font-mono text-sm"
                placeholder="https://example.com"
              />
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
            {/* Country & City Selector */}
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
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label
                  htmlFor="latitude"
                  className="text-sm font-medium text-gray-700"
                >
                  Latitude
                </Label>
                <Input
                  id="latitude"
                  autoComplete="nope"
                  type="number"
                  step="any"
                  {...form.register("latitude", { valueAsNumber: true })}
                  className="mt-1.5 h-12 font-mono"
                  placeholder="e.g., 40.712776"
                />
                {form.formState.errors.latitude && (
                  <p className="mt-1 text-sm text-red-600">
                    {form.formState.errors.latitude.message}
                  </p>
                )}
              </div>

              <div>
                <Label
                  htmlFor="longitude"
                  className="text-sm font-medium text-gray-700"
                >
                  Longitude
                </Label>
                <Input
                  id="longitude"
                  autoComplete="nope"
                  type="number"
                  step="any"
                  {...form.register("longitude", { valueAsNumber: true })}
                  className="mt-1.5 h-12 font-mono"
                  placeholder="e.g., -74.005974"
                />
                {form.formState.errors.longitude && (
                  <p className="mt-1 text-sm text-red-600">
                    {form.formState.errors.longitude.message}
                  </p>
                )}
              </div>
            </div>

            {/* Map */}
            <div>
              <Label className="mb-1.5 block text-sm font-medium text-gray-700">
                Map Preview
              </Label>
              <DynamicAttractionMap
                latitude={currentLatitude ?? 0}
                longitude={currentLongitude ?? 0}
                currentCity={attraction.city}
                onCoordinatesChange={handleMapCoordinatesChange}
                className="h-[400px] w-full"
              />
              <p className="mt-1.5 text-xs text-gray-500">
                {currentLatitude && currentLongitude
                  ? "Map shows current coordinates. Update latitude/longitude or click on the map to move the marker."
                  : "Enter coordinates to display location on map or click on the map to set them."}
              </p>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4">
            <p className="text-sm text-green-700">
              ✓ Attraction updated successfully!
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

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
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
