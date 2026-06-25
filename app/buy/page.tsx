"use client";

import { Suspense, useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  QUANTITY_OPTIONS,
  getBundlePrice,
  formatNaira,
  formatUSD,
  PRICE_PER_EMAIL_KOBO,
  MONTHLY_PRICE_PER_EMAIL_KOBO,
} from "@/lib/plans";
import { validateUsername, validatePassword } from "@/lib/utils";

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  );
}

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

function BuyForm() {
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
  const [showPasswords, setShowPasswords] = useState<Record<number, { pass: boolean; confirm: boolean }>>({});

  const domain = process.env.NEXT_PUBLIC_MAIL_DOMAIN ?? "yourdomain.com";

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/buy");
    }
  }, [status, router]);

  useEffect(() => {
    const pre = searchParams.get("username");
    if (pre) checkAvailability(0, pre);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

      // Load Flutterwave script on-demand then open inline modal
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await new Promise<void>((resolve, reject) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((window as any).FlutterwaveCheckout) { resolve(); return; }
        const s = document.createElement("script");
        s.src = "https://checkout.flutterwave.com/v3.js";
        s.onload = () => resolve();
        s.onerror = () => reject(new Error("Could not load payment script"));
        document.body.appendChild(s);
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).FlutterwaveCheckout({
        public_key: data.publicKey,
        tx_ref: data.txRef,
        amount: data.amount,
        currency: data.currency,
        redirect_url: data.redirectUrl,
        customer: data.customer,
        customizations: data.customizations,
        meta: data.meta,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        callback: function (payment: any) {
          window.location.href = `/buy/success?transaction_id=${payment.transaction_id}&tx_ref=${payment.tx_ref}&status=${payment.status}`;
        },
        onclose: function () {
          setSubmitting(false);
        },
      });
      setSubmitting(false);
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
                  <div className="text-gray-400 text-xs">{formatUSD(b.perEmail)}</div>
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
                <div className="flex rounded-xl overflow-hidden border-2 border-gray-400 bg-white focus-within:border-blue-500 shadow-sm mb-1">
                  <input
                    type="text"
                    placeholder="username"
                    value={slot.username}
                    onChange={(e) => checkAvailability(i, e.target.value)}
                    className="flex-1 px-4 py-3 text-sm outline-none bg-white text-gray-900 placeholder-gray-400"
                    maxLength={30}
                  />
                  <span className="bg-gray-100 px-3 text-gray-600 text-xs border-l border-gray-400 flex items-center font-medium">
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
                  <div className="relative">
                    <input
                      type={showPasswords[i]?.pass ? "text" : "password"}
                      placeholder="Email password (min 8 chars)"
                      value={slot.password}
                      onChange={(e) => updateSlot(i, { password: e.target.value })}
                      className="w-full border-2 border-gray-400 bg-white rounded-lg px-3 py-3 pr-11 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(prev => ({ ...prev, [i]: { ...prev[i], pass: !prev[i]?.pass } }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800 p-0.5"
                    >
                      <EyeIcon open={!!showPasswords[i]?.pass} />
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPasswords[i]?.confirm ? "text" : "password"}
                      placeholder="Confirm password"
                      value={slot.confirmPassword}
                      onChange={(e) => updateSlot(i, { confirmPassword: e.target.value })}
                      className={`w-full border-2 bg-white rounded-lg px-3 py-3 pr-11 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 shadow-sm ${
                        slot.confirmPassword && slot.password !== slot.confirmPassword
                          ? "border-red-400"
                          : "border-gray-400"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(prev => ({ ...prev, [i]: { ...prev[i], confirm: !prev[i]?.confirm } }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800 p-0.5"
                    >
                      <EyeIcon open={!!showPasswords[i]?.confirm} />
                    </button>
                  </div>
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
              <div className="text-blue-200 text-sm">≈ {formatUSD(bundle.total)}</div>
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
              ? "Opening payment..."
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

export default function BuyPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-400">Loading...</div>}>
      <BuyForm />
    </Suspense>
  );
}
