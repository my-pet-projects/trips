"use client";

import { Edit, Trash2 } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
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
import { Spinner } from "~/app/_components/ui/spinner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/app/_components/ui/tooltip";
import { api } from "~/trpc/react";

type AttractionTableActionsProps = {
  attractionId: number;
};

export function AttractionTableActions({
  attractionId,
}: AttractionTableActionsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const getEditUrl = () => {
    const currentUrl = searchParams.toString()
      ? `${pathname}?${searchParams.toString()}`
      : pathname;
    const editParams = new URLSearchParams();
    editParams.set("returnTo", currentUrl);
    return `/attractions/${attractionId}/edit?${editParams.toString()}`;
  };

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
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-sky-600 opacity-0 group-hover:opacity-100 hover:bg-sky-50 hover:text-sky-700"
                asChild
              />
            }
          >
            <a
              href={getEditUrl()}
              onClick={(e) => {
                e.preventDefault();
                router.push(getEditUrl());
              }}
            >
              <Edit className="h-4 w-4" />
              <span className="sr-only">Edit attraction</span>
            </a>
          </TooltipTrigger>
          <TooltipContent>Edit attraction</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-red-600 opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-700"
                onClick={() => setShowConfirmDelete(true)}
                disabled={deleteAttractionMutation.isPending}
              />
            }
          >
            {deleteAttractionMutation.isPending ? (
              <Spinner className="h-4 w-4" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </TooltipTrigger>
          <TooltipContent>Delete attraction</TooltipContent>
        </Tooltip>
      </div>

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
              {deleteAttractionMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
