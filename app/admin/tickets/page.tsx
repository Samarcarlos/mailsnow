import { prisma } from "@/lib/prisma";
import TicketStatusSelect from "@/components/admin/TicketStatusSelect";

function formatDate(d: Date) {
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

const BADGE: Record<string, string> = {
  OPEN: "bg-red-100 text-red-700",
  IN_PROGRESS: "bg-amber-100 text-amber-700",
  RESOLVED: "bg-green-100 text-green-700",
};
const LABEL: Record<string, string> = {
  OPEN: "Open",
  IN_PROGRESS: "In Progress",
  RESOLVED: "Resolved",
};

export default async function AdminTicketsPage() {
  const tickets = await prisma.supportTicket.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: { select: { email: true } } },
  });

  const open = tickets.filter((t) => t.status === "OPEN").length;
  const inProgress = tickets.filter((t) => t.status === "IN_PROGRESS").length;
  const resolved = tickets.filter((t) => t.status === "RESOLVED").length;

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Support Tickets</h1>
        <p className="text-sm text-gray-500 mt-1">
          {tickets.length} total · {open} open · {inProgress} in progress · {resolved} resolved
        </p>
      </div>

      {tickets.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <p className="text-gray-400">No support tickets yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => (
            <div
              key={ticket.id}
              className={`bg-white rounded-2xl border p-5 ${
                ticket.status === "RESOLVED" ? "border-gray-100 opacity-75" : "border-gray-200"
              }`}
            >
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${BADGE[ticket.status]}`}>
                      {LABEL[ticket.status]}
                    </span>
                    <span className="text-xs text-gray-400">{formatDate(ticket.createdAt)}</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-0.5">{ticket.subject}</h3>
                  <p className="text-xs text-gray-500 mb-3">
                    From: <span className="font-medium text-gray-700">{ticket.name}</span>{" "}
                    &lt;{ticket.email}&gt;
                    {ticket.user && (
                      <span className="text-blue-600"> · registered user</span>
                    )}
                  </p>
                  <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                    {ticket.message}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <TicketStatusSelect ticketId={ticket.id} currentStatus={ticket.status} />
                  <a
                    href={`mailto:${ticket.email}?subject=Re: ${encodeURIComponent(ticket.subject)}`}
                    className="text-xs text-blue-600 hover:underline whitespace-nowrap"
                  >
                    Reply by email →
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
