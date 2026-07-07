import { Navbar } from "./navbar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Skeleton } from "./ui/skeleton";

type LoadingPageProps = {
  title: string;
  message?: string;
};

export function LoadingPage({ title, message }: LoadingPageProps) {
  return (
    <div className="min-h-screen bg-linear-to-br from-sky-50 via-white to-orange-50">
      <Navbar title={title} subtitle="Loading..." />

      <main className="container mx-auto px-4 py-6">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={index} className="border border-gray-200 bg-white shadow-sm ring-0">
              <CardHeader className="space-y-3">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-32 w-full rounded-lg" />
                <div className="flex items-center justify-center gap-2 py-2">
                  <Skeleton className="size-4 rounded-full" />
                  <Skeleton className="h-4 w-40" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
