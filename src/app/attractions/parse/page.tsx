import { AttractionParseForm } from "~/app/_components/forms/attraction-parse-form";
import { Navbar } from "~/app/_components/navbar";

export const metadata = {
  title: "Parse Attractions",
  description: "Parse and create new attractions",
};

export default async function ParseAttractionsPage() {
  return (
    <div className="min-h-screen bg-linear-to-br from-sky-50 via-white to-orange-50">
      <Navbar
        title="Parse Attractions"
        subtitle="Parse and create new attractions"
        backHref="/attractions"
      />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <AttractionParseForm />
      </main>
    </div>
  );
}
