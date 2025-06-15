import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { 
  LayoutDashboard, 
  Package, 
  ShoppingBag, 
  BarChart3,
  Settings,
  LogOut,
  Heart
} from "lucide-react";

// TODO: Add proper vendor auth check
async function checkVendorAuth() {
  // For now, return true. In production, check session/JWT
  return true;
}

export default async function VendorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isAuthenticated = await checkVendorAuth();
  
  if (!isAuthenticated) {
    redirect("/vendor/login");
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200">
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="h-16 flex items-center justify-center border-b border-gray-200">
            <Image 
              src="/images/logos/logo-family.png" 
              alt="Luzimarket Family" 
              width={150} 
              height={40}
              className="h-10 w-auto"
              priority
            />
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            <Link
              href="/vendor/dashboard"
              className="flex items-center gap-3 px-3 py-2 text-sm font-univers text-gray-700 rounded-md hover:bg-gray-100 hover:text-black transition-colors"
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Link>

            <Link
              href="/vendor/products"
              className="flex items-center gap-3 px-3 py-2 text-sm font-univers text-gray-700 rounded-md hover:bg-gray-100 hover:text-black transition-colors"
            >
              <Package className="h-4 w-4" />
              Mis Productos
            </Link>

            <Link
              href="/vendor/orders"
              className="flex items-center gap-3 px-3 py-2 text-sm font-univers text-gray-700 rounded-md hover:bg-gray-100 hover:text-black transition-colors"
            >
              <ShoppingBag className="h-4 w-4" />
              Órdenes
            </Link>

            <Link
              href="/vendor/analytics"
              className="flex items-center gap-3 px-3 py-2 text-sm font-univers text-gray-700 rounded-md hover:bg-gray-100 hover:text-black transition-colors"
            >
              <BarChart3 className="h-4 w-4" />
              Analíticas
            </Link>

            <Link
              href="/vendor/favorites"
              className="flex items-center gap-3 px-3 py-2 text-sm font-univers text-gray-700 rounded-md hover:bg-gray-100 hover:text-black transition-colors"
            >
              <Heart className="h-4 w-4" />
              Favoritos
            </Link>

            <Link
              href="/vendor/settings"
              className="flex items-center gap-3 px-3 py-2 text-sm font-univers text-gray-700 rounded-md hover:bg-gray-100 hover:text-black transition-colors"
            >
              <Settings className="h-4 w-4" />
              Configuración
            </Link>
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-gray-200">
            <button className="flex items-center gap-3 px-3 py-2 w-full text-sm font-univers text-red-600 rounded-md hover:bg-red-50 transition-colors">
              <LogOut className="h-4 w-4" />
              Cerrar sesión
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {/* Top bar */}
        <div className="h-16 bg-white border-b border-gray-200 px-8 flex items-center justify-between">
          <h2 className="text-lg font-univers">Portal de Vendedor</h2>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 font-univers">Mi Tienda</span>
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