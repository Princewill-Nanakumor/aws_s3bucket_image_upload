"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import StatusMessage from "@/components/StatusMessage";
import UploadDropzone from "@/components/UploadDropzone";
import UploadedImagesGrid from "@/components/UploadedImagesGrid";
import ConfirmDeleteModal from "@/components/ConfirmDeleteModal";
import Toast from "@/components/Toast";
import ImagePreviewModal from "@/components/ImagePreviewModal";

export default function S3UploadCard() {
  type UploadedImage = { key: string; url: string };
  const PAGE_SIZE = 12;
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [imagesLoading, setImagesLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMoreImages, setHasMoreImages] = useState(false);
  const [isLoadingMoreImages, setIsLoadingMoreImages] = useState(false);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);
  const [confirmDeleteKey, setConfirmDeleteKey] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [previewImageIndex, setPreviewImageIndex] = useState<number | null>(null);

  const getFileUrlForKey = useCallback(async (key: string) => {
    const fileUrlRes = await fetch("/api/file-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key }),
    });

    if (!fileUrlRes.ok) return null;

    const fileUrlData = await fileUrlRes.json();
    return typeof fileUrlData.url === "string" ? fileUrlData.url : null;
  }, []);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setFile(null);
        setMessage("");
        setMessageType("");
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const fetchImages = useCallback(async (cursor?: string | null) => {
    const isInitialLoad = !cursor;
    if (isInitialLoad) {
      setImagesLoading(true);
    } else {
      setIsLoadingMoreImages(true);
    }

    try {
      const params = new URLSearchParams({ limit: String(PAGE_SIZE) });
      if (cursor) {
        params.set("cursor", cursor);
      }

      const res = await fetch(`/api/files?${params.toString()}`);
      if (!res.ok) {
        if (isInitialLoad) setImages([]);
        setHasMoreImages(false);
        setNextCursor(null);
        return;
      }

      const data = await res.json();
      const keys = Array.isArray(data.files)
        ? data.files.filter(
            (key: unknown): key is string => typeof key === "string",
          )
        : [];

      const files = await Promise.all(
        keys.map(async (key: string) => {
          const url = await getFileUrlForKey(key);
          return url ? { key, url } : null;
        }),
      );
      const mappedFiles = files.filter(
        (item): item is UploadedImage => Boolean(item),
      );

      setImages((prev) => {
        const base = isInitialLoad ? [] : prev;
        const next = [...base];
        for (const file of mappedFiles) {
          if (!next.some((image) => image.key === file.key)) {
            next.push(file);
          }
        }
        return next;
      });
      setNextCursor(typeof data.nextCursor === "string" ? data.nextCursor : null);
      setHasMoreImages(Boolean(data.hasMore));
    } catch {
      if (isInitialLoad) setImages([]);
      setHasMoreImages(false);
    } finally {
      if (isInitialLoad) {
        setImagesLoading(false);
      } else {
        setIsLoadingMoreImages(false);
      }
    }
  }, [PAGE_SIZE, getFileUrlForKey]);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  useEffect(() => {
    if (!message) return;

    const timeoutId = window.setTimeout(() => {
      setMessage("");
      setMessageType("");
    }, 3000);

    return () => window.clearTimeout(timeoutId);
  }, [message]);

  useEffect(() => {
    if (!toastMessage) return;

    const timeoutId = window.setTimeout(() => {
      setToastMessage("");
      setToastType("success");
    }, 2500);

    return () => window.clearTimeout(timeoutId);
  }, [toastMessage]);

  const handleRemove = () => {
    setFile(null);
    setMessage("");
    setMessageType("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage("Please select a file");
      setMessageType("error");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage("File must be under 5MB");
      setMessageType("error");
      return;
    }

    setLoading(true);
    setMessage("");
    setMessageType("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        setMessage("Upload failed");
        setMessageType("error");
        return;
      }

      const data = await res.json();
      setMessage(data.message || "Upload complete");
      setMessageType("success");
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";

      const uploadedKey = typeof data.key === "string" ? data.key : null;
      if (uploadedKey) {
        const uploadedUrl = await getFileUrlForKey(uploadedKey);
        if (uploadedUrl) {
          setImages((prev) => [
            { key: uploadedKey, url: uploadedUrl },
            ...prev.filter((image) => image.key !== uploadedKey),
          ]);
          return;
        }
      }

      fetchImages();
    } catch {
      setMessage("Upload failed");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (key: string) => {
    setDeletingKey(key);
    try {
      const res = await fetch("/api/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
      });

      if (!res.ok) {
        setToastType("error");
        setToastMessage("Delete failed");
        return;
      }

      setImages((prev) => prev.filter((image) => image.key !== key));
      setToastType("success");
      setToastMessage("Image deleted successfully");
    } catch {
      setToastType("error");
      setToastMessage("Delete failed");
    } finally {
      setDeletingKey(null);
    }
  };

  const handleRequestDelete = (key: string) => {
    setConfirmDeleteKey(key);
  };

  const handleCloseDeleteModal = () => {
    if (deletingKey) return;
    setConfirmDeleteKey(null);
  };

  const handleConfirmDelete = async () => {
    if (!confirmDeleteKey) return;
    await handleDelete(confirmDeleteKey);
    setConfirmDeleteKey(null);
  };

  const handlePreviewImage = (index: number) => {
    setPreviewImageIndex(index);
  };

  const handleLoadMoreImages = () => {
    if (!hasMoreImages || !nextCursor || isLoadingMoreImages) return;
    fetchImages(nextCursor);
  };

  const handleCloseImagePreview = () => {
    setPreviewImageIndex(null);
  };

  const handlePreviewPrev = () => {
    setPreviewImageIndex((prev) => {
      if (prev === null || prev <= 0) return prev;
      return prev - 1;
    });
  };

  const handlePreviewNext = () => {
    setPreviewImageIndex((prev) => {
      if (prev === null || prev >= images.length - 1) return prev;
      return prev + 1;
    });
  };

  const previewImageUrl =
    previewImageIndex !== null ? images[previewImageIndex]?.url || "" : "";
  const canGoPrev = previewImageIndex !== null && previewImageIndex > 0;
  const canGoNext =
    previewImageIndex !== null && previewImageIndex < images.length - 1;

  return (
    <main className="relative min-h-screen overflow-hidden bg-linear-to-br from-slate-100 via-blue-50 to-indigo-100 p-4 md:p-8 flex items-center justify-center">
      <div className="pointer-events-none absolute -top-20 -left-20 h-72 w-72 rounded-full bg-indigo-300/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-sky-300/40 blur-3xl" />

      <div className="relative z-10 w-full max-w-6xl flex flex-col gap-6 md:gap-10 lg:gap-28 md:flex-row md:items-center md:justify-center">
        <section className="bg-linear-to-br from-white/90 via-indigo-50/75 to-sky-50/75 backdrop-blur-md shadow-xl rounded-3xl border border-white/70 p-8 w-full md:max-w-md relative">
          <div className="pointer-events-none absolute inset-0 rounded-3xl border-2 border-transparent bg-linear-to-r from-fuchsia-200/70 via-sky-200/70 to-indigo-200/70 opacity-70 [mask:linear-gradient(#fff_0_0)_padding-box,linear-gradient(#fff_0_0)] mask-exclude [-webkit-mask:linear-gradient(#fff_0_0)_padding-box,linear-gradient(#fff_0_0)] [-webkit-mask-composite:xor]" />
          <div className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-indigo-200/40" />
          <h1 className="font-display text-3xl font-semibold mb-6 text-center text-slate-800">
            Upload File to S3
          </h1>

          <UploadDropzone
            file={file}
            preview={preview}
            fileInputRef={fileInputRef}
            onRemove={handleRemove}
            onFileSelect={setFile}
          />

          <button
            onClick={handleUpload}
            disabled={loading || !file}
            className="mt-6 w-full bg-linear-to-r from-slate-900 to-slate-700 text-white py-2.5 rounded-xl hover:from-slate-800 hover:to-slate-600 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-md transition"
          >
            {loading ? "Uploading..." : "Upload"}
          </button>

          <StatusMessage message={message} type={messageType} />
        </section>

        <UploadedImagesGrid
          images={images}
          isLoading={imagesLoading}
          isLoadingMore={isLoadingMoreImages}
          hasMore={hasMoreImages}
          deletingKey={deletingKey}
          onRequestDelete={handleRequestDelete}
          onPreviewImage={handlePreviewImage}
          onLoadMore={handleLoadMoreImages}
        />
        <ConfirmDeleteModal
          isOpen={Boolean(confirmDeleteKey)}
          isDeleting={Boolean(deletingKey)}
          onClose={handleCloseDeleteModal}
          onConfirm={handleConfirmDelete}
        />
        <ImagePreviewModal
          isOpen={previewImageIndex !== null}
          imageUrl={previewImageUrl}
          canGoPrev={canGoPrev}
          canGoNext={canGoNext}
          onPrev={handlePreviewPrev}
          onNext={handlePreviewNext}
          onClose={handleCloseImagePreview}
        />
        <Toast
          message={toastMessage}
          isVisible={Boolean(toastMessage)}
          type={toastType}
        />
      </div>
    </main>
  );
}
