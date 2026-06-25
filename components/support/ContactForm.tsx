"use client";

import { useState } from "react";

export default function ContactForm({ defaultEmail }: { defaultEmail?: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = e.currentTarget;
    const data = {
      name: (form.elements.namedItem("name") as HTMLInputElement).value,
      email: (form.elements.namedItem("email") as HTMLInputElement).value,
      subject: (form.elements.namedItem("subject") as HTMLInputElement).value,
      message: (form.elements.namedItem("message") as HTMLTextAreaElement).value,
    };

    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Failed to send. Try again.");
      } else {
        setDone(true);
      }
    } catch {
      setError("Network error. Please try again.");
    }
    setLoading(false);
  }

  if (done) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="font-semibold text-green-800 text-lg mb-1">Message sent!</h3>
        <p className="text-sm text-green-700">
          We received your message and will reply within a few hours.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
          {error}
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Your name</label>
          <input
            type="text"
            name="name"
            required
            maxLength={100}
            className="w-full border-2 border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 text-sm bg-white focus:outline-none focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Your email</label>
          <input
            type="email"
            name="email"
            required
            defaultValue={defaultEmail}
            className="w-full border-2 border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 text-sm bg-white focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
        <input
          type="text"
          name="subject"
          required
          maxLength={200}
          placeholder="e.g. I didn't receive my credentials"
          className="w-full border-2 border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 text-sm bg-white focus:outline-none focus:border-blue-500"
        />
      </div>

      <div className="mb-5">
        <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
        <textarea
          name="message"
          rows={5}
          required
          maxLength={5000}
          placeholder="Describe your issue in detail. Include your transaction ID if this is payment-related."
          className="w-full border-2 border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 text-sm bg-white focus:outline-none focus:border-blue-500 resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        {loading ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
