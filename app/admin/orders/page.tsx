import { prisma } from "@/lib/prisma";
import { formatNaira } from "@/lib/plans";
import ProvisionButton from "./ProvisionButton";

function formatDate(d: Date) {
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

const STATUS_STYLES: Record<string, string> = {
  COMPLETED: "bg-green-100 text-green-700",
  PENDING: "bg-amber-100 text-amber-700",
  FAILED: "bg-red-100 text-red-700",
};

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: { select: { email: true, name: true } } },
  });

  const completedOrders = orders.filter((o) => o.status === "COMPLETED");
  const totalRevenue = completedOrders.reduce((sum, o) => sum + o.amountKobo, 0);
  const domain = process.env.NEXT_PUBLIC_MAIL_DOMAIN ?? "mailsnow.live";

  return (
    <div className="p-8">
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-sm text-gray-500 mt-1">
            {orders.length} total · {completedOrders.length} completed · {formatNaira(totalRevenue)} revenue
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {/* Desktop */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wide">
                <th className="text-left px-5 py-3 font-medium">Date</th>
                <th className="text-left px-5 py-3 font-medium">Buyer</th>
                <th className="text-left px-5 py-3 font-medium">Email purchased</th>
                <th className="text-left px-5 py-3 font-medium">Amount</th>
                <th className="text-left px-5 py-3 font-medium">Type</th>
                <th className="text-left px-5 py-3 font-medium">Status</th>
                <th className="text-left px-5 py-3 font-medium">Transaction ID</th>
                <th className="text-left px-5 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                  <td className="px-5 py-3.5 text-gray-500 whitespace-nowrap">
                    {formatDate(order.createdAt)}
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="text-gray-900 font-medium truncate max-w-[160px]">
                      {order.user.name ?? order.user.email}
                    </p>
                    <p className="text-xs text-gray-400 truncate max-w-[160px]">{order.user.email}</p>
                  </td>
                  <td className="px-5 py-3.5 font-mono text-gray-900 whitespace-nowrap">
                    {order.desiredUsername}@{domain}
                  </td>
                  <td className="px-5 py-3.5 font-semibold text-gray-900 whitespace-nowrap">
                    {formatNaira(order.amountKobo)}
                  </td>
                  <td className="px-5 py-3.5 text-gray-500">
                    {order.billingType === "ONE_TIME" ? "One-time" : "Monthly"}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[order.status] ?? "bg-gray-100 text-gray-600"}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 font-mono text-xs text-gray-400">
                    {order.flwTransactionId ?? "—"}
                  </td>
                  <td className="px-5 py-3.5">
                    {order.status === "PENDING" && (
                      <ProvisionButton orderId={order.id} />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile */}
        <div className="md:hidden divide-y divide-gray-100">
          {orders.map((order) => (
            <div key={order.id} className="p-4">
              <div className="flex items-start justify-between gap-2 mb-1">
                <p className="font-mono text-sm text-gray-900">{order.desiredUsername}@{domain}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${STATUS_STYLES[order.status] ?? "bg-gray-100 text-gray-600"}`}>
                  {order.status}
                </span>
              </div>
              <p className="text-xs text-gray-400 mb-1">{order.user.email}</p>
              <div className="flex items-center gap-3 text-xs text-gray-400">
                <span>{formatDate(order.createdAt)}</span>
                <span>·</span>
                <span className="font-semibold text-gray-700">{formatNaira(order.amountKobo)}</span>
                <span>·</span>
                <span>{order.billingType === "ONE_TIME" ? "One-time" : "Monthly"}</span>
              </div>
              {order.status === "PENDING" && (
                <div className="mt-2">
                  <ProvisionButton orderId={order.id} />
                </div>
              )}
            </div>
          ))}
        </div>

        {orders.length === 0 && (
          <p className="px-5 py-12 text-center text-sm text-gray-400">No orders yet.</p>
        )}
      </div>
    </div>
  );
}
