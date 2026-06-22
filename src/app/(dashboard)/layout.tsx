import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const permisos = session.user.permisos ?? [];

  return (
    <div className="flex min-h-screen">
      <Sidebar permisos={permisos} />
      <div className="flex flex-1 flex-col">
        <Header
          nombreCompleto={session.user.nombreCompleto}
          permisos={permisos}
        />
        <main className="flex-1 p-4 lg:p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
