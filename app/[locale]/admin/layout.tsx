import { redirect } from "@/i18n/navigation";
import { auth } from "@/lib/auth";
import { getTranslations } from "next-intl/server";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AdminSidebar } from "./admin-sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const t = await getTranslations("Admin");

  if (!session || session.user?.role !== "admin") {
    // Locale-aware redirect to login preserving current locale
    redirect({ href: "/login", locale: 'es' });
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <AdminSidebar userEmail={session!.user?.email || 'Admin'} />
        <SidebarInset className="flex-1">
          <header className="flex h-16 items-center justify-between border-b bg-white px-6">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <h2 className="text-lg font-univers">{t("dashboard")}</h2>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto bg-gray-50 p-8">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}