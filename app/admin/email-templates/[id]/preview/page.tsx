import { db } from "@/db";
import { emailTemplates } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function EmailTemplatePreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations("Admin.emailTemplates");

  const template = await db
    .select()
    .from(emailTemplates)
    .where(eq(emailTemplates.id, parseInt(id)))
    .limit(1);

  if (!template.length) {
    notFound();
  }

  const { name, subject, content, type } = template[0];

  // Replace variables with sample data for preview
  const sampleData: Record<string, any> = {
    customerName: "Juan Pérez",
    businessName: "Artesanías México",
    orderNumber: "12345",
    orderTotal: "$1,500.00",
    orderDate: new Date().toLocaleDateString("es-MX"),
    productName: "Vela Artesanal",
    vendorName: "Artesanías México",
    trackingNumber: "MX123456789",
    userName: "Juan Pérez",
    userEmail: "juan@example.com",
  };

  let previewContent = content;
  let previewSubject = subject;

  // Replace variables in content and subject
  Object.entries(sampleData).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, "g");
    previewContent = previewContent.replace(regex, value);
    previewSubject = previewSubject.replace(regex, value);
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-univers text-gray-900">
            {t("previewTemplate")}
          </h1>
          <p className="text-sm text-gray-600 font-univers mt-1">
            {name} - {t(`templateTypes.${type}`)}
          </p>
        </div>
        <Link href="/admin/email-templates">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t("backToTemplates")}
          </Button>
        </Link>
      </div>

      {/* Email Preview */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="border-b border-gray-200 p-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-sm">
              <span className="font-medium text-gray-700">From:</span>
              <span className="text-gray-600">noreply@luzimarket.shop</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <span className="font-medium text-gray-700">To:</span>
              <span className="text-gray-600">juan@example.com</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <span className="font-medium text-gray-700">Subject:</span>
              <span className="text-gray-900 font-medium">{previewSubject}</span>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          <div 
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: previewContent }}
          />
        </div>
      </div>

      {/* Variables Info */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          {t("variables")}
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {Object.entries(sampleData).map(([key, value]) => (
            <div key={key} className="text-sm">
              <code className="bg-white px-2 py-1 rounded border border-gray-200">
                {`{{${key}}}`}
              </code>
              <span className="text-gray-500 ml-2">→ {value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end space-x-4">
        <Link href={`/admin/email-templates/${id}/edit`}>
          <Button>
            {t("edit")}
          </Button>
        </Link>
      </div>
    </div>
  );
}