"use client";

import { useRouter } from "next/navigation";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <h1 className="text-6xl font-bold mb-4">404 - Page Not Found</h1>
      <p className="mb-8 text-lg text-gray-600">
        The page you are looking for does not exist.
      </p>
      <button
        onClick={() => router.back()}
        className="px-6 py-3 rounded bg-green-600 text-white hover:bg-green-700 transition cursor-pointer "
        aria-label="Go back to previous page"
      >
        Go Back
      </button>
    </div>
  );
}
