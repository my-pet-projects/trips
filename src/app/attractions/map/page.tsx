import { Navbar } from "~/app/_components/navbar";
import { AttractionsMap } from "./_components/attractions-map";

export const metadata = {
  title: "Attractions Map",
  description: "View and explore attractions on the map",
};

export default function AttractionsMapPage() {
  return (
    <div className="min-h-screen">
      <Navbar
        title="Attractions Map"
        subtitle="View and explore attractions on the map"
        backHref="/attractions"
      />

      <main className="flex h-[calc(100vh-73px)] flex-col">
        <div className="min-h-0 flex-1">
          <AttractionsMap />
        </div>
      </main>
    </div>
  );
}
