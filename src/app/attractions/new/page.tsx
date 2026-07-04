import { Navbar } from "~/app/_components/navbar";
import { AttractionForm } from "~/app/attractions/_components/forms/attraction-form";

export const metadata = {
  title: "New Attraction",
  description: "Add a new place to visit",
};

export default async function CreateAttractionPage() {
  return (
    <div className="flex h-dvh flex-col bg-linear-to-br from-sky-50 via-white to-orange-50">
      <Navbar
        title="New Attraction"
        subtitle="Add a new place to visit"
        backHref="/attractions"
      />

      <main className="flex min-h-0 flex-1 flex-col px-4 pb-4 pt-3 lg:px-6">
        <AttractionForm mode="create" />
      </main>
    </div>
  );
}
