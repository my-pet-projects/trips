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

  const {
    data: imageUrls,
    isLoading,
    isError,
    error,
    refetch,
  } = api.attractionScraper.findAttractionImages.useQuery(
    {
      name: attraction.name,
      city: attraction.city.name,
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

  if (!imageUrls || imageUrls.length === 0) {
    return (
      <div className="mb-4 rounded-lg bg-gray-50 py-4 text-center">
        <p className="text-sm text-gray-500">No images available</p>
      </div>
    );
  }

  const validImages = imageUrls.filter((url) => !failedImages.includes(url));

  if (validImages.length === 0) {
    return (
      <div className="mb-4 rounded-lg bg-gray-50 py-4 text-center">
        <p className="text-sm text-gray-500">No images available</p>
      </div>
    );
  }

  return (
    <div className="mb-4">
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
  );
};
