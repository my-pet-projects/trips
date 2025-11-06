"use client";

import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useTransition } from "react";

import { Button } from "~/app/_components/ui/button";

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
};

const MAX_VISIBLE_PAGES = 7;

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
}: PaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const navigateToPage = useCallback(
    (page: number) => {
      if (page < 1 || page > totalPages || page === currentPage) {
        return;
      }

      const params = new URLSearchParams(searchParams.toString());

      if (page === 1) {
        params.delete("page");
      } else {
        params.set("page", page.toString());
      }

      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`, { scroll: true });
      });
    },
    [currentPage, totalPages, searchParams, router, pathname],
  );

  const pageNumbers = useMemo(() => {
    const pages: (number | string)[] = [];

    if (totalPages <= MAX_VISIBLE_PAGES) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      if (currentPage <= 3) {
        for (let i = 2; i <= 5; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push("...");
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  }, [currentPage, totalPages]);

  if (!currentPage || !totalPages || !totalItems || !itemsPerPage) {
    return null;
  }

  if (totalPages <= 1) {
    return null;
  }

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const isFirstPage = currentPage === 1;
  const isLastPage = currentPage === totalPages;

  return (
    <div className="relative">
      {/* Loading indicator bar */}
      {isPending && (
        <div className="absolute top-0 right-0 left-0 h-1 overflow-hidden bg-gray-100">
          <div className="h-full w-1/3 animate-[slide_1.5s_ease-in-out_infinite] bg-orange-500" />
        </div>
      )}

      <div
        className={`flex flex-col items-center justify-between gap-4 border-t bg-white px-4 py-3 transition-opacity duration-200 sm:px-6 ${isPending ? "opacity-60" : "opacity-100"}`}
      >
        {/* Results info with loading spinner */}
        <div className="flex items-center gap-2 text-sm text-gray-700">
          {isPending && (
            <Loader2 className="h-4 w-4 animate-spin text-orange-500" />
          )}
          <span>
            Showing <span className="font-medium">{startItem}</span> to{" "}
            <span className="font-medium">{endItem}</span> of{" "}
            <span className="font-medium">{totalItems}</span> results
          </span>
        </div>

        {/* Pagination controls */}
        <nav className="flex items-center gap-2">
          {/* First page */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigateToPage(1)}
            disabled={isFirstPage || isPending}
            className="hidden h-9 w-9 sm:inline-flex"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>

          {/* Previous page */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigateToPage(currentPage - 1)}
            disabled={isFirstPage || isPending}
            className="h-9 w-9"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {/* Page numbers */}
          <div className="hidden items-center gap-1 sm:flex">
            {pageNumbers.map((page, index) => {
              if (page === "...") {
                return (
                  <span
                    key={`ellipsis-${index}`}
                    className="flex h-9 w-9 items-center justify-center text-sm text-gray-500"
                  >
                    ⋯
                  </span>
                );
              }

              const pageNum = page as number;
              const isActive = pageNum === currentPage;

              return (
                <Button
                  key={pageNum}
                  variant={isActive ? "default" : "outline"}
                  size="icon"
                  onClick={() => navigateToPage(pageNum)}
                  disabled={isPending}
                  className={`h-9 w-9 transition-all ${
                    isActive
                      ? "bg-orange-500 text-white shadow-sm hover:bg-orange-600"
                      : "hover:bg-gray-50"
                  }`}
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>

          {/* Current page indicator */}
          <div className="flex items-center gap-2 sm:hidden">
            <span className="text-sm font-medium text-gray-700">
              Page {currentPage} of {totalPages}
            </span>
          </div>

          {/* Next page */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigateToPage(currentPage + 1)}
            disabled={isLastPage || isPending}
            className="h-9 w-9"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          {/* Last page */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigateToPage(totalPages)}
            disabled={isLastPage || isPending}
            className="hidden h-9 w-9 sm:inline-flex"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </nav>
      </div>
    </div>
  );
}
