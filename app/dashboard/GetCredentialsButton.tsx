"use client";

import { useState } from "react";

interface Props {
  orderId: string;
}

interface Creds {
  email: string;
  password: string;
  webmail: string;
}

export default function GetCredentialsButton({ orderId }: Props) {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [creds, setCreds] = useState<Creds | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  async function handleClick() {
    setState("loading");
    setError("");
    try {
      const res = await fetch(`/api/user/get-credentials?orderId=${orderId}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to retrieve credentials.");
        setState("error");
        return;
      }
      setCreds(data);
      setState("done");
    } catch {
      setError("Network error. Please try again.");
      setState("error");
    }
  }

  function copy(value: string, key: string) {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 1500);
    });
  }

  if (state === "done" && creds) {
    return (
      <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm space-y-3">
        <p className="font-semibold text-amber-800">Save your credentials — password won&apos;t appear again.</p>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-gray-500 text-xs w-20 shrink-0">Email</span>
            <span className="font-mono text-gray-900 flex-1 truncate">{creds.email}</span>
            <button
              onClick={() => copy(creds.email, "email")}
              className="text-xs text-blue-600 border border-blue-200 rounded px-2 py-0.5 hover:bg-blue-50 shrink-0"
            >
              {copied === "email" ? "Copied!" : "Copy"}
            </button>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-gray-500 text-xs w-20 shrink-0">Password</span>
            <span className="font-mono font-bold text-gray-900 flex-1 truncate">{creds.password}</span>
            <button
              onClick={() => copy(creds.password, "pass")}
              className="text-xs text-blue-600 border border-blue-200 rounded px-2 py-0.5 hover:bg-blue-50 shrink-0"
            >
              {copied === "pass" ? "Copied!" : "Copy"}
            </button>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-gray-500 text-xs w-20 shrink-0">Webmail</span>
            <a
              href={creds.webmail}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-blue-600 flex-1 truncate hover:underline"
            >
              {creds.webmail}
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="mt-2">
        <p className="text-xs text-red-600 mb-1">{error}</p>
        <button
          onClick={handleClick}
          className="text-xs text-amber-600 hover:underline"
        >
          Try again →
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={state === "loading"}
      className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-300 rounded-lg px-3 py-1.5 hover:bg-amber-100 disabled:opacity-60 mt-1 inline-block"
    >
      {state === "loading" ? "Loading credentials…" : "Get my email & password →"}
    </button>
  );
}
