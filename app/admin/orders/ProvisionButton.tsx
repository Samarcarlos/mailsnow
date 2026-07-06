"use client";

import { useState } from "react";

interface Props {
  orderId: string;
}

export default function ProvisionButton({ orderId }: Props) {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [creds, setCreds] = useState<{ email: string; password: string } | null>(null);
  const [error, setError] = useState("");

  async function handleProvision() {
    setState("loading");
    setError("");
    try {
      const res = await fetch("/api/admin/provision-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to provision");
        setState("error");
        return;
      }
      setCreds(data);
      setState("done");
    } catch {
      setError("Network error");
      setState("error");
    }
  }

  if (state === "done" && creds) {
    return (
      <div className="text-xs bg-green-50 border border-green-200 rounded-lg p-2 space-y-1 min-w-[200px]">
        <p className="text-green-700 font-semibold">✓ Account provisioned</p>
        <p className="font-mono text-gray-800">{creds.email}</p>
        <p className="font-mono font-bold text-gray-900">Password: {creds.password}</p>
      </div>
    );
  }

  if (state === "error") {
    return (
      <button
        onClick={handleProvision}
        className="text-xs text-red-600 border border-red-300 rounded px-2 py-1 hover:bg-red-50"
        title={error}
      >
        Retry ({error})
      </button>
    );
  }

  return (
    <button
      onClick={handleProvision}
      disabled={state === "loading"}
      className="text-xs bg-amber-100 text-amber-700 border border-amber-300 rounded px-2 py-1 hover:bg-amber-200 font-medium disabled:opacity-60 whitespace-nowrap"
    >
      {state === "loading" ? "Provisioning…" : "Provision →"}
    </button>
  );
}
