import { Navbar } from "~/app/_components/navbar";
import { AttractionForm } from "~/app/attractions/_components/forms/attraction-form";

export const metadata = {
  title: "New Attraction",
  description: "Add a new place to visit",
};

export default async function CreateAttractionPage() {
  return (
    <div className="min-h-screen bg-linear-to-br from-sky-50 via-white to-orange-50">
      <Navbar
        title="New Attraction"
        subtitle="Add a new place to visit"
        backHref="/attractions"
      />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <AttractionForm mode="create" />
      </main>
    </div>
  );
}
