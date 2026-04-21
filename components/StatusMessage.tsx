"use client";

type StatusMessageProps = {
  message: string;
  type: "success" | "error" | "";
};

export default function StatusMessage({ message, type }: StatusMessageProps) {
  if (!message) return null;

  return (
    <p
      className={`mt-4 text-center text-sm ${
        type === "success" ? "text-green-600" : "text-red-600"
      }`}
    >
      {message}
    </p>
  );
}
