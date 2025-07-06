"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

export default function EmailTemplateEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [id, setId] = useState<string>("");
  const [template, setTemplate] = useState<any>(null);
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();
  const t = useTranslations("Admin.emailTemplates");

  useEffect(() => {
    const fetchTemplate = async (templateId: string) => {
      try {
        const response = await fetch(`/api/admin/email-templates/${templateId}`);
        if (!response.ok) throw new Error("Failed to fetch template");
        
        const data = await response.json();
        setTemplate(data);
        setSubject(data.subject);
        setContent(data.content);
      } catch (error) {
        toast.error(t("loadError"));
      } finally {
        setIsLoading(false);
      }
    };

    params.then(({ id }) => {
      setId(id);
      fetchTemplate(id);
    });
  }, [params, t]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/admin/email-templates/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, content }),
      });

      if (!response.ok) throw new Error("Failed to save template");

      toast.success(t("saveSuccess"));
      
      router.push("/admin/email-templates");
    } catch (error) {
      toast.error(t("saveError"));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">{t("loading")}</div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">{t("notFound")}</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-univers text-gray-900">
            {t("editTitle")}
          </h1>
          <p className="text-sm text-gray-600 font-univers mt-1">
            {template.name}
          </p>
        </div>
        <Link href="/admin/email-templates">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t("backToTemplates")}
          </Button>
        </Link>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
        <div>
          <Label htmlFor="subject">{t("emailSubject")}</Label>
          <Input
            id="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder={t("subjectPlaceholder")}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="content">{t("emailContent")}</Label>
          <Textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={t("contentPlaceholder")}
            className="mt-1 min-h-[400px] font-mono text-sm"
          />
        </div>

        {/* Variables Info */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-2">
            {t("availableVariables")}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
            <code className="bg-white px-2 py-1 rounded border">{"{{customerName}}"}</code>
            <code className="bg-white px-2 py-1 rounded border">{"{{orderNumber}}"}</code>
            <code className="bg-white px-2 py-1 rounded border">{"{{orderTotal}}"}</code>
            <code className="bg-white px-2 py-1 rounded border">{"{{vendorName}}"}</code>
            <code className="bg-white px-2 py-1 rounded border">{"{{trackingNumber}}"}</code>
            <code className="bg-white px-2 py-1 rounded border">{"{{businessName}}"}</code>
            <code className="bg-white px-2 py-1 rounded border">{"{{userEmail}}"}</code>
            <code className="bg-white px-2 py-1 rounded border">{"{{orderDate}}"}</code>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-4">
          <Link href={`/admin/email-templates/${id}/preview`}>
            <Button variant="outline">
              {t("preview")}
            </Button>
          </Link>
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? t("saving") : t("saveChanges")}
          </Button>
        </div>
      </div>
    </div>
  );
}