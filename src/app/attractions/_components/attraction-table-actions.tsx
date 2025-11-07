"use client";

import { Edit, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "~/app/_components/ui/button";

type AttractionTableActionsProps = {
  attractionId: number;
};

export function AttractionTableActions({
  attractionId,
}: AttractionTableActionsProps) {
  const router = useRouter();

  return (
    <div className="flex items-center justify-end gap-1">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-sky-600 opacity-0 transition-all group-hover:opacity-100 hover:bg-sky-50 hover:text-sky-700"
        title="Edit attraction"
        onClick={() => router.push(`/attractions/${attractionId}/edit`)}
      >
        <Edit className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-red-600 opacity-0 transition-all group-hover:opacity-100 hover:bg-red-50 hover:text-red-700"
        title="Delete attraction"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
