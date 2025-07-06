"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Truck, Store, CreditCard, Bell, Shield, ChevronRight } from "lucide-react";

const settingsSections = [
  {
    title: "Configuración de Envíos",
    description: "Administra tarifas, zonas y métodos de envío",
    icon: Truck,
    href: "/vendor/settings/shipping",
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  {
    title: "Información de la Tienda",
    description: "Actualiza el perfil y datos de tu negocio",
    icon: Store,
    href: "/vendor/settings/store",
    color: "text-green-600",
    bgColor: "bg-green-50",
  },
  {
    title: "Métodos de Pago",
    description: "Configura cómo recibes tus pagos",
    icon: CreditCard,
    href: "/vendor/settings/payments",
    color: "text-purple-600",
    bgColor: "bg-purple-50",
  },
  {
    title: "Notificaciones",
    description: "Controla qué alertas y correos recibes",
    icon: Bell,
    href: "/vendor/settings/notifications",
    color: "text-yellow-600",
    bgColor: "bg-yellow-50",
  },
  {
    title: "Seguridad",
    description: "Cambia tu contraseña y configuración de acceso",
    icon: Shield,
    href: "/vendor/settings/security",
    color: "text-red-600",
    bgColor: "bg-red-50",
  },
];

export default function VendorSettingsPage() {
  const { data: session } = useSession();
  const router = useRouter();

  if (!session?.user?.vendor) {
    router.push("/vendor/login");
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-times-now mb-2">Configuración</h1>
        <p className="text-gray-600 font-univers">
          Administra todos los aspectos de tu tienda
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {settingsSections.map((section) => {
          const Icon = section.icon;
          
          return (
            <Link key={section.href} href={section.href}>
              <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className={`p-3 rounded-lg ${section.bgColor}`}>
                      <Icon className={`h-6 w-6 ${section.color}`} />
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </div>
                  <CardTitle className="mt-4">{section.title}</CardTitle>
                  <CardDescription>{section.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Vendor Info */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Información de la Cuenta</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="space-y-2">
            <div className="flex justify-between">
              <dt className="text-sm font-univers text-gray-600">Nombre del negocio:</dt>
              <dd className="text-sm font-medium">{session?.user?.vendor?.businessName || 'No configurado'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm font-univers text-gray-600">Email:</dt>
              <dd className="text-sm font-medium">{session?.user?.email}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm font-univers text-gray-600">Estado de la cuenta:</dt>
              <dd className="text-sm font-medium">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Activa
                </span>
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}