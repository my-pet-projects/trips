import { z } from "zod";

export type PlanDateRangeFields = {
  pinnedStartDate: Date | null;
  pinnedEndDate: Date | null;
};

const nullableDateSchema = z.coerce.date().nullable();

const planBlockAttractionSchema = z.object({
  attractionId: z.number(),
  order: z.number().min(1),
});

function refinePlanDateRange(
  data: PlanDateRangeFields,
  ctx: z.RefinementCtx,
): void {
  if (data.pinnedEndDate && !data.pinnedStartDate) {
    ctx.addIssue({
      code: "custom",
      message: "End date requires a start date",
      path: ["pinnedEndDate"],
    });
  }

  if (
    data.pinnedStartDate &&
    data.pinnedEndDate &&
    data.pinnedEndDate < data.pinnedStartDate
  ) {
    ctx.addIssue({
      code: "custom",
      message: "End date cannot be earlier than start date",
      path: ["pinnedEndDate"],
    });
  }
}

export const planBlockUpdateInputSchema = z
  .object({
    id: z.number(),
    name: z.string().min(1).max(100),
    blockNumber: z.number().min(1),
    pinnedStartDate: nullableDateSchema,
    pinnedEndDate: nullableDateSchema,
    attractions: z.array(planBlockAttractionSchema),
  })
  .superRefine(refinePlanDateRange);

export type PlanBlockUpdateInput = z.infer<typeof planBlockUpdateInputSchema>;

export const createPlanBlockInputSchema = z
  .object({
    tripId: z.number(),
    name: z.string().min(1).max(100),
    blockNumber: z.number().min(1),
    pinnedStartDate: nullableDateSchema.default(null),
    pinnedEndDate: nullableDateSchema.default(null),
  })
  .superRefine(refinePlanDateRange);

export type CreatePlanBlockInput = z.infer<typeof createPlanBlockInputSchema>;

export const updatePlanBlocksInputSchema = z.object({
  tripId: z.number(),
  blocks: z.array(planBlockUpdateInputSchema),
});

export function resolvePlanDateRange(
  range: PlanDateRangeFields,
): { startDate: Date; endDate: Date } | null {
  if (!range.pinnedStartDate) return null;

  return {
    startDate: range.pinnedStartDate,
    endDate: range.pinnedEndDate ?? range.pinnedStartDate,
  };
}
