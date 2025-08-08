import { redirect } from "@/i18n/navigation";
import { auth } from "@/lib/auth";
import { getTranslations } from "next-intl/server";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { VendorSidebar } from "./vendor-sidebar";
import { db } from "@/db";
import { vendors } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function VendorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const t = await getTranslations("vendor.layout");

  // Skip auth check for registration page - will be handled by parallel route
  if (!session || !session.user || session.user.role !== "vendor") {
    // Locale-aware redirect to login
    redirect({ href: "/login", locale: 'es' });
  }

  // Get vendor details
  let vendorName = "";
  if (session!.user?.email) {
    const vendor = await db.query.vendors.findFirst({
      where: eq(vendors.email, session!.user!.email!),
      columns: {
        businessName: true,
      },
    });
    vendorName = vendor?.businessName || "";
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <VendorSidebar
          userEmail={session!.user!.email!}
          vendorName={vendorName}
        />
        <SidebarInset className="flex-1">
          <header className="flex h-16 items-center justify-between border-b bg-white px-6">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <h2 className="text-lg font-univers">{t("vendorPanel")}</h2>
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