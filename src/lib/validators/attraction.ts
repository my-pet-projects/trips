import { z } from "zod";

export const attractionHighlightValues = [
  "must_see",
  "recommended",
  "skip",
] as const;

export type AttractionHighlight = (typeof attractionHighlightValues)[number];

export const attractionHighlightSchema = z.enum(attractionHighlightValues);

export const attractionHighlightNullableSchema =
  attractionHighlightSchema.nullable().optional();

export const attractionInputBaseSchema = z.object({
  name: z.string().min(1, "Name is required").max(256).trim(),
  nameLocal: z.string().max(256).optional(),
  description: z.string().optional(),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
  sourceUrl: z
    .string()
    .max(256)
    .nullable()
    .optional()
    .refine(
      (value) =>
        value == null ||
        value === "" ||
        z.url().safeParse(value).success,
      { message: "Invalid URL" },
    ),
  cityId: z.number().min(1).optional(),
  countryCode: z.string().length(2, "Country is required"),
  isVerified: z.boolean().optional(),
  highlight: attractionHighlightNullableSchema,
});

const cityRequiredRefinement = {
  fn: (data: z.infer<typeof attractionInputBaseSchema>) => data.cityId != null,
  config: {
    message: "City is required",
    path: ["cityId"],
  },
};

function withRequiredCityId<T extends z.ZodType<z.infer<typeof attractionInputBaseSchema>>>(
  schema: T,
) {
  return schema
    .refine(cityRequiredRefinement.fn, cityRequiredRefinement.config)
    .transform((data) => {
      const { cityId } = data;
      if (cityId == null) {
        throw new Error("City is required");
      }
      return { ...data, cityId };
    });
}

export const attractionCreateInputSchema = withRequiredCityId(
  attractionInputBaseSchema,
);

export const attractionUpdateInputSchema = withRequiredCityId(
  attractionInputBaseSchema.extend({
    id: z.number(),
  }),
);

export const attractionFormSchema = attractionInputBaseSchema
  .extend({
    isVerified: z.boolean(),
  })
  .refine(cityRequiredRefinement.fn, cityRequiredRefinement.config);

export type AttractionFormData = z.infer<typeof attractionFormSchema>;
export type AttractionCreateInput = z.infer<typeof attractionCreateInputSchema>;
export type AttractionUpdateInput = z.infer<typeof attractionUpdateInputSchema>;

export const nullableNumberInput = (value: unknown): number | null => {
  if (value == null) return null;
  if (typeof value === "string" && value.trim() === "") return null;
  if (value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export const nullableStringInput = (value: unknown): string | null => {
  if (value == null) return null;
  const stringValue = String(value);
  return stringValue === "" ? null : stringValue;
};
