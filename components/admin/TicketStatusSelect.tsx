"use client";

import { useState } from "react";

const OPTIONS = [
  { value: "OPEN", label: "Open", style: "bg-red-100 text-red-700" },
  { value: "IN_PROGRESS", label: "In Progress", style: "bg-amber-100 text-amber-700" },
  { value: "RESOLVED", label: "Resolved", style: "bg-green-100 text-green-700" },
];

export default function TicketStatusSelect({
  ticketId,
  currentStatus,
}: {
  ticketId: string;
  currentStatus: string;
}) {
  const [status, setStatus] = useState(currentStatus);
  const [saving, setSaving] = useState(false);

  async function handleChange(newStatus: string) {
    setSaving(true);
    await fetch(`/api/admin/tickets/${ticketId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setStatus(newStatus);
    setSaving(false);
  }

  const current = OPTIONS.find((o) => o.value === status);

  return (
    <select
      value={status}
      disabled={saving}
      onChange={(e) => handleChange(e.target.value)}
      className={`text-xs font-medium px-2 py-1 rounded-full border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400 ${current?.style ?? "bg-gray-100 text-gray-600"} ${saving ? "opacity-50" : ""}`}
    >
      {OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
