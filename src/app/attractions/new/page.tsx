import { ArrowLeft, MapPin } from "lucide-react";
import Link from "next/link";
import { AttractionForm } from "~/app/_components/forms/attraction-form";

export const metadata = {
  title: "New Attraction",
  description: "Add a new place to visit",
};

export default async function CreateAttractionPage() {
  return (
    <div className="min-h-screen bg-linear-to-br from-sky-50 via-white to-orange-50">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                href="/attractions"
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition-colors hover:bg-gray-50"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500 text-white">
                <MapPin className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-foreground text-2xl font-bold">
                  New Attraction
                </h1>
                <p className="text-muted-foreground text-sm">
                  Add a new place to visit
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <AttractionForm mode="create" />
      </main>
    </div>
  );
}
