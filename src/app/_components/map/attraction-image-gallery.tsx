import { ExternalLink } from "lucide-react";
import React, { useState } from "react";

import { api } from "~/trpc/react";
import type { Attraction } from "~/types";

interface AttractionImageGalleryProps {
  attraction: Attraction;
}

export const AttractionImageGallery: React.FC<AttractionImageGalleryProps> = ({
  attraction,
}) => {
  const [loadedImages, setLoadedImages] = useState<string[]>([]);
  const [failedImages, setFailedImages] = useState<string[]>([]);

  const { data, isLoading, isError, error, refetch } =
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

  const validImages = imageUrls.filter((url) => !failedImages.includes(url));

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
                {!loadedImages.includes(url) && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-200 border-t-sky-500" />
                  </div>
                )}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={`${attraction.name} ${index + 1}`}
                  className={`h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 ${
                    loadedImages.includes(url) ? "opacity-100" : "opacity-0"
                  }`}
                  onLoad={() => setLoadedImages((prev) => [...prev, url])}
                  onError={() => setFailedImages((prev) => [...prev, url])}
                />
              </div>
            ))}
          </div>
          {imageUrls.length > 12 && (
            <p className="mt-2 text-center text-xs text-gray-400">
              +{imageUrls.length - 12} more images
            </p>
          )}
        </div>
      )}

      {/* Related Articles */}
      {articles.length > 0 && (
        <div>
          <h4 className="mb-2 text-sm font-semibold text-gray-700">
            Related Articles
          </h4>
          <ul className="space-y-2">
            {articles.map((article) => (
              <li
                key={article.url}
                className="rounded-lg border border-gray-100 bg-gray-50 p-3"
              >
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
        </div>
      )}
    </div>
  );
};
