import { MapPin } from "lucide-react";

export default function Loading() {
  return (
    // TODO: Replicate the main layout's wrapper structure
    <div className="min-h-screen bg-linear-to-br from-sky-50 via-white to-orange-50">
      {/* Replicate essential header content */}
      <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500 text-white">
              <MapPin className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-foreground text-2xl font-bold">
                Attractions
              </h1>
              <p className="text-muted-foreground text-sm">Loading...</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main content area for the loading spinner */}
      <main className="container mx-auto flex min-h-[calc(100vh-theme(spacing.20))] flex-col items-center justify-center px-4 py-6">
        <div className="flex flex-col items-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-500 border-t-transparent"></div>
          <p className="mt-4 text-lg text-gray-700">Fetching attractions...</p>
        </div>
      </main>
    </div>
  );
}
