"use client";

import { useState } from "react";

interface Props {
  orderId: string;
}

export default function ProvisionButton({ orderId }: Props) {
  const [state, setState] = useState<"idle" | "loading" | "needsPassword" | "done" | "error">("idle");
  const [creds, setCreds] = useState<{ email: string; password: string } | null>(null);
  const [manualPassword, setManualPassword] = useState("");
  const [error, setError] = useState("");

  async function provision(passwordPlain?: string) {
    setState("loading");
    setError("");
    try {
      const res = await fetch("/api/admin/provision-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, ...(passwordPlain ? { passwordPlain } : {}) }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.needsPassword) {
          setState("needsPassword");
          return;
        }
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

  if (state === "needsPassword") {
    return (
      <div className="text-xs bg-amber-50 border border-amber-200 rounded-lg p-2 space-y-2 min-w-[220px]">
        <p className="text-amber-800 font-medium">Enter password from Flutterwave dashboard:</p>
        <input
          type="text"
          value={manualPassword}
          onChange={(e) => setManualPassword(e.target.value)}
          placeholder="e.g. Olatunji@17"
          className="w-full border border-gray-300 rounded px-2 py-1 text-gray-900 text-xs"
          autoFocus
        />
        <button
          onClick={() => provision(manualPassword)}
          disabled={!manualPassword.trim()}
          className="w-full bg-amber-600 text-white rounded px-2 py-1 font-medium hover:bg-amber-700 disabled:opacity-50"
        >
          Provision
        </button>
      </div>
    );
  }

  if (state === "error") {
    return (
      <button
        onClick={() => provision()}
        className="text-xs text-red-600 border border-red-300 rounded px-2 py-1 hover:bg-red-50"
        title={error}
      >
        Retry
      </button>
    );
  }

  return (
    <button
      onClick={() => provision()}
      disabled={state === "loading"}
      className="text-xs bg-amber-100 text-amber-700 border border-amber-300 rounded px-2 py-1 hover:bg-amber-200 font-medium disabled:opacity-60 whitespace-nowrap"
    >
      {state === "loading" ? "Provisioning…" : "Provision →"}
    </button>
  );
}
