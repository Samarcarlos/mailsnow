"use client";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";

function AuthErrorContent() {
  const params = useSearchParams();
  const error = params.get("error") ?? "Unknown";
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-2xl border border-red-200 p-8 max-w-md w-full text-center">
        <h1 className="text-xl font-bold text-red-600 mb-2">Sign-in Error</h1>
        <p className="text-gray-600 text-sm mb-4">Error code: <code className="bg-gray-100 px-2 py-1 rounded font-mono">{error}</code></p>
        <Link href="/login" className="text-blue-600 underline text-sm">Back to login</Link>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <AuthErrorContent />
    </Suspense>
  );
}
