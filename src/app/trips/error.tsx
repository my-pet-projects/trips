"use client";

import { ErrorPage } from "~/app/_components/error-page";

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function Error({ error, reset }: ErrorProps) {
  return <ErrorPage error={error} reset={reset} title="Trips" />;
}
