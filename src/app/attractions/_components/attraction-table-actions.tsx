"use client";

import { Edit, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/app/_components/ui/alert-dialog";
import { Button } from "~/app/_components/ui/button";
import { api } from "~/trpc/react";

type AttractionTableActionsProps = {
  attractionId: number;
};

export function AttractionTableActions({
  attractionId,
}: AttractionTableActionsProps) {
  const router = useRouter();
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const deleteAttractionMutation = api.attraction.delete.useMutation({
    onSuccess: () => {
      toast.success("Attraction deleted successfully!");
      router.refresh();
    },
    onError: (error) => {
      toast.error("Failed to delete attraction.", {
        description: error.message,
      });
    },
  });

  const handleDelete = async () => {
    setShowConfirmDelete(false);
    await deleteAttractionMutation.mutateAsync({ id: attractionId });
  };

  return (
    <>
      <div className="flex items-center justify-end gap-1">
        <a
          href={`/attractions/${attractionId}/edit`}
          className="group relative inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-sky-600 opacity-0 transition-all group-hover:opacity-100 hover:bg-sky-50 hover:text-sky-700"
          title="Edit attraction"
          onClick={(e) => {
            e.preventDefault();
            router.push(`/attractions/${attractionId}/edit`);
          }}
        >
          <Edit className="h-4 w-4" />
        </a>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-red-600 opacity-0 transition-all group-hover:opacity-100 hover:bg-red-50 hover:text-red-700"
          title="Delete attraction"
          onClick={() => setShowConfirmDelete(true)}
          disabled={deleteAttractionMutation.isPending}
        >
          {deleteAttractionMutation.isPending ? (
            <span className="animate-spin">🌀</span>
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDelete} onOpenChange={setShowConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteAttractionMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteAttractionMutation.isPending}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {deleteAttractionMutation.isPending
                ? "Deleting..."
                : "Delete"}{" "}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
