import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import AdminNav from "@/components/admin/AdminNav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    redirect("/login?redirect=/admin");
  }

  return (
    <div className="min-h-[calc(100vh-56px)] flex flex-col lg:flex-row" style={{ background: "#060b14" }}>
      <AdminNav />
      <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
