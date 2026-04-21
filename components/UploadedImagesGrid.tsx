"use client";

import Image from "next/image";

type UploadedImagesGridProps = {
  images: { key: string; url: string }[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  deletingKey: string | null;
  onRequestDelete: (key: string) => void;
  onPreviewImage: (index: number) => void;
  onLoadMore: () => void;
};

export default function UploadedImagesGrid({
  images,
  isLoading,
  isLoadingMore,
  hasMore,
  deletingKey,
  onRequestDelete,
  onPreviewImage,
  onLoadMore,
}: UploadedImagesGridProps) {
  const shouldShowScrollHint = !isLoading && images.length > 6;

  return (
    <aside className="bg-linear-to-br from-white/90 via-blue-50/75 to-indigo-50/75 backdrop-blur-md shadow-xl rounded-3xl border border-white/70 p-6 w-full md:w-90 lg:w-115 relative">
      <div className="pointer-events-none absolute inset-0 rounded-3xl border-2 border-transparent bg-linear-to-r from-fuchsia-200/70 via-sky-200/70 to-indigo-200/70 opacity-70 [mask:linear-gradient(#fff_0_0)_padding-box,linear-gradient(#fff_0_0)] mask-exclude [-webkit-mask:linear-gradient(#fff_0_0)_padding-box,linear-gradient(#fff_0_0)] [-webkit-mask-composite:xor]" />
      <div className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-indigo-200/40" />
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-2xl font-semibold text-left text-slate-800">
          Uploaded Images
        </h2>
        {shouldShowScrollHint && (
          <span className="text-xs font-medium text-gray-500">
            Scroll for more
          </span>
        )}
      </div>

      <div
        className="max-h-90 md:max-h-102 lg:max-h-123 overflow-y-auto pr-4 [scrollbar-gutter:stable]"
        style={{ scrollbarGutter: "stable" }}
      >
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3 lg:gap-4">
            {[0, 1, 2, 3, 4, 5].map((item) => (
              <div
                key={item}
                className="h-28 md:h-32 lg:h-40 w-full rounded-lg bg-gray-200 animate-pulse"
              />
            ))}
          </div>
        ) : images.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 lg:gap-4">
            {images.map((image, index) => (
              <div
                key={image.key}
                className="group relative h-28 md:h-32 lg:h-40 w-full overflow-hidden rounded-lg"
              >
                <button
                  type="button"
                  onClick={() => onPreviewImage(index)}
                  aria-label="Open full image preview"
                  className="absolute inset-0 cursor-zoom-in"
                >
                  <Image
                    src={image.url}
                    alt="Uploaded file"
                    fill
                    unoptimized
                    loading={index === 0 ? "eager" : "lazy"}
                    sizes="(max-width: 768px) 50vw, (max-width: 1024px) 170px, 220px"
                    className="object-cover"
                  />
                </button>
                <button
                  type="button"
                  onClick={() => onRequestDelete(image.key)}
                  disabled={deletingKey === image.key}
                  aria-label="Delete image"
                  className="absolute top-2 right-2 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-red-600 text-white shadow-md opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-700 focus:opacity-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {deletingKey === image.key ? (
                    <span className="text-[10px] font-semibold">...</span>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="h-4 w-4"
                    >
                      <path d="M3 6h18" />
                      <path d="M8 6V4h8v2" />
                      <path d="M19 6l-1 14H6L5 6" />
                      <path d="M10 11v6" />
                      <path d="M14 11v6" />
                    </svg>
                  )}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-gray-300 p-6 text-sm text-gray-500 text-center">
            No images, upload.
          </div>
        )}

        {!isLoading && images.length > 0 && hasMore && (
          <button
            type="button"
            onClick={onLoadMore}
            disabled={isLoadingMore}
            className="mt-4 w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoadingMore ? "Loading..." : "Load more"}
          </button>
        )}
      </div>
    </aside>
  );
}
