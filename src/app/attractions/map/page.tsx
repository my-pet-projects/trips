import { Navbar } from "~/app/_components/navbar";
import { api } from "~/trpc/server";
import { AttractionsViewer } from "../_components/attractions-viewer";

export const metadata = {
  title: "Attractions Map",
  description: "View and explore attractions on the map",
};

export default async function AttractionsMapPage() {
  const attractions = await api.attraction.getAllAttractions();

  return (
    <div className="min-h-screen bg-linear-to-br from-sky-50 via-white to-orange-50">
      <Navbar
        title="Attractions Map"
        subtitle="View and explore attractions on the map"
        backHref="/attractions"
      />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <AttractionsViewer attractions={attractions} />
      </main>
    </div>
  );
}
