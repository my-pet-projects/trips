import { Globe, MapPin, Search } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/app/_components/ui/table";
import type { RouterOutputs } from "~/trpc/react";

import { AttractionTableActions } from "./attraction-table-actions";
import { Pagination } from "./pagination";

type Attraction =
  RouterOutputs["attraction"]["paginateAttractions"]["attractions"][number];

type AttractionsTableProps = {
  attractions: Attraction[];
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
        <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
          <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-linear-to-br from-orange-100 to-orange-200 shadow-lg">
            <MapPin className="h-12 w-12 text-orange-600" />
          </div>
          <h2 className="text-foreground mb-3 text-3xl font-bold">
            No Attractions Found
          </h2>
          <p className="text-muted-foreground mb-8 max-w-md text-lg text-balance">
            No attractions match your current filters. Try adjusting your search
            criteria.
          </p>
        </div>
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
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
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
                        Address
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
                            <div className="leading-tight font-semibold text-gray-900">
                              {attraction.name}
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
                          <div className="max-w-[250px] text-sm text-gray-600">
                            {attraction.address ? (
                              <span className="line-clamp-2">
                                {attraction.address}
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400 italic">
                                No address provided
                              </span>
                            )}
                          </div>
                        </TableCell>

                        <TableCell className="px-6 py-3">
                          {attraction.latitude && attraction.longitude ? (
                            <div className="space-y-0.5 font-mono text-xs text-gray-600">
                              <div>
                                <span className="text-gray-500">Lat:</span>{" "}
                                {attraction.latitude.toFixed(6)}
                              </div>
                              <div>
                                <span className="text-gray-500">Lng:</span>{" "}
                                {attraction.longitude.toFixed(6)}
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
