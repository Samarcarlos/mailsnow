import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatNaira } from "@/lib/plans";

function formatDate(d: Date) {
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default async function AdminOverviewPage() {
  const session = await auth();

  const [
    totalUsers,
    totalOrders,
    completedOrders,
    openTickets,
    recentUsers,
    recentOrders,
    revenue,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.order.count(),
    prisma.order.count({ where: { status: "COMPLETED" } }),
    prisma.supportTicket.count({ where: { status: { not: "RESOLVED" } } }),
    prisma.user.findMany({ orderBy: { createdAt: "desc" }, take: 5, select: { id: true, name: true, email: true, createdAt: true, role: true } }),
    prisma.order.findMany({
      where: { status: "COMPLETED" },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { user: { select: { email: true } } },
    }),
    prisma.order.aggregate({
      where: { status: "COMPLETED" },
      _sum: { amountKobo: true },
    }),
  ]);

  const totalRevenueKobo = revenue._sum.amountKobo ?? 0;
  const domain = process.env.NEXT_PUBLIC_MAIL_DOMAIN ?? "mailsnow.live";

  return (
    <div className="p-8">
      <div className="mb-8">
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Welcome back</p>
        <h1 className="text-2xl font-bold text-gray-900">{(session?.user as any)?.name ?? "Admin"}</h1>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <StatCard label="Total users" value={totalUsers.toLocaleString()} color="blue" icon="👤" />
        <StatCard label="Completed orders" value={completedOrders.toLocaleString()} color="green" icon="✅" />
        <StatCard label="Total revenue" value={formatNaira(totalRevenueKobo)} color="purple" icon="💰" />
        <StatCard label="Open tickets" value={openTickets.toLocaleString()} color={openTickets > 0 ? "red" : "gray"} icon="🎫" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent signups */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Recent signups</h2>
            <a href="/admin/users" className="text-xs text-blue-600 hover:underline">View all</a>
          </div>
          <div className="divide-y divide-gray-50">
            {recentUsers.map((u) => (
              <div key={u.id} className="px-5 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{u.name ?? u.email}</p>
                  <p className="text-xs text-gray-400 truncate">{u.email}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-gray-400">{formatDate(u.createdAt)}</p>
                  {u.role === "ADMIN" && (
                    <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-medium">Admin</span>
                  )}
                </div>
              </div>
            ))}
            {recentUsers.length === 0 && (
              <p className="px-5 py-8 text-sm text-gray-400 text-center">No users yet.</p>
            )}
          </div>
        </div>

        {/* Recent orders */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Recent purchases</h2>
            <a href="/admin/orders" className="text-xs text-blue-600 hover:underline">View all</a>
          </div>
          <div className="divide-y divide-gray-50">
            {recentOrders.map((o) => (
              <div key={o.id} className="px-5 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-mono text-gray-900 truncate">
                    {o.desiredUsername}@{domain}
                  </p>
                  <p className="text-xs text-gray-400 truncate">{o.user.email}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-green-700">{formatNaira(o.amountKobo)}</p>
                  <p className="text-xs text-gray-400">{formatDate(o.createdAt)}</p>
                </div>
              </div>
            ))}
            {recentOrders.length === 0 && (
              <p className="px-5 py-8 text-sm text-gray-400 text-center">No orders yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: string;
  color: "blue" | "green" | "purple" | "red" | "gray";
  icon: string;
}) {
  const bg: Record<string, string> = {
    blue: "bg-blue-50 text-blue-700",
    green: "bg-green-50 text-green-700",
    purple: "bg-purple-50 text-purple-700",
    red: "bg-red-50 text-red-700",
    gray: "bg-gray-50 text-gray-600",
  };
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      <div className={`inline-flex items-center justify-center w-9 h-9 rounded-xl text-lg mb-3 ${bg[color]}`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}
