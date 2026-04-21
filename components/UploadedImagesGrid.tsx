"use client";

import Image from "next/image";

type UploadedImagesGridProps = {
  images: string[];
  isLoading: boolean;
};

export default function UploadedImagesGrid({
  images,
  isLoading,
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
            {images.map((url, index) => (
              <div
                key={url}
                className="relative h-28 md:h-32 lg:h-40 w-full overflow-hidden rounded-lg"
              >
                <Image
                  src={url}
                  alt="Uploaded file"
                  fill
                  unoptimized
                  loading={index === 0 ? "eager" : "lazy"}
                  sizes="(max-width: 768px) 50vw, (max-width: 1024px) 170px, 220px"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-gray-300 p-6 text-sm text-gray-500 text-center">
            No images, upload.
          </div>
        )}
      </div>
    </aside>
  );
}
