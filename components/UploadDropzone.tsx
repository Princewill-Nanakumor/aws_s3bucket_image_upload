"use client";

import Image from "next/image";
import { RefObject } from "react";

type UploadDropzoneProps = {
  file: File | null;
  preview: string | null;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onRemove: () => void;
  onFileSelect: (file: File) => void;
};

const formatFileSize = (size: number) => {
  if (size < 1024) return size + " B";
  if (size < 1024 * 1024) return (size / 1024).toFixed(1) + " KB";
  return (size / (1024 * 1024)).toFixed(1) + " MB";
};

export default function UploadDropzone({
  file,
  preview,
  fileInputRef,
  onRemove,
  onFileSelect,
}: UploadDropzoneProps) {
  return (
    <div className="block w-full">
      <div
        className={`relative flex flex-col items-center justify-center w-full border-2 border-dashed border-slate-300/90 rounded-2xl bg-white/70 p-6 transition-all duration-300 ease-out ${
          file
            ? "cursor-default h-62.5"
            : "hover:border-slate-600 cursor-pointer h-29"
        }`}
        onClick={() => {
          if (file) return;
          fileInputRef.current?.click();
        }}
        onKeyDown={(e) => {
          if (file) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        role="button"
        tabIndex={0}
      >
        {file && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onRemove();
            }}
            className="absolute top-2 right-2 z-10 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 cursor-pointer"
          >
            X
          </button>
        )}

        {preview && file?.type.startsWith("image/") ? (
          <Image
            src={preview}
            alt="Preview"
            width={160}
            height={160}
            unoptimized
            className="mb-4 max-h-40 w-auto rounded-lg object-contain transition-transform duration-300 ease-out"
          />
        ) : file ? (
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="h-10 w-10"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M14 3.75H7.5A2.25 2.25 0 0 0 5.25 6v12A2.25 2.25 0 0 0 7.5 20.25h9A2.25 2.25 0 0 0 18.75 18V8.5L14 3.75Z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M14.25 3.75V8.25h4.5"
              />
            </svg>
          </div>
        ) : null}

        {file ? (
          <div className="text-center max-w-full">
            <p className="text-gray-600 text-sm truncate max-w-57.5">
              {file.name}
            </p>
            <p className="text-gray-400 text-xs mt-1">
              {formatFileSize(file.size)}
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1.5 text-gray-600">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="h-6 w-6"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 16V8m0 0-3 3m3-3 3 3M4.5 15.75v1.5A2.25 2.25 0 0 0 6.75 19.5h10.5A2.25 2.25 0 0 0 19.5 17.25v-1.5"
              />
            </svg>
            <span className="text-xs font-medium">
              Click here to select a file
            </span>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        onClick={(e) => {
          e.currentTarget.value = "";
        }}
        onChange={(e) => {
          const nextFile = e.target.files?.[0];
          if (!nextFile) return;
          onFileSelect(nextFile);
        }}
        className="hidden"
      />
    </div>
  );
}
