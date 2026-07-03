import { TRPCClientError } from "@trpc/client";

export function getTriageErrorMessage(error: unknown): string {
  if (error instanceof TRPCClientError) return error.message;
  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}
