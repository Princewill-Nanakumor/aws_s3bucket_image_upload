"use client";

import Image from "next/image";
import { useState } from "react";

type ImagePreviewModalProps = {
  isOpen: boolean;
  imageUrl: string;
  canGoPrev: boolean;
  canGoNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  onClose: () => void;
};

function PreviewImage({ imageUrl }: { imageUrl: string }) {
  const [isImageVisible, setIsImageVisible] = useState(false);

  return (
    <>
      <div
        className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${
          isImageVisible ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
      >
        <div className="shimmer-rtl h-full w-full opacity-70" />
        <span className="absolute rounded-full bg-black/50 px-3 py-1 text-xs font-medium text-white">
          Loading image...
        </span>
      </div>
      <Image
        src={imageUrl}
        alt="Full size preview"
        fill
        unoptimized
        onLoad={() => setIsImageVisible(true)}
        className={`object-contain transition-opacity duration-300 ease-in-out ${
          isImageVisible ? "opacity-100" : "opacity-0"
        }`}
        sizes="100vw"
        priority
      />
    </>
  );
}

export default function ImagePreviewModal({
  isOpen,
  imageUrl,
  canGoPrev,
  canGoNext,
  onPrev,
  onNext,
  onClose,
}: ImagePreviewModalProps) {
  if (!isOpen || !imageUrl) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close preview"
        className="absolute top-4 right-4 cursor-pointer rounded-full bg-white/20 p-2 text-white hover:bg-white/30"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="h-5 w-5"
        >
          <path d="M18 6L6 18" />
          <path d="M6 6l12 12" />
        </svg>
      </button>

      <div
        className="relative h-[85vh] w-full max-w-6xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onPrev}
          disabled={!canGoPrev}
          aria-label="Previous image"
          className="absolute top-1/2 left-3 z-10 -translate-y-1/2 cursor-pointer rounded-full bg-white/20 p-2 text-white hover:bg-white/30 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="h-6 w-6"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        <PreviewImage key={imageUrl} imageUrl={imageUrl} />

        <button
          type="button"
          onClick={onNext}
          disabled={!canGoNext}
          aria-label="Next image"
          className="absolute top-1/2 right-3 z-10 -translate-y-1/2 cursor-pointer rounded-full bg-white/20 p-2 text-white hover:bg-white/30 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="h-6 w-6"
          >
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>
    </div>
  );
}
