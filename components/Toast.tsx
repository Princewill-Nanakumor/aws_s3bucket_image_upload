"use client";

type ToastProps = {
  message: string;
  isVisible: boolean;
  type: "success" | "error";
};

export default function Toast({ message, isVisible, type }: ToastProps) {
  if (!isVisible || !message) return null;

  const backgroundClass =
    type === "success" ? "bg-green-600" : "bg-red-600";
  const icon =
    type === "success" ? (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="h-5 w-5"
        aria-hidden="true"
      >
        <path d="M20 6L9 17l-5-5" />
      </svg>
    ) : (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="h-5 w-5"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v5" />
        <path d="M12 16h.01" />
      </svg>
    );

  return (
    <div
      className={`fixed right-4 bottom-4 z-50 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-white shadow-lg ${backgroundClass}`}
    >
      {icon}
      {message}
    </div>
  );
}
