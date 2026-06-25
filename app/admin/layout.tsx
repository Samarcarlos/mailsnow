import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import AdminNav from "@/components/admin/AdminNav";

export const metadata = { title: "Admin — Mailsnow" };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!session?.user?.id || (session.user as any).role !== "ADMIN") {
    redirect("/login");
  }

  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Sidebar */}
      <aside className="w-56 bg-gray-900 flex-shrink-0 flex flex-col">
        <div className="px-4 py-5 border-b border-gray-800">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-0.5">Admin Panel</p>
          <span className="text-white font-bold text-lg">Mailsnow</span>
        </div>

        <AdminNav />

        <div className="px-4 py-4 border-t border-gray-800 space-y-1">
          <Link href="/dashboard" className="block text-xs text-gray-500 hover:text-gray-300 transition">
            ← Customer dashboard
          </Link>
          <Link href="/api/auth/signout" className="block text-xs text-gray-500 hover:text-red-400 transition">
            Sign out
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto min-h-screen">
        {children}
      </main>
    </div>
  );
}
