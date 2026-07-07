import {
  AlertTriangle,
  CheckCircle,
  Globe,
  MapPin,
  Search,
  SkipForward,
  Star,
  ThumbsUp,
} from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/app/_components/ui/table";
import { Badge } from "~/app/_components/ui/badge";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "~/app/_components/ui/empty";
import type { AttractionRow } from "~/types";

import { cn } from "~/lib/utils";
import { AttractionTableActions } from "./attraction-table-actions";
import { Pagination } from "./pagination";

type AttractionsTableProps = {
  attractions: AttractionRow[];
  totalCount: number;
  currentPage: number;
  itemsPerPage: number;
};

export function AttractionsTable({
  attractions,
  totalCount,
  currentPage,
  itemsPerPage,
}: AttractionsTableProps) {
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  return (
    <div className="mt-6">
      {totalCount === 0 && (
        <Empty className="min-h-[60vh] border-none bg-transparent">
          <EmptyHeader>
            <EmptyMedia className="mb-2 size-24 rounded-full bg-linear-to-br from-orange-100 to-orange-200 shadow-lg">
              <MapPin className="size-12 text-orange-600" />
            </EmptyMedia>
            <EmptyTitle className="text-3xl font-bold">
              No Attractions Found
            </EmptyTitle>
            <EmptyDescription className="max-w-md text-lg">
              No attractions match your current filters. Try adjusting your
              search criteria.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}

      {totalCount > 0 && (
        <div>
          <div className="mb-6 px-1">
            <h2 className="text-foreground text-3xl font-bold">
              All Attractions
            </h2>
            <p className="text-muted-foreground mt-2 text-base">
              {attractions.length === totalCount
                ? `${totalCount} ${totalCount === 1 ? "attraction" : "attractions"} found`
                : `Showing ${attractions.length} of ${totalCount} attractions`}
            </p>
          </div>

          {attractions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Search className="text-muted-foreground mb-4 h-14 w-14" />
              <h3 className="mb-2 text-2xl font-semibold">No Results Found</h3>
              <p className="text-muted-foreground text-base">
                Try adjusting your filters or search query
              </p>
            </div>
          ) : (
            <div
              className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
              data-testid="attractions-table"
            >
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-linear-to-r from-sky-50 to-orange-50 hover:from-sky-50 hover:to-orange-50">
                      <TableHead className="h-11 px-6 font-semibold text-gray-700">
                        <div className="flex items-center gap-2">
                          Attraction
                        </div>
                      </TableHead>
                      <TableHead className="h-11 px-6 font-semibold text-gray-700">
                        <div className="flex items-center gap-2">Location</div>
                      </TableHead>
                      <TableHead className="h-11 px-6 font-semibold text-gray-700">
                        Coordinates
                      </TableHead>
                      <TableHead className="h-11 px-6 text-right font-semibold text-gray-700">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attractions.map((attraction) => (
                      <TableRow
                        key={attraction.id}
                        className="group transition-colors hover:bg-linear-to-r hover:from-sky-50/50 hover:to-orange-50/50"
                      >
                        <TableCell className="px-6 py-3">
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-2">
                              <span className="leading-tight font-semibold text-gray-900">
                                {attraction.name}
                              </span>
                              {attraction.highlight === "must_see" && (
                                <Badge variant="warning" className="gap-1 px-2 py-0.5">
                                  <Star className="h-3 w-3" />
                                  Must see
                                </Badge>
                              )}
                              {attraction.highlight === "recommended" && (
                                <Badge variant="teal" className="gap-1 px-2 py-0.5">
                                  <ThumbsUp className="h-3 w-3" />
                                  Recommended
                                </Badge>
                              )}
                              {attraction.highlight === "skip" && (
                                <Badge variant="destructive" className="gap-1 px-2 py-0.5">
                                  <SkipForward className="h-3 w-3" />
                                  Skip
                                </Badge>
                              )}
                            </div>
                            {attraction.nameLocal && (
                              <div className="text-sm leading-tight text-gray-500">
                                {attraction.nameLocal}
                              </div>
                            )}
                            <div className="mt-0.5 text-xs leading-tight text-gray-400">
                              ID: {attraction.id}
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="px-6 py-3">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5 text-sm font-medium text-gray-900">
                              <MapPin className="h-3.5 w-3.5 text-sky-500" />
                              {attraction.city.name}
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-gray-600">
                              <Globe className="h-3.5 w-3.5 text-orange-500" />
                              {attraction.city.country.name}
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="px-6 py-3">
                          {attraction.latitude && attraction.longitude ? (
                            <div className="inline-flex items-start gap-2">
                              <div
                                className={cn(
                                  "space-y-0.5 font-mono text-xs",
                                  attraction.isVerified
                                    ? "text-gray-600"
                                    : "text-gray-400",
                                )}
                              >
                                <div>
                                  <span className="text-gray-500">Lat:</span>{" "}
                                  {attraction.latitude.toFixed(6)}
                                </div>
                                <div>
                                  <span className="text-gray-500">Lng:</span>{" "}
                                  {attraction.longitude.toFixed(6)}
                                </div>
                              </div>

                              <div className="pt-0.5">
                                {attraction.isVerified ? (
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                ) : (
                                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                                )}
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400 italic">
                              No coordinates
                            </span>
                          )}
                        </TableCell>

                        <TableCell className="px-6 py-3 text-right">
                          <AttractionTableActions
                            attractionId={attraction.id}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalCount}
                itemsPerPage={itemsPerPage}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
