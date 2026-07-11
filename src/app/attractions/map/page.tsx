import { MapPageLayout } from "~/app/_components/map-page-layout";
import { Navbar } from "~/app/_components/navbar";
import { BrowseMap } from "./_components/browse-map";

export const metadata = {
  title: "Attractions Map",
  description: "View and explore attractions on the map",
};

export default function AttractionsMapPage() {
  return (
    <MapPageLayout
      navbar={
        <Navbar
          title="Attractions Map"
          subtitle="View and explore attractions on the map"
          backHref="/attractions"
        />
      }
    >
      <BrowseMap />
    </MapPageLayout>
  );
}
