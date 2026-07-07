import { Navbar } from "~/app/_components/navbar";
import { TripForm } from "~/app/trips/_components/trip-form";

export const metadata = {
  title: "Create New Trip",
  description: "Plan a new travel adventure",
};

export default function CreateTripPage() {
  return (
    <div className="min-h-screen bg-linear-to-br from-sky-50 via-white to-orange-50">
      <Navbar
        title="Create Trip"
        subtitle="Plan a new travel adventure"
        backHref="/trips"
      />

      <main className="container mx-auto px-4 py-8">
        <TripForm mode="create" />
      </main>
    </div>
  );
}
