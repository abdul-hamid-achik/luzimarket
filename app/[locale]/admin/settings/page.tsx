import { Settings, Store, CreditCard, Mail, Truck, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export default function AdminSettingsPage() {
  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-univers text-gray-900">Configuración</h1>
        <p className="text-sm text-gray-600 font-univers mt-1">
          Administra la configuración general de la plataforma
        </p>
      </div>

      {/* Settings sections */}
      <div className="space-y-6">
        {/* General settings */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <Store className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-univers text-gray-900">Configuración General</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="site-name">Nombre del sitio</Label>
              <Input id="site-name" defaultValue="Luzimarket" className="mt-1" />
            </div>
            
            <div>
              <Label htmlFor="admin-email">Email de administrador</Label>
              <Input id="admin-email" type="email" defaultValue="admin@luzimarket.shop" className="mt-1" />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-univers font-medium text-gray-900">Modo mantenimiento</p>
                <p className="text-xs text-gray-600 font-univers">Mostrar página de mantenimiento a los usuarios</p>
              </div>
              <Switch />
            </div>
          </div>
        </div>

        {/* Payment settings */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <CreditCard className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-univers text-gray-900">Configuración de Pagos</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="stripe-key">Stripe Public Key</Label>
              <Input id="stripe-key" defaultValue="pk_test_..." className="mt-1" />
            </div>
            
            <div>
              <Label htmlFor="commission">Comisión de la plataforma (%)</Label>
              <Input id="commission" type="number" defaultValue="15" className="mt-1" />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-univers font-medium text-gray-900">Pagos en prueba</p>
                <p className="text-xs text-gray-600 font-univers">Usar modo de prueba de Stripe</p>
              </div>
              <Switch defaultChecked />
            </div>
          </div>
        </div>

        {/* Email settings */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <Mail className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-univers text-gray-900">Configuración de Email</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="from-email">Email remitente</Label>
              <Input id="from-email" type="email" defaultValue="noreply@luzimarket.shop" className="mt-1" />
            </div>
            
            <div>
              <Label htmlFor="from-name">Nombre remitente</Label>
              <Input id="from-name" defaultValue="Luzimarket" className="mt-1" />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-univers font-medium text-gray-900">Notificaciones de pedidos</p>
                <p className="text-xs text-gray-600 font-univers">Enviar email al admin cuando hay nuevos pedidos</p>
              </div>
              <Switch defaultChecked />
            </div>
          </div>
        </div>

        {/* Shipping settings */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <Truck className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-univers text-gray-900">Configuración de Envío</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="default-shipping">Costo de envío predeterminado</Label>
              <Input id="default-shipping" type="number" defaultValue="99" className="mt-1" />
            </div>
            
            <div>
              <Label htmlFor="free-shipping">Envío gratis a partir de</Label>
              <Input id="free-shipping" type="number" defaultValue="599" className="mt-1" />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-univers font-medium text-gray-900">Cálculo automático</p>
                <p className="text-xs text-gray-600 font-univers">Calcular envío basado en la dirección del cliente</p>
              </div>
              <Switch />
            </div>
          </div>
        </div>

        {/* Localization settings */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <Globe className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-univers text-gray-900">Localización</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="default-locale">Idioma predeterminado</Label>
              <select 
                id="default-locale" 
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black"
              >
                <option value="es">Español</option>
                <option value="en">English</option>
              </select>
            </div>
            
            <div>
              <Label htmlFor="timezone">Zona horaria</Label>
              <select 
                id="timezone" 
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black"
              >
                <option value="America/Mexico_City">Ciudad de México (GMT-6)</option>
                <option value="America/Monterrey">Monterrey (GMT-6)</option>
                <option value="America/Cancun">Cancún (GMT-5)</option>
              </select>
            </div>

            <div>
              <Label htmlFor="currency">Moneda</Label>
              <select 
                id="currency" 
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black"
              >
                <option value="MXN">MXN - Peso Mexicano</option>
                <option value="USD">USD - Dólar Estadounidense</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Save button */}
      <div className="flex justify-end pt-6 border-t">
        <Button className="bg-black text-white hover:bg-gray-800">
          Guardar cambios
        </Button>
      </div>
    </div>
  );
}