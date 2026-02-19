import { Navbar } from "~/app/_components/navbar";
import { TripsList } from "~/app/trips/_components/trip-list";

export const metadata = {
  title: "Trip List",
  description: "Manage your travel plans",
};

export default async function TripsPage() {
  return (
    <div className="min-h-screen bg-linear-to-br from-sky-50 via-white to-orange-50">
      <Navbar title="Trips" subtitle="Manage your travel plans" />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <TripsList />
      </main>
    </div>
  );
}
