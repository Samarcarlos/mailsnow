import Link from "next/link";
import Footer from "@/components/layout/Footer";
import ContactForm from "@/components/support/ContactForm";
import { auth } from "@/auth";

const SUPPORT_EMAIL = "support@mailsnow.live";

const commonIssues = [
  {
    q: "I paid but my email was never created.",
    a: 'Go to Dashboard → "Recover your purchase" and enter the transaction ID from your Flutterwave receipt email. Your account will be set up instantly.',
  },
  {
    q: "I forgot my email password.",
    a: "We cannot retrieve your password — it was set by you and is not stored on our servers. Contact support to have it reset to a new one.",
  },
  {
    q: "The Gmail / Outlook app says 'Couldn't open connection to server'.",
    a: "Try using the server hostname shown in your Setup guide on the dashboard. If that doesn't work, use webmail at webmail.mailsnow.live in your browser — it always works without extra setup.",
  },
  {
    q: "Webmail is not loading or showing an error.",
    a: "Try opening webmail.mailsnow.live in a private/incognito browser window. If it still fails, contact support with the error message.",
  },
  {
    q: "My payment was deducted but I see a blank page.",
    a: "This happens when there is a network issue during the payment redirect. Use the Recover purchase page with your Flutterwave transaction ID — your email will be set up immediately.",
  },
];

export default async function SupportPage() {
  const session = await auth();
  const userEmail = session?.user?.email ?? undefined;
  const webmailUrl = process.env.NEXT_PUBLIC_WEBMAIL_URL ?? "https://webmail.mailsnow.live";

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Nav */}
      <nav className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-blue-600">Mailsnow</Link>
          <div className="flex gap-4 text-sm items-center">
            <Link href="/faq" className="text-gray-500 hover:text-gray-900 hidden md:block">FAQ</Link>
            {session ? (
              <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">Dashboard</Link>
            ) : (
              <Link href="/login" className="text-gray-600 hover:text-gray-900">Sign in</Link>
            )}
          </div>
        </div>
      </nav>

      <main className="flex-1 px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">How can we help you?</h1>
          <p className="text-gray-500 mb-10">
            Find quick answers below or send us a message and we&apos;ll reply within a few hours.
          </p>

          {/* Self-service cards */}
          <div className="grid sm:grid-cols-3 gap-4 mb-12">
            <Link
              href="/faq"
              className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-md transition"
            >
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">FAQ</h3>
              <p className="text-sm text-gray-500">Answers to the most common questions.</p>
            </Link>

            <Link
              href="/dashboard/recover"
              className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-md transition"
            >
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Recover purchase</h3>
              <p className="text-sm text-gray-500">Paid but missing credentials? Get them now.</p>
            </Link>

            <a
              href={webmailUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-md transition"
            >
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Open webmail</h3>
              <p className="text-sm text-gray-500">Access your inbox right in the browser.</p>
            </a>
          </div>

          {/* Contact form */}
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden mb-6">
            <div className="px-6 pt-6 pb-4 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-0.5">Send us a message</h2>
              <p className="text-gray-500 text-sm">
                We typically reply within a few hours. Or email us directly at{" "}
                <a href={`mailto:${SUPPORT_EMAIL}`} className="text-blue-600 hover:underline">
                  {SUPPORT_EMAIL}
                </a>
              </p>
            </div>
            <div className="p-6">
              <ContactForm defaultEmail={userEmail} />
            </div>
          </div>

          {/* Common issues */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h2 className="font-bold text-gray-900 mb-5">Common issues &amp; fixes</h2>
            <div className="space-y-5">
              {commonIssues.map((issue) => (
                <div key={issue.q} className="border-b border-gray-100 pb-5 last:border-0 last:pb-0">
                  <p className="text-sm font-semibold text-gray-800 mb-1">{issue.q}</p>
                  <p className="text-sm text-gray-500 leading-relaxed">{issue.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
