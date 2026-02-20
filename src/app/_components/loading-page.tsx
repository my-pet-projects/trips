import { Loader2 } from "lucide-react";
import { Navbar } from "./navbar";

type LoadingPageProps = {
  title: string;
  message?: string;
};

export function LoadingPage({ title, message }: LoadingPageProps) {
  return (
    <div className="min-h-screen bg-linear-to-br from-sky-50 via-white to-orange-50">
      <Navbar title={title} subtitle="Loading..." />

      <main className="container mx-auto px-4 py-6">
        <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="mx-auto h-12 w-12 animate-spin text-gray-400" />
              <p className="mt-4 text-gray-600">
                {message ?? `Loading ${title.toLowerCase()}...`}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
