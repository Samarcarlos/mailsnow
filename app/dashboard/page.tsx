import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatNaira } from "@/lib/plans";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/dashboard");

  const accounts = await prisma.emailAccount.findMany({
    where: { userId: session.user.id, status: { not: "DELETED" } },
    include: { plan: true },
    orderBy: { createdAt: "desc" },
  });

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
            href="/checkout"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700"
          >
            + Buy another
          </Link>
        </div>

        {accounts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <p className="text-gray-400 mb-4">You haven&apos;t purchased any email accounts yet.</p>
            <Link
              href="/checkout"
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
      </div>
    </div>
  );
}
