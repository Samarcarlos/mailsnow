import { prisma } from "@/lib/prisma";

function formatDate(d: Date) {
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { emailAccounts: true, orders: true } },
    },
  });

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <p className="text-sm text-gray-500 mt-1">{users.length} registered account{users.length !== 1 ? "s" : ""}</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {/* Desktop */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wide">
                <th className="text-left px-5 py-3 font-medium">User</th>
                <th className="text-left px-5 py-3 font-medium">Joined</th>
                <th className="text-left px-5 py-3 font-medium">Email accounts</th>
                <th className="text-left px-5 py-3 font-medium">Orders</th>
                <th className="text-left px-5 py-3 font-medium">Auth</th>
                <th className="text-left px-5 py-3 font-medium">Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-gray-900 truncate max-w-xs">{user.name ?? "—"}</p>
                    <p className="text-xs text-gray-400">{user.email}</p>
                  </td>
                  <td className="px-5 py-3.5 text-gray-500 whitespace-nowrap">
                    {formatDate(user.createdAt)}
                  </td>
                  <td className="px-5 py-3.5 text-gray-900 font-medium">
                    {user._count.emailAccounts}
                  </td>
                  <td className="px-5 py-3.5 text-gray-900 font-medium">
                    {user._count.orders}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      user.passwordHash
                        ? "bg-gray-100 text-gray-600"
                        : "bg-blue-100 text-blue-700"
                    }`}>
                      {user.passwordHash ? "Password" : "Google"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      user.role === "ADMIN"
                        ? "bg-purple-100 text-purple-700"
                        : "bg-gray-100 text-gray-600"
                    }`}>
                      {user.role}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile */}
        <div className="md:hidden divide-y divide-gray-100">
          {users.map((user) => (
            <div key={user.id} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 truncate">{user.name ?? user.email}</p>
                  <p className="text-xs text-gray-400 truncate">{user.email}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
                  user.role === "ADMIN" ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-600"
                }`}>
                  {user.role}
                </span>
              </div>
              <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                <span>{formatDate(user.createdAt)}</span>
                <span>· {user._count.emailAccounts} email{user._count.emailAccounts !== 1 ? "s" : ""}</span>
                <span>· {user._count.orders} order{user._count.orders !== 1 ? "s" : ""}</span>
              </div>
            </div>
          ))}
        </div>

        {users.length === 0 && (
          <p className="px-5 py-12 text-center text-sm text-gray-400">No users yet.</p>
        )}
      </div>
    </div>
  );
}
