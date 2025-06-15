import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Package, Heart, MapPin, CreditCard } from "lucide-react";

export default async function AccountPage() {
  const session = await getServerSession(authOptions);

  const quickActions = [
    {
      title: "Mis pedidos",
      description: "Ver historial de compras",
      icon: Package,
      href: "/account/orders",
      color: "text-blue-600",
    },
    {
      title: "Favoritos",
      description: "Productos guardados",
      icon: Heart,
      href: "/account/wishlist",
      color: "text-red-600",
    },
    {
      title: "Direcciones",
      description: "Gestionar direcciones de envío",
      icon: MapPin,
      href: "/account/addresses",
      color: "text-green-600",
    },
    {
      title: "Métodos de pago",
      description: "Tarjetas guardadas",
      icon: CreditCard,
      href: "/account/payment-methods",
      color: "text-purple-600",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-times-now mb-2">
          Hola, {session?.user.name}
        </h1>
        <p className="text-gray-600 font-univers">
          Bienvenido a tu cuenta de Luzimarket
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {quickActions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-lg bg-gray-50 ${action.color}`}>
                <action.icon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-univers font-medium mb-1">{action.title}</h3>
                <p className="text-sm text-gray-600 font-univers">
                  {action.description}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-univers mb-4">Información personal</h2>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-600 font-univers">Nombre</label>
            <p className="font-univers">{session?.user.name}</p>
          </div>
          <div>
            <label className="text-sm text-gray-600 font-univers">Email</label>
            <p className="font-univers">{session?.user.email}</p>
          </div>
          <div className="pt-4">
            <Button variant="outline" asChild>
              <Link href="/account/edit">Editar información</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}