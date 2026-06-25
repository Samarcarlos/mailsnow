"use client";

import { Suspense, useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  QUANTITY_OPTIONS,
  getBundlePrice,
  formatNaira,
  PRICE_PER_EMAIL_KOBO,
  MONTHLY_PRICE_PER_EMAIL_KOBO,
} from "@/lib/plans";
import { validateUsername, validatePassword } from "@/lib/utils";

// One entry per email being purchased
interface EmailSlot {
  username: string;
  availability: "idle" | "checking" | "available" | "taken" | "invalid";
  message: string;
  password: string;
  confirmPassword: string;
}

function emptySlot(): EmailSlot {
  return { username: "", availability: "idle", message: "", password: "", confirmPassword: "" };
}

function CheckoutForm() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [qty, setQty] = useState<number>(1);
  const [billingType, setBillingType] = useState<"ONE_TIME" | "MONTHLY">("ONE_TIME");
  const [slots, setSlots] = useState<EmailSlot[]>([
    { ...emptySlot(), username: searchParams.get("username") ?? "" },
  ]);
  const [debounceTimers, setDebounceTimers] = useState<Record<number, ReturnType<typeof setTimeout>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const domain = process.env.NEXT_PUBLIC_MAIL_DOMAIN ?? "yourdomain.com";

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/checkout");
    }
  }, [status, router]);

  // Check availability on first slot if pre-filled
  useEffect(() => {
    const pre = searchParams.get("username");
    if (pre) checkAvailability(0, pre);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync slot count with qty
  useEffect(() => {
    setSlots((prev) => {
      if (qty > prev.length) {
        return [...prev, ...Array(qty - prev.length).fill(null).map(emptySlot)];
      }
      return prev.slice(0, qty);
    });
  }, [qty]);

  function updateSlot(index: number, patch: Partial<EmailSlot>) {
    setSlots((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  }

  function checkAvailability(index: number, value: string) {
    const cleaned = value.toLowerCase().replace(/[^a-z0-9._-]/g, "");
    updateSlot(index, { username: cleaned, availability: "idle", message: "" });

    if (debounceTimers[index]) clearTimeout(debounceTimers[index]);
    if (!cleaned) return;

    const err = validateUsername(cleaned);
    if (err) { updateSlot(index, { availability: "invalid", message: err }); return; }

    updateSlot(index, { availability: "checking" });
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/availability?username=${encodeURIComponent(cleaned)}`);
        const data = await res.json();
        updateSlot(index, {
          availability: data.available ? "available" : "taken",
          message: data.available ? "" : "Already taken",
        });
      } catch {
        updateSlot(index, { availability: "idle" });
      }
    }, 500);
    setDebounceTimers((prev) => ({ ...prev, [index]: t }));
  }

  const bundle = getBundlePrice(qty, billingType);
  const allAvailable = slots.every((s) => s.availability === "available");
  const allPasswordsValid = slots.every(
    (s) => s.password.length >= 8 && s.password === s.confirmPassword
  );
  const canPay = allAvailable && allPasswordsValid && !submitting;

  async function handlePurchase() {
    setError("");
    for (const slot of slots) {
      const passErr = validatePassword(slot.password);
      if (passErr) { setError(`${slot.username}: ${passErr}`); return; }
      if (slot.password !== slot.confirmPassword) {
        setError(`Passwords for ${slot.username} do not match`); return;
      }
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slots: slots.map((s) => ({ username: s.username, password: s.password })),
          billingType,
          qty,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Checkout failed"); setSubmitting(false); return; }
      window.location.href = data.url;
    } catch {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  if (status === "loading") {
    return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-blue-600">Mailsnow</Link>
          <p className="text-gray-500 mt-1 text-sm">Get your email address</p>
        </div>

        {/* Step 1: How many? */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-4">
          <h2 className="font-semibold text-gray-800 mb-1">1. How many emails?</h2>
          <p className="text-xs text-gray-400 mb-4">Buy for yourself, family, or team. More = cheaper per email.</p>
          <div className="grid grid-cols-4 gap-2">
            {QUANTITY_OPTIONS.map((opt) => {
              const b = getBundlePrice(opt.qty, billingType);
              return (
                <button
                  key={opt.qty}
                  onClick={() => setQty(opt.qty)}
                  className={`rounded-xl border-2 p-3 text-center transition ${
                    qty === opt.qty ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="font-bold text-sm">{opt.qty}</div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {opt.qty === 1 ? "email" : "emails"}
                  </div>
                  {opt.discountPct > 0 && (
                    <div className="text-xs text-green-600 font-medium mt-1">-{opt.discountPct}%</div>
                  )}
                  <div className="text-blue-600 font-bold text-xs mt-1">
                    {formatNaira(b.perEmail)}/ea
                  </div>
                </button>
              );
            })}
          </div>

          {/* Billing toggle */}
          <div className="flex gap-2 mt-4 bg-gray-100 rounded-lg p-1 w-fit">
            {(["ONE_TIME", "MONTHLY"] as const).map((bt) => (
              <button
                key={bt}
                onClick={() => setBillingType(bt)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${
                  billingType === bt ? "bg-white shadow text-gray-900" : "text-gray-500"
                }`}
              >
                {bt === "ONE_TIME" ? "One-time" : "Monthly"}
              </button>
            ))}
          </div>

          {billingType === "ONE_TIME" && (
            <p className="text-xs text-gray-400 mt-2">
              One-time = pay once, keep the email forever.
            </p>
          )}
          {billingType === "MONTHLY" && (
            <p className="text-xs text-gray-400 mt-2">
              Monthly = {formatNaira(MONTHLY_PRICE_PER_EMAIL_KOBO)}/email/month. Cancel anytime.
            </p>
          )}
        </div>

        {/* Step 2: Usernames & passwords */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-4">
          <h2 className="font-semibold text-gray-800 mb-4">
            2. Set up {qty === 1 ? "your email" : `each of your ${qty} emails`}
          </h2>
          <div className="space-y-6">
            {slots.map((slot, i) => (
              <div key={i} className={`${qty > 1 ? "pb-6 border-b border-gray-100 last:border-0 last:pb-0" : ""}`}>
                {qty > 1 && (
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                    Email #{i + 1}
                  </p>
                )}

                {/* Username */}
                <div className="flex rounded-xl overflow-hidden border-2 border-gray-200 focus-within:border-blue-500 mb-1">
                  <input
                    type="text"
                    placeholder="username"
                    value={slot.username}
                    onChange={(e) => checkAvailability(i, e.target.value)}
                    className="flex-1 px-4 py-2.5 text-sm outline-none"
                    maxLength={30}
                  />
                  <span className="bg-gray-50 px-3 text-gray-400 text-xs border-l border-gray-200 flex items-center">
                    @{domain}
                  </span>
                </div>
                <div className="h-4 text-xs mb-3">
                  {slot.availability === "checking" && <span className="text-gray-400">Checking...</span>}
                  {slot.availability === "available" && <span className="text-green-600">✓ Available</span>}
                  {slot.availability === "taken" && <span className="text-red-500">✗ Already taken</span>}
                  {slot.availability === "invalid" && <span className="text-orange-500">{slot.message}</span>}
                </div>

                {/* Password */}
                <div className="flex flex-col gap-2">
                  <input
                    type="password"
                    placeholder="Email password (min 8 chars)"
                    value={slot.password}
                    onChange={(e) => updateSlot(i, { password: e.target.value })}
                    className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="password"
                    placeholder="Confirm password"
                    value={slot.confirmPassword}
                    onChange={(e) => updateSlot(i, { confirmPassword: e.target.value })}
                    className={`border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      slot.confirmPassword && slot.password !== slot.confirmPassword
                        ? "border-red-300"
                        : "border-gray-200"
                    }`}
                  />
                  <p className="text-xs text-gray-400">
                    🔐 Only you will know this password. We do not store it — it goes straight to your private mailbox.
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">
            {error}
          </div>
        )}

        {/* Order summary + Pay */}
        <div className="bg-blue-600 text-white rounded-2xl p-6">
          <div className="flex justify-between items-start mb-1">
            <div>
              <div className="font-semibold">
                {qty} email{qty > 1 ? "s" : ""} @ {formatNaira(PRICE_PER_EMAIL_KOBO)}/ea
              </div>
              {bundle.saved > 0 && (
                <div className="text-blue-200 text-xs mt-0.5">
                  You save {formatNaira(bundle.saved)} ({bundle.discountPct}% off)
                </div>
              )}
            </div>
            <div className="text-right">
              {bundle.saved > 0 && (
                <div className="text-blue-300 text-xs line-through">{formatNaira(bundle.original)}</div>
              )}
              <div className="font-bold text-2xl">{formatNaira(bundle.total)}</div>
            </div>
          </div>
          <p className="text-blue-200 text-xs mb-5">
            {billingType === "ONE_TIME" ? "One-time lifetime payment" : "Billed monthly"}
          </p>
          <button
            onClick={handlePurchase}
            disabled={!canPay}
            className="w-full bg-white text-blue-600 font-bold py-3 rounded-xl hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {submitting
              ? "Redirecting to payment..."
              : `Pay ${formatNaira(bundle.total)} →`}
          </button>
          <p className="text-center text-blue-200 text-xs mt-3">
            Secured by Flutterwave · Card, bank transfer, or mobile money
          </p>
          <p className="text-center text-blue-300 text-xs mt-2">
            By paying you agree to our{" "}
            <a href="/terms" target="_blank" className="underline hover:text-white">Terms of Service</a>
            {" "}and{" "}
            <a href="/privacy" target="_blank" className="underline hover:text-white">Privacy Policy</a>
          </p>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          Signed in as {session?.user?.email} ·{" "}
          <Link href="/dashboard" className="underline">My accounts</Link>
        </p>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-400">Loading...</div>}>
      <CheckoutForm />
    </Suspense>
  );
}
