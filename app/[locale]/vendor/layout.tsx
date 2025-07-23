import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";
import { routing } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart,
  BarChart3,
  Settings,
  LogOut,
  Store,
  CreditCard,
  DollarSign
} from "lucide-react";

export default async function VendorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const t = await getTranslations("vendor.layout");
  
  // Skip auth check for registration page - will be handled by parallel route
  if (!session || !session.user || session.user.role !== "vendor") {
    // Redirect to Spanish login by default (as es is the default locale)
    redirect(`/${routing.defaultLocale}/iniciar-sesion`);
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200">
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="h-16 flex items-center justify-center border-b border-gray-200">
            <h1 className="text-xl font-univers tracking-wider">{t("title")}</h1>
          </div>

          {/* Vendor info */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                <Store className="h-5 w-5 text-gray-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-univers font-medium text-gray-900">{t("vendorPanel")}</p>
                <p className="text-xs text-gray-600 font-univers">{session.user.email}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            <Link
              href="/vendor/dashboard"
              className="flex items-center gap-3 px-3 py-2 text-sm font-univers text-gray-700 rounded-md hover:bg-gray-100 hover:text-black transition-colors"
            >
              <LayoutDashboard className="h-4 w-4" />
              {t("dashboard")}
            </Link>

            <Link
              href="/vendor/products"
              className="flex items-center gap-3 px-3 py-2 text-sm font-univers text-gray-700 rounded-md hover:bg-gray-100 hover:text-black transition-colors"
            >
              <Package className="h-4 w-4" />
              {t("products")}
            </Link>

            <Link
              href="/vendor/orders"
              className="flex items-center gap-3 px-3 py-2 text-sm font-univers text-gray-700 rounded-md hover:bg-gray-100 hover:text-black transition-colors"
            >
              <ShoppingCart className="h-4 w-4" />
              {t("orders")}
            </Link>

            <Link
              href="/vendor/analytics"
              className="flex items-center gap-3 px-3 py-2 text-sm font-univers text-gray-700 rounded-md hover:bg-gray-100 hover:text-black transition-colors"
            >
              <BarChart3 className="h-4 w-4" />
              {t("analytics")}
            </Link>

            <Link
              href="/vendor/financials"
              className="flex items-center gap-3 px-3 py-2 text-sm font-univers text-gray-700 rounded-md hover:bg-gray-100 hover:text-black transition-colors"
            >
              <DollarSign className="h-4 w-4" />
              {t("financials")}
            </Link>

            <Link
              href="/vendor/stripe-onboarding"
              className="flex items-center gap-3 px-3 py-2 text-sm font-univers text-gray-700 rounded-md hover:bg-gray-100 hover:text-black transition-colors"
            >
              <CreditCard className="h-4 w-4" />
              {t("payments")}
            </Link>

            <Link
              href="/vendor/settings"
              className="flex items-center gap-3 px-3 py-2 text-sm font-univers text-gray-700 rounded-md hover:bg-gray-100 hover:text-black transition-colors"
            >
              <Settings className="h-4 w-4" />
              {t("settings")}
            </Link>
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-gray-200">
            <form action={async () => {
              "use server";
              await signOut();
            }}>
              <button className="flex items-center gap-3 px-3 py-2 w-full text-sm font-univers text-red-600 rounded-md hover:bg-red-50 transition-colors">
                <LogOut className="h-4 w-4" />
                {t("logout")}
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {/* Top bar */}
        <div className="h-16 bg-white border-b border-gray-200 px-8 flex items-center justify-between">
          <h2 className="text-lg font-univers">{t("vendorPanel")}</h2>
        </div>

        {/* Page content */}
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}