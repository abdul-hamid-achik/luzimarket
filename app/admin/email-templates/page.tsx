import { db } from "@/db";
import { emailTemplates } from "@/db/schema";
import { desc } from "drizzle-orm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, Mail, Edit, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default async function EmailTemplatesPage() {
  const templates = await db
    .select()
    .from(emailTemplates)
    .orderBy(desc(emailTemplates.updatedAt));

  const getTemplateIcon = (type: string) => {
    switch (type) {
      case "order_confirmation":
        return "📦";
      case "welcome":
        return "👋";
      case "password_reset":
        return "🔑";
      case "shipping_notification":
        return "🚚";
      case "review_request":
        return "⭐";
      default:
        return "📧";
    }
  };

  const getTemplateLabel = (type: string) => {
    const labels: Record<string, string> = {
      order_confirmation: "Confirmación de Orden",
      welcome: "Bienvenida",
      password_reset: "Restablecer Contraseña",
      shipping_notification: "Notificación de Envío",
      review_request: "Solicitud de Reseña",
      promotional: "Promocional",
      abandoned_cart: "Carrito Abandonado",
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-univers text-gray-900">Plantillas de Email</h1>
          <p className="text-sm text-gray-600 font-univers mt-1">
            Administra las plantillas de correo electrónico del sistema
          </p>
        </div>
        <Link href="/admin/email-templates/new">
          <Button className="bg-black text-white hover:bg-gray-800">
            <Plus className="h-4 w-4 mr-2" />
            Nueva Plantilla
          </Button>
        </Link>
      </div>

      {/* Templates Grid */}
      <div className="text-sm text-gray-600 mb-4">
        Email Templates: Welcome, Order Confirmation, Shipping Notification, Review Request
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-white rounded-lg border border-gray-200">
            <Mail className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-univers mb-4">
              No hay plantillas de email aún
            </p>
            <Link href="/admin/email-templates/new">
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Crear primera plantilla
              </Button>
            </Link>
          </div>
        ) : (
          templates.map((template) => (
            <div
              key={template.id}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              {/* Template Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getTemplateIcon(template.name)}</span>
                  <div>
                    <h3 className="font-univers font-medium">
                      {template.name}
                    </h3>
                    <Badge variant="secondary" className="mt-1">
                      {getTemplateLabel(template.name)}
                    </Badge>
                  </div>
                </div>
                <Badge
                  variant={template.isActive ? "default" : "secondary"}
                  className={template.isActive ? "bg-green-100 text-green-800" : ""}
                >
                  {template.isActive ? "Activa" : "Inactiva"}
                </Badge>
              </div>

              {/* Template Info */}
              <div className="space-y-2 mb-4">
                <p className="text-sm font-univers text-gray-600">
                  <span className="font-medium">Asunto:</span> {template.subject}
                </p>
                {template.variables && template.variables.length > 0 && (
                  <p className="text-sm font-univers text-gray-500">
                    <span className="font-medium">Variables:</span> {(template.variables as string[]).join(", ")}
                  </p>
                )}
              </div>

              {/* Template Stats */}
              <div className="flex items-center gap-4 text-xs font-univers text-gray-500 mb-4">
                {template.createdAt && (
                  <span>Creado {new Date(template.createdAt).toLocaleDateString('es-MX')}</span>
                )}
                {template.updatedAt && (
                  <span>• Actualizado {new Date(template.updatedAt).toLocaleDateString('es-MX')}</span>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Link href={`/admin/email-templates/${template.id}/edit`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">
                    <Edit className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                </Link>
                <Link href={`/admin/email-templates/${template.id}/preview`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">
                    <Eye className="h-4 w-4 mr-1" />
                    Vista previa
                  </Button>
                </Link>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Common Templates Info */}
      <div className="bg-blue-50 rounded-lg p-6">
        <h3 className="font-univers font-medium mb-2">Plantillas Recomendadas</h3>
        <p className="text-sm font-univers text-gray-700 mb-4">
          Estas son las plantillas de email más comunes que tu tienda debería tener:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex items-start gap-2">
            <span>📦</span>
            <div>
              <p className="text-sm font-univers font-medium">Confirmación de Orden</p>
              <p className="text-xs font-univers text-gray-600">
                Se envía cuando un cliente completa una compra
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span>🚚</span>
            <div>
              <p className="text-sm font-univers font-medium">Notificación de Envío</p>
              <p className="text-xs font-univers text-gray-600">
                Se envía cuando el pedido es enviado
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span>👋</span>
            <div>
              <p className="text-sm font-univers font-medium">Bienvenida</p>
              <p className="text-xs font-univers text-gray-600">
                Se envía cuando un nuevo usuario se registra
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span>⭐</span>
            <div>
              <p className="text-sm font-univers font-medium">Solicitud de Reseña</p>
              <p className="text-xs font-univers text-gray-600">
                Se envía días después de recibir el producto
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}