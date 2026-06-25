"use client";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";

function AuthErrorContent() {
  const params = useSearchParams();
  const error = params.get("error") ?? "Unknown";
  const allParams: Record<string, string> = {};
  params.forEach((value, key) => { allParams[key] = value; });

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-2xl border border-red-200 p-8 max-w-lg w-full">
        <h1 className="text-xl font-bold text-red-600 mb-4">Sign-in Error</h1>
        <p className="text-sm mb-2"><strong>Error:</strong> <code className="bg-gray-100 px-2 py-1 rounded">{error}</code></p>
        <p className="text-sm mb-4"><strong>All params:</strong></p>
        <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto mb-4">{JSON.stringify(allParams, null, 2)}</pre>
        <p className="text-xs text-gray-400 mb-4"><strong>URL:</strong> {typeof window !== "undefined" ? window.location.href : ""}</p>
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
