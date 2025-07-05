import Link from "next/link";
import { redirect } from "next/navigation";
import Image from "next/image";
import { 
  LayoutDashboard, 
  Package, 
  Store, 
  Users, 
  ShoppingCart,
  Mail,
  Settings,
  LogOut,
  Lock
} from "lucide-react";
import { auth } from "@/lib/auth";
import { LogoutButton } from "@/components/admin/logout-button";
import { getTranslations } from "next-intl/server";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const t = await getTranslations("Admin");
  
  if (!session || session.user?.role !== "admin") {
    redirect("/login");
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200">
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="h-16 flex items-center justify-center border-b border-gray-200 bg-white">
            <Image 
              src="/images/logos/logo-operations.png" 
              alt="Luzimarket Operations" 
              width={150} 
              height={40}
              className="h-10 w-auto"
              priority
            />
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            <Link
              href="/admin"
              className="flex items-center gap-3 px-3 py-2 text-sm font-univers text-gray-700 rounded-md hover:bg-gray-100 hover:text-black transition-colors"
            >
              <LayoutDashboard className="h-4 w-4" />
              {t("dashboard")}
            </Link>

            <Link
              href="/admin/orders"
              className="flex items-center gap-3 px-3 py-2 text-sm font-univers text-gray-700 rounded-md hover:bg-gray-100 hover:text-black transition-colors"
            >
              <ShoppingCart className="h-4 w-4" />
              {t("orders")}
            </Link>

            <Link
              href="/admin/products"
              className="flex items-center gap-3 px-3 py-2 text-sm font-univers text-gray-700 rounded-md hover:bg-gray-100 hover:text-black transition-colors"
            >
              <Package className="h-4 w-4" />
              {t("products")}
            </Link>

            <Link
              href="/admin/vendors"
              className="flex items-center gap-3 px-3 py-2 text-sm font-univers text-gray-700 rounded-md hover:bg-gray-100 hover:text-black transition-colors"
            >
              <Store className="h-4 w-4" />
              {t("vendors")}
            </Link>

            <Link
              href="/admin/users"
              className="flex items-center gap-3 px-3 py-2 text-sm font-univers text-gray-700 rounded-md hover:bg-gray-100 hover:text-black transition-colors"
            >
              <Users className="h-4 w-4" />
              {t("users")}
            </Link>

            <Link
              href="/admin/categories"
              className="flex items-center gap-3 px-3 py-2 text-sm font-univers text-gray-700 rounded-md hover:bg-gray-100 hover:text-black transition-colors"
            >
              <Package className="h-4 w-4" />
              {t("categories.title")}
            </Link>

            <Link
              href="/admin/locked-accounts"
              className="flex items-center gap-3 px-3 py-2 text-sm font-univers text-gray-700 rounded-md hover:bg-gray-100 hover:text-black transition-colors"
            >
              <Lock className="h-4 w-4" />
              {t("lockedAccounts.title")}
            </Link>

            <Link
              href="/admin/email-templates"
              className="flex items-center gap-3 px-3 py-2 text-sm font-univers text-gray-700 rounded-md hover:bg-gray-100 hover:text-black transition-colors"
            >
              <Mail className="h-4 w-4" />
              {t("emails")}
            </Link>

            <Link
              href="/admin/settings"
              className="flex items-center gap-3 px-3 py-2 text-sm font-univers text-gray-700 rounded-md hover:bg-gray-100 hover:text-black transition-colors"
            >
              <Settings className="h-4 w-4" />
              {t("settings")}
            </Link>
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-gray-200">
            <LogoutButton />
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {/* Top bar */}
        <div className="h-16 bg-white border-b border-gray-200 px-8 flex items-center justify-between">
          <h2 className="text-lg font-univers">{t("dashboard")}</h2>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 font-univers">{session.user?.email || 'Admin'}</span>
          </div>
        </div>

        {/* Page content */}
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}