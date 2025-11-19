import React, { useState } from "react";

import { api, type RouterOutputs } from "~/trpc/react";

type Attraction =
  RouterOutputs["attraction"]["getAttractionsByCountries"][number];

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
      <div className="flex items-center justify-center p-4">
        <p>Loading images ...</p>
        <div className="ml-2 h-4 w-4 animate-spin rounded-full border-2 border-t-2 border-gray-200 border-t-blue-500"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4 text-red-600">
        <p>Error loading images: {error.message}</p>
        <button
          onClick={() => void refetch()}
          className="mt-2 rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!imageUrls || imageUrls.length === 0) {
    return (
      <div className="p-4 text-gray-700">
        <p>No images found.</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {imageUrls.map((url, index) => (
          <div
            key={url || `image-${index}`}
            className="group relative overflow-hidden rounded-lg bg-gray-100 shadow-md"
          >
            {failedImages.includes(url) ? (
              <div className="flex aspect-video items-center justify-center bg-gray-300 text-sm text-gray-600">
                Image Failed to Load
                <button
                  onClick={() => {
                    setFailedImages((prev) => prev.filter((u) => u !== url));
                    setLoadedImages((prev) => prev.filter((u) => u !== url));
                  }}
                  className="ml-2 rounded bg-gray-500 px-2 py-1 text-xs text-white hover:bg-gray-600"
                >
                  Retry
                </button>
              </div>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={url}
                alt={`${attraction.name} image ${index + 1}`}
                className={`h-48 w-full object-cover transition-transform duration-300 group-hover:scale-105 ${
                  loadedImages.includes(url) ? "opacity-100" : "opacity-0"
                }`}
                onLoad={() => {
                  setLoadedImages((prev) => [...prev, url]);
                }}
                onError={(e) => {
                  console.error("Failed to load image:", url, e);
                  setFailedImages((prev) => [...prev, url]);
                }}
              />
            )}
            {!loadedImages.includes(url) && !failedImages.includes(url) && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-t-2 border-gray-300 border-t-blue-500"></div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
