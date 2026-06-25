"use client";

import { useState } from "react";
import Link from "next/link";
import { QUANTITY_OPTIONS, getBundlePrice, formatNaira, PRICE_PER_EMAIL_KOBO } from "@/lib/plans";
import Footer from "@/components/layout/Footer";
import { validateUsername } from "@/lib/utils";

export default function HomePage() {
  const [username, setUsername] = useState("");
  const [availability, setAvailability] = useState<{
    status: "idle" | "checking" | "available" | "taken" | "invalid";
    message?: string;
  }>({ status: "idle" });
  const [debounceTimer, setDebounceTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const domain = process.env.NEXT_PUBLIC_MAIL_DOMAIN ?? "yourdomain.com";

  function handleUsernameChange(value: string) {
    const cleaned = value.toLowerCase().replace(/[^a-z0-9._-]/g, "");
    setUsername(cleaned);

    if (debounceTimer) clearTimeout(debounceTimer);

    if (!cleaned) {
      setAvailability({ status: "idle" });
      return;
    }

    const validationError = validateUsername(cleaned);
    if (validationError) {
      setAvailability({ status: "invalid", message: validationError });
      return;
    }

    setAvailability({ status: "checking" });
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/availability?username=${encodeURIComponent(cleaned)}`);
        const data = await res.json();
        if (data.available) {
          setAvailability({ status: "available" });
        } else {
          setAvailability({ status: "taken", message: data.message });
        }
      } catch {
        setAvailability({ status: "idle" });
      }
    }, 500);
    setDebounceTimer(timer);
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Nav */}
      <nav className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <span className="text-xl font-bold text-blue-600">Mailnow</span>
          <div className="flex gap-4 text-sm items-center">
            <Link href="/faq" className="text-gray-500 hover:text-gray-900 hidden md:block">FAQ</Link>
            <Link href="/login" className="text-gray-600 hover:text-gray-900">Sign in</Link>
            <Link
              href="/register"
              className="bg-blue-600 text-white px-4 py-1.5 rounded-lg hover:bg-blue-700"
            >
              Register
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 py-16 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
          Your own email address,<br />
          <span className="text-blue-600">owned forever.</span>
        </h1>
        <p className="text-lg text-gray-500 mb-10 max-w-lg">
          Get a professional email that works on any phone, PC, or mail app.
          Pay once — yours for life.
        </p>

        {/* Username checker */}
        <div className="w-full max-w-md">
          <div className="flex rounded-xl overflow-hidden border-2 border-blue-200 focus-within:border-blue-500 bg-white shadow-sm">
            <input
              type="text"
              placeholder="yourname"
              value={username}
              onChange={(e) => handleUsernameChange(e.target.value)}
              className="flex-1 px-4 py-3 text-base outline-none"
              maxLength={30}
            />
            <span className="bg-blue-50 px-4 py-3 text-blue-600 font-medium text-sm border-l border-blue-200 flex items-center">
              @{domain}
            </span>
          </div>

          <div className="mt-2 h-5 text-sm">
            {availability.status === "checking" && (
              <span className="text-gray-400">Checking availability...</span>
            )}
            {availability.status === "available" && (
              <span className="text-green-600 font-medium">
                ✓ {username}@{domain} is available!
              </span>
            )}
            {availability.status === "taken" && (
              <span className="text-red-500">✗ Already taken. Try another name.</span>
            )}
            {availability.status === "invalid" && (
              <span className="text-orange-500">{availability.message}</span>
            )}
          </div>

          <Link
            href={
              availability.status === "available"
                ? `/checkout?username=${encodeURIComponent(username)}`
                : "/checkout"
            }
            className={`mt-4 block w-full py-3 rounded-xl font-semibold text-white text-center transition ${
              availability.status === "available"
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-gray-300 text-gray-500 cursor-not-allowed pointer-events-none"
            }`}
          >
            {availability.status === "available"
              ? "Get this email address →"
              : "Check availability above to continue"}
          </Link>
        </div>
      </section>

      {/* Pricing */}
      <section className="bg-white py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-2">Simple pricing</h2>
          <p className="text-center text-gray-500 mb-8">
            {formatNaira(PRICE_PER_EMAIL_KOBO)} per email — buy more, save more
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {QUANTITY_OPTIONS.map((opt) => {
              const b = getBundlePrice(opt.qty, "ONE_TIME");
              return (
                <Link
                  key={opt.qty}
                  href="/checkout"
                  className={`rounded-2xl border-2 p-5 text-center flex flex-col gap-1 hover:shadow-md transition ${
                    opt.qty === 5 ? "border-blue-500 shadow-md" : "border-gray-200"
                  }`}
                >
                  {opt.qty === 5 && (
                    <span className="text-xs font-bold text-blue-600 uppercase">Popular</span>
                  )}
                  <div className="text-2xl font-bold text-gray-900">{opt.qty}</div>
                  <div className="text-xs text-gray-400">{opt.qty === 1 ? "email" : "emails"}</div>
                  <div className="text-xl font-bold text-blue-600 mt-1">{formatNaira(b.total)}</div>
                  {b.saved > 0 ? (
                    <div className="text-xs text-green-600">Save {formatNaira(b.saved)}</div>
                  ) : (
                    <div className="text-xs text-gray-400">{formatNaira(b.perEmail)}/email</div>
                  )}
                </Link>
              );
            })}
          </div>
          <div className="bg-blue-50 rounded-2xl p-5 text-center">
            <p className="text-sm text-blue-800">
              ✓ Works on Gmail App, Apple Mail, Outlook &amp; all mail apps &nbsp;·&nbsp;
              ✓ Webmail included &nbsp;·&nbsp; ✓ 10 GB storage per email
            </p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-10">How it works</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { step: "1", title: "Choose a name", desc: "Pick your unique email username" },
              { step: "2", title: "Set your password", desc: "You choose it — only you will know it" },
              { step: "3", title: "Pay securely", desc: "Card, bank transfer or mobile money" },
              { step: "4", title: "Use instantly", desc: "Login on any phone or PC right away" },
            ].map((item) => (
              <div key={item.step} className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 font-bold flex items-center justify-center">
                  {item.step}
                </div>
                <h4 className="font-semibold">{item.title}</h4>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Privacy & Security */}
      <section className="bg-gray-900 text-white py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-2">Your email. 100% yours.</h2>
          <p className="text-gray-400 text-center mb-10 text-sm">
            Every account is completely private and isolated. No one else can access your inbox.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: "🔐",
                title: "You set your own password",
                desc: "You choose your password at checkout. We never store it — only you know it. Nobody else can log into your email.",
              },
              {
                icon: "🚫",
                title: "No shared access",
                desc: "Each email address is a completely isolated private mailbox. Other customers cannot see or access your emails — ever.",
              },
              {
                icon: "✅",
                title: "Username reserved for life",
                desc: "Once you buy john@mailnow.com, no one else can ever register that same address. It belongs only to you.",
              },
            ].map((item) => (
              <div key={item.title} className="bg-gray-800 rounded-2xl p-5">
                <div className="text-2xl mb-3">{item.icon}</div>
                <h3 className="font-semibold mb-2">{item.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
