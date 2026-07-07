import { BookOpen, ChevronDown, ExternalLink } from "lucide-react";
import React, { useEffect, useRef } from "react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/app/_components/ui/collapsible";
import { api } from "~/trpc/react";
import type { AttractionDetail } from "~/types";

interface AttractionImageGalleryProps {
  attraction: AttractionDetail;
}

export const AttractionImageGallery: React.FC<AttractionImageGalleryProps> = ({
  attraction,
}) => {
  const loadedImages = useRef(new Set<string>());
  const failedImages = useRef(new Set<string>());
  const [, forceUpdate] = React.useState(0);

  // Reset image load/fail caches and disclosure state when the attraction changes
  useEffect(() => {
    loadedImages.current = new Set();
    failedImages.current = new Set();
    forceUpdate(0);
  }, [attraction.id]);
  const { data, isLoading, isError, refetch } =
    api.attractionScraper.fetchAttractionDetails.useQuery(
      {
        name: attraction.name,
        nameLocal: attraction.nameLocal,
        city: attraction.city
          ? {
              id: attraction.city.id,
              name: attraction.city.name,
              countryCode: attraction.city.countryCode,
              country: attraction.city.country,
            }
          : undefined,
      },
      {
        refetchOnWindowFocus: false,
      },
    );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-sky-500" />
        <span className="ml-2 text-sm text-gray-500">Loading images...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mb-4 rounded-lg bg-red-50 p-3 text-center">
        <p className="text-sm text-red-600">Failed to load images</p>
        <button
          type="button"
          onClick={() => void refetch()}
          className="mt-2 rounded-md bg-red-100 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-200"
        >
          Try Again
        </button>
      </div>
    );
  }

  const imageUrls = data?.imageUrls ?? [];
  const articles = data?.articles ?? [];

  const validImages = imageUrls.filter((url) => !failedImages.current.has(url));

  return (
    <div className="mb-4 space-y-4">
      {/* Images */}
      {validImages.length === 0 ? (
        <div className="rounded-lg bg-gray-50 py-4 text-center">
          <p className="text-sm text-gray-500">No images available</p>
        </div>
      ) : (
        <div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {validImages.slice(0, 12).map((url, index) => (
              <div
                key={url || `image-${index}`}
                className="group relative aspect-video overflow-hidden rounded-lg bg-gray-100"
              >
                {!loadedImages.current.has(url) && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-200 border-t-sky-500" />
                  </div>
                )}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={`${attraction.name} ${index + 1}`}
                  className={`h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 ${
                    loadedImages.current.has(url) ? "opacity-100" : "opacity-0"
                  }`}
                  onLoad={() => { loadedImages.current.add(url); forceUpdate(n => n + 1); }}
                  onError={() => { failedImages.current.add(url); forceUpdate(n => n + 1); }}
                />
              </div>
            ))}
          </div>
          {imageUrls.length > 12 && (
            <p className="mt-2 text-center text-xs text-gray-400">
              +{imageUrls.length - 12} more images
            </p>
          )}
          <p className="mt-2 text-center text-xs text-gray-400">
            Images sourced from{" "}
            <a
              href="https://commons.wikimedia.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-gray-600"
            >
              Wikimedia Commons
            </a>
          </p>
        </div>
      )}

      {/* Wikipedia Articles */}
      {articles.length > 0 && (
        <Collapsible className="rounded-lg border border-gray-200">
          <CollapsibleTrigger className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-gray-400" />
              <span>Wikipedia</span>
              <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-500">
                {articles.length}
              </span>
            </div>
            <ChevronDown className="h-4 w-4 text-gray-400 transition-transform data-open:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <ul className="divide-y divide-gray-100">
              {articles.map((article) => (
                <li key={article.url} className="p-3">
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm font-medium text-sky-600 hover:text-sky-700"
                  >
                    {article.title}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                  {article.snippet && (
                    <p className="mt-1 text-xs leading-relaxed text-gray-500">
                      {article.snippet}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
};
