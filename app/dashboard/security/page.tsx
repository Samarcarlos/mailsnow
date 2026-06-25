"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

type TwoFAStatus = "loading" | "disabled" | "setup" | "enabled";

export default function SecurityPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [twoFAStatus, setTwoFAStatus] = useState<TwoFAStatus>("loading");
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/auth/2fa/status")
      .then((r) => r.json())
      .then((d) => setTwoFAStatus(d.enabled ? "enabled" : "disabled"));
  }, [status]);

  async function startSetup() {
    setActionLoading(true);
    setError("");
    const res = await fetch("/api/auth/2fa/setup");
    const data = await res.json();
    setActionLoading(false);
    if (!res.ok) { setError(data.error ?? "Failed to start setup"); return; }
    setQrCode(data.qrCodeDataUrl);
    setSecret(data.secret);
    setTwoFAStatus("setup");
  }

  async function enableTwoFA(e: React.FormEvent) {
    e.preventDefault();
    setActionLoading(true);
    setError("");
    const res = await fetch("/api/auth/2fa/enable", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    const data = await res.json();
    setActionLoading(false);
    if (!res.ok) { setError(data.error ?? "Failed to enable 2FA"); return; }
    setTwoFAStatus("enabled");
    setCode("");
    setSuccess("Two-factor authentication is now enabled.");
  }

  async function disableTwoFA(e: React.FormEvent) {
    e.preventDefault();
    setActionLoading(true);
    setError("");
    const res = await fetch("/api/auth/2fa/disable", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    const data = await res.json();
    setActionLoading(false);
    if (!res.ok) { setError(data.error ?? "Failed to disable 2FA"); return; }
    setTwoFAStatus("disabled");
    setCode("");
    setSuccess("Two-factor authentication has been disabled.");
  }

  if (status === "loading" || twoFAStatus === "loading") {
    return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-blue-600">Mailsnow</Link>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/dashboard" className="text-gray-500 hover:text-gray-900">← My accounts</Link>
            <span className="text-gray-500">{session?.user?.email}</span>
          </div>
        </div>
      </nav>

      <div className="max-w-lg mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Security</h1>
        <p className="text-gray-500 text-sm mb-8">Manage two-factor authentication for your account.</p>

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3 mb-6">
            {success}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-6">
            {error}
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h2 className="font-semibold text-gray-900">Two-factor authentication (2FA)</h2>
              <p className="text-sm text-gray-500 mt-1">
                Add an extra layer of security. You&apos;ll need an authenticator app (Google Authenticator, Authy, etc.) to log in.
              </p>
            </div>
            <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${
              twoFAStatus === "enabled" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
            }`}>
              {twoFAStatus === "enabled" ? "Enabled" : "Disabled"}
            </span>
          </div>

          {twoFAStatus === "disabled" && (
            <button
              onClick={startSetup}
              disabled={actionLoading}
              className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-60 transition"
            >
              {actionLoading ? "Setting up..." : "Enable 2FA"}
            </button>
          )}

          {twoFAStatus === "setup" && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                <strong>Step 1:</strong> Scan this QR code with your authenticator app.
              </p>
              {qrCode && (
                <div className="flex justify-center">
                  <Image src={qrCode} alt="QR Code" width={180} height={180} className="rounded-lg border border-gray-200" />
                </div>
              )}
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Can&apos;t scan? Enter this code manually:</p>
                <p className="font-mono text-sm text-gray-800 break-all">{secret}</p>
              </div>
              <p className="text-sm text-gray-600">
                <strong>Step 2:</strong> Enter the 6-digit code from your app to verify.
              </p>
              <form onSubmit={enableTwoFA} className="flex flex-col gap-3">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-center text-xl font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="000000"
                />
                <button
                  type="submit"
                  disabled={actionLoading || code.length !== 6}
                  className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-60 transition"
                >
                  {actionLoading ? "Enabling..." : "Verify & enable 2FA"}
                </button>
              </form>
              <button
                onClick={() => { setTwoFAStatus("disabled"); setCode(""); setError(""); }}
                className="w-full text-sm text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
            </div>
          )}

          {twoFAStatus === "enabled" && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                To disable 2FA, enter the current 6-digit code from your authenticator app.
              </p>
              <form onSubmit={disableTwoFA} className="flex flex-col gap-3">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-center text-xl font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="000000"
                />
                <button
                  type="submit"
                  disabled={actionLoading || code.length !== 6}
                  className="w-full bg-red-600 text-white py-2.5 rounded-lg font-semibold hover:bg-red-700 disabled:opacity-60 transition"
                >
                  {actionLoading ? "Disabling..." : "Disable 2FA"}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
