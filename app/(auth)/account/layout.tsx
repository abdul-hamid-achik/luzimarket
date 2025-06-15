import Link from "next/link";
import { redirect } from "next/navigation";
import { 
  Package, 
  Heart, 
  User, 
  MapPin, 
  CreditCard,
  LogOut
} from "lucide-react";
import { auth } from "@/lib/auth";

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  
  if (!session || !session.user || session.user.role !== "customer") {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="lg:w-64">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="mb-6">
                <h2 className="text-xl font-times-now mb-1">{session.user?.name}</h2>
                <p className="text-sm text-gray-600 font-univers">{session.user?.email}</p>
              </div>
              
              <nav className="space-y-1">
                <Link
                  href="/account"
                  className="flex items-center gap-3 px-3 py-2 text-sm font-univers rounded-md hover:bg-gray-100 transition-colors"
                >
                  <User className="h-4 w-4" />
                  Mi cuenta
                </Link>
                
                <Link
                  href="/account/orders"
                  className="flex items-center gap-3 px-3 py-2 text-sm font-univers rounded-md hover:bg-gray-100 transition-colors"
                >
                  <Package className="h-4 w-4" />
                  Mis pedidos
                </Link>
                
                <Link
                  href="/account/wishlist"
                  className="flex items-center gap-3 px-3 py-2 text-sm font-univers rounded-md hover:bg-gray-100 transition-colors"
                >
                  <Heart className="h-4 w-4" />
                  Favoritos
                </Link>
                
                <Link
                  href="/account/addresses"
                  className="flex items-center gap-3 px-3 py-2 text-sm font-univers rounded-md hover:bg-gray-100 transition-colors"
                >
                  <MapPin className="h-4 w-4" />
                  Direcciones
                </Link>
                
                <Link
                  href="/account/payment-methods"
                  className="flex items-center gap-3 px-3 py-2 text-sm font-univers rounded-md hover:bg-gray-100 transition-colors"
                >
                  <CreditCard className="h-4 w-4" />
                  Métodos de pago
                </Link>
                
                <hr className="my-4" />
                
                <button className="flex items-center gap-3 px-3 py-2 w-full text-sm font-univers text-red-600 rounded-md hover:bg-red-50 transition-colors">
                  <LogOut className="h-4 w-4" />
                  Cerrar sesión
                </button>
              </nav>
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}