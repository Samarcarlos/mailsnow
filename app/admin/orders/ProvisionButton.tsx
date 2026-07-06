"use client";

import { useState } from "react";

interface Props {
  orderId: string;
}

export default function ProvisionButton({ orderId }: Props) {
  const [state, setState] = useState<"idle" | "form" | "loading" | "done" | "error">("idle");
  const [creds, setCreds] = useState<{ email: string; password: string } | null>(null);
  const [manualPassword, setManualPassword] = useState("");
  const [error, setError] = useState("");

  async function provision() {
    if (!manualPassword.trim()) return;
    setState("loading");
    setError("");
    try {
      const res = await fetch("/api/admin/provision-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, passwordPlain: manualPassword.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to provision");
        setState("form");
        return;
      }
      setCreds(data);
      setState("done");
    } catch {
      setError("Network error — try again");
      setState("form");
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

  if (state === "form" || state === "loading") {
    return (
      <div className="text-xs bg-amber-50 border border-amber-200 rounded-lg p-2 space-y-2 min-w-[220px]">
        <p className="text-amber-800 font-medium">Password (from Flutterwave):</p>
        {error && <p className="text-red-600">{error}</p>}
        <input
          type="text"
          value={manualPassword}
          onChange={(e) => setManualPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && provision()}
          placeholder="e.g. Olatunji@17"
          className="w-full border border-gray-300 rounded px-2 py-1 text-gray-900 text-xs"
          autoFocus
          disabled={state === "loading"}
        />
        <div className="flex gap-1">
          <button
            onClick={provision}
            disabled={state === "loading" || !manualPassword.trim()}
            className="flex-1 bg-amber-600 text-white rounded px-2 py-1 font-medium hover:bg-amber-700 disabled:opacity-50"
          >
            {state === "loading" ? "Provisioning…" : "Provision"}
          </button>
          <button
            onClick={() => setState("idle")}
            disabled={state === "loading"}
            className="text-gray-500 rounded px-2 py-1 hover:bg-gray-100"
          >
            ✕
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setState("form")}
      className="text-xs bg-amber-100 text-amber-700 border border-amber-300 rounded px-2 py-1 hover:bg-amber-200 font-medium whitespace-nowrap"
    >
      Provision →
    </button>
  );
}
