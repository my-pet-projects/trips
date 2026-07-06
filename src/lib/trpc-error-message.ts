import { TRPCClientError } from "@trpc/client";
import type { FieldPath, FieldValues, UseFormSetError } from "react-hook-form";

type ZodFlattenedError = {
  formErrors: string[];
  fieldErrors: Record<string, string[] | undefined>;
};

function isZodFlattenedError(value: unknown): value is ZodFlattenedError {
  return (
    typeof value === "object" &&
    value !== null &&
    "fieldErrors" in value &&
    "formErrors" in value
  );
}

export function getTrpcErrorMessage(error: unknown): string {
  if (error instanceof TRPCClientError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "An unexpected error occurred";
}

export function applyTrpcZodErrorsToForm<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
): boolean {
  if (!(error instanceof TRPCClientError)) return false;

  const zodError = error.data?.zodError;
  if (!isZodFlattenedError(zodError)) return false;

  let applied = false;

  for (const [field, messages] of Object.entries(zodError.fieldErrors)) {
    const message = messages?.[0];
    if (message) {
      setError(field as FieldPath<T>, { message });
      applied = true;
    }
  }

  return applied;
}

export function getTrpcFormErrorDescription(
  error: unknown,
  fieldsMapped: boolean,
): string {
  if (fieldsMapped) {
    return "Please fix the highlighted fields.";
  }
  return getTrpcErrorMessage(error);
}
