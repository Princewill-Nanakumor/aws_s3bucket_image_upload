"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import StatusMessage from "@/components/StatusMessage";
import UploadDropzone from "@/components/UploadDropzone";
import UploadedImagesGrid from "@/components/UploadedImagesGrid";

export default function S3UploadCard() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [imagesLoading, setImagesLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<string[]>([]);

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

  const fetchImages = useCallback(async () => {
    setImagesLoading(true);
    try {
      const res = await fetch("/api/files");
      if (!res.ok) {
        setImages([]);
        return;
      }

      const data = await res.json();
      const keys = Array.isArray(data.files)
        ? data.files.filter(
            (key: unknown): key is string => typeof key === "string",
          )
        : [];

      const urls = await Promise.all(
        keys.map(async (key: string) => {
          return getFileUrlForKey(key);
        }),
      );

      setImages(urls.filter((url): url is string => Boolean(url)));
    } catch {
      setImages([]);
    } finally {
      setImagesLoading(false);
    }
  }, [getFileUrlForKey]);

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
            uploadedUrl,
            ...prev.filter((url) => url !== uploadedUrl),
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

        <UploadedImagesGrid images={images} isLoading={imagesLoading} />
      </div>
    </main>
  );
}
