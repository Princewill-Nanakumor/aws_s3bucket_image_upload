export const sanitizeFilename = (name: string) =>
  name.replace(/[^\w.\-]/g, "_").replace(/_+/g, "_");
