import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatNaira } from "@/lib/plans";
import GetCredentialsButton from "./GetCredentialsButton";

const DOMAIN = process.env.NEXT_PUBLIC_MAIL_DOMAIN ?? "mailsnow.live";

function formatDate(d: Date) {
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/dashboard");

  const [accounts, orders] = await Promise.all([
    prisma.emailAccount.findMany({
      where: { userId: session.user.id, status: { not: "DELETED" } },
      include: { plan: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.order.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const webmailUrl = process.env.NEXT_PUBLIC_WEBMAIL_URL ?? "#";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <nav className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-blue-600">Mailsnow</Link>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-gray-500">{session.user.email}</span>
            <Link href="/dashboard/security" className="text-gray-500 hover:text-gray-900">Security</Link>
            <Link href="/api/auth/signout" className="text-gray-500 hover:text-gray-900">Sign out</Link>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My email accounts</h1>
            <p className="text-gray-500 text-sm mt-1">
              {accounts.length} account{accounts.length !== 1 ? "s" : ""}
            </p>
          </div>
          <Link
            href="/buy"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700"
          >
            + Buy another
          </Link>
        </div>

        {accounts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <p className="text-gray-400 mb-4">You haven&apos;t purchased any email accounts yet.</p>
            <Link
              href="/buy"
              className="inline-block bg-blue-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-blue-700"
            >
              Get your email address
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {accounts.map((account) => (
              <div
                key={account.id}
                className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col md:flex-row md:items-center gap-4"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono font-semibold text-gray-900">{account.emailAddress}</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        account.status === "ACTIVE"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {account.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400">
                    {account.plan.name} · {account.plan.storageGb} GB ·{" "}
                    {formatNaira(account.plan.oneTimePriceKobo)} one-time
                  </p>
                </div>
                <div className="flex gap-2">
                  <a
                    href={webmailUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-50"
                  >
                    Open webmail
                  </a>
                  <Link
                    href={`/dashboard/accounts/${account.id}`}
                    className="text-sm bg-blue-50 text-blue-600 border border-blue-200 rounded-lg px-3 py-2 hover:bg-blue-100"
                  >
                    Setup guide
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Transaction history */}
        <div className="mt-10">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Transaction history</h2>

          {orders.length === 0 ? (
            <p className="text-sm text-gray-400">No transactions yet.</p>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wide">
                      <th className="text-left px-5 py-3 font-medium">Date</th>
                      <th className="text-left px-5 py-3 font-medium">Email</th>
                      <th className="text-left px-5 py-3 font-medium">Amount</th>
                      <th className="text-left px-5 py-3 font-medium">Type</th>
                      <th className="text-left px-5 py-3 font-medium">Status</th>
                      <th className="text-left px-5 py-3 font-medium">Transaction ID</th>
                      <th className="text-left px-5 py-3 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                        <td className="px-5 py-3.5 text-gray-500 whitespace-nowrap">
                          {formatDate(order.createdAt)}
                        </td>
                        <td className="px-5 py-3.5 font-mono text-gray-900">
                          {order.desiredUsername}@{DOMAIN}
                        </td>
                        <td className="px-5 py-3.5 text-gray-900 whitespace-nowrap">
                          {formatNaira(order.amountKobo)}
                        </td>
                        <td className="px-5 py-3.5 text-gray-500">
                          {order.billingType === "ONE_TIME" ? "One-time" : "Monthly"}
                        </td>
                        <td className="px-5 py-3.5">
                          <StatusBadge status={order.status} />
                        </td>
                        <td className="px-5 py-3.5 font-mono text-xs text-gray-400">
                          {order.flwTransactionId ?? "—"}
                        </td>
                        <td className="px-5 py-3.5">
                          {order.status === "PENDING" && (
                            <GetCredentialsButton orderId={order.id} />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden divide-y divide-gray-100">
                {orders.map((order) => (
                  <div key={order.id} className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="font-mono text-sm text-gray-900 truncate">
                        {order.desiredUsername}@{DOMAIN}
                      </span>
                      <StatusBadge status={order.status} />
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span>{formatDate(order.createdAt)}</span>
                      <span>·</span>
                      <span className="font-medium text-gray-700">{formatNaira(order.amountKobo)}</span>
                      <span>·</span>
                      <span>{order.billingType === "ONE_TIME" ? "One-time" : "Monthly"}</span>
                    </div>
                    {order.status === "PENDING" && (
                      <GetCredentialsButton orderId={order.id} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Recover purchase */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-400">
            Paid but didn&apos;t receive your credentials?{" "}
            <Link href="/dashboard/recover" className="text-blue-600 hover:underline">
              Recover your purchase
            </Link>
            {" · "}
            <Link href="/support" className="text-blue-600 hover:underline">
              Contact support
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    COMPLETED: "bg-green-100 text-green-700",
    PENDING: "bg-amber-100 text-amber-700",
    FAILED: "bg-red-100 text-red-700",
  };
  const labels: Record<string, string> = {
    COMPLETED: "Completed",
    PENDING: "Pending",
    FAILED: "Failed",
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${styles[status] ?? "bg-gray-100 text-gray-600"}`}>
      {labels[status] ?? status}
    </span>
  );
}
