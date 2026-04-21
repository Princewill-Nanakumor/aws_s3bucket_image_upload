export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
export const ALLOWED_MIME_PREFIX = "image/";
export const ALLOWED_EXTENSIONS = new Set([
  "jpg",
  "jpeg",
  "png",
  "webp",
  "gif",
  "avif",
]);

export const getFileExtension = (name: string) =>
  name.split(".").pop()?.toLowerCase() || "";

export const hasAllowedExtension = (name: string) =>
  ALLOWED_EXTENSIONS.has(getFileExtension(name));

export const isAllowedImageMimeType = (mimeType: string) =>
  mimeType.startsWith(ALLOWED_MIME_PREFIX);

// MIME type is browser-provided and can be spoofed; validate extension + MIME together.
export const isAllowedImageUpload = (name: string, mimeType: string) =>
  hasAllowedExtension(name) && isAllowedImageMimeType(mimeType);
