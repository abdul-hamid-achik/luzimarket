"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ChevronLeft, Save, Eye, Code, FileText, Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import dynamic from "next/dynamic";

// Dynamically import the editor to avoid SSR issues
const Editor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

const emailTemplateSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  type: z.string().min(1, "Selecciona un tipo de plantilla"),
  subject: z.string().min(5, "El asunto debe tener al menos 5 caracteres"),
  description: z.string().optional(),
  htmlContent: z.string().min(10, "El contenido HTML es requerido"),
  textContent: z.string().optional(),
  variables: z.array(z.string()).optional(),
  isActive: z.boolean(),
});

type EmailTemplateForm = z.infer<typeof emailTemplateSchema>;

export default function NewEmailTemplatePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");

  const form = useForm<EmailTemplateForm>({
    resolver: zodResolver(emailTemplateSchema),
    defaultValues: {
      name: "",
      type: "",
      subject: "",
      description: "",
      htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{subject}}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background-color: #000;
      color: #fff;
      padding: 20px;
      text-align: center;
    }
    .content {
      padding: 20px;
      background-color: #f9f9f9;
    }
    .footer {
      text-align: center;
      padding: 20px;
      font-size: 12px;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>LUZIMARKET</h1>
  </div>
  <div class="content">
    <h2>Hola {{customer_name}},</h2>
    <p>Tu contenido aquí...</p>
  </div>
  <div class="footer">
    <p>© 2024 Luzimarket. Todos los derechos reservados.</p>
  </div>
</body>
</html>`,
      textContent: "",
      variables: [],
      isActive: true,
    },
  });

  const templateTypes = [
    { value: "order_confirmation", label: "Confirmación de Orden" },
    { value: "welcome", label: "Bienvenida" },
    { value: "password_reset", label: "Restablecer Contraseña" },
    { value: "shipping_notification", label: "Notificación de Envío" },
    { value: "review_request", label: "Solicitud de Reseña" },
    { value: "promotional", label: "Promocional" },
    { value: "abandoned_cart", label: "Carrito Abandonado" },
  ];

  const commonVariables = [
    "{{customer_name}}",
    "{{order_number}}",
    "{{order_total}}",
    "{{shipping_address}}",
    "{{tracking_number}}",
    "{{product_name}}",
    "{{shop_name}}",
    "{{current_year}}",
  ];

  const insertVariable = (variable: string) => {
    const currentContent = form.getValues("htmlContent");
    form.setValue("htmlContent", currentContent + " " + variable);
  };

  const onSubmit = async (data: EmailTemplateForm) => {
    setIsLoading(true);
    
    try {
      const response = await fetch("/api/admin/email-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Error al crear la plantilla");
      }

      toast.success("Plantilla creada exitosamente");
      router.push("/admin/email-templates");
    } catch (error) {
      toast.error("Error al crear la plantilla");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/admin/email-templates"
          className="inline-flex items-center text-sm font-univers text-gray-600 hover:text-gray-900 mb-4"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Volver a plantillas
        </Link>
        
        <h1 className="text-2xl font-univers text-gray-900">Nueva Plantilla de Email</h1>
        <p className="text-sm text-gray-600 font-univers mt-1">
          Crea una nueva plantilla de correo electrónico
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Form Fields */}
            <div className="lg:col-span-1 space-y-6">
              {/* Basic Information */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-univers mb-6">Información Básica</h2>
                
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre de la Plantilla</FormLabel>
                        <FormControl>
                          <Input placeholder="Ej: Confirmación de Orden" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Plantilla</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona un tipo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {templateTypes.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Asunto del Email</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Ej: Tu orden #{{order_number}} ha sido confirmada" 
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Puedes usar variables como {"{"}{"{"} order_number {"}"}{"}"} 
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descripción (opcional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe el propósito de esta plantilla..."
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <div>
                          <FormLabel>Plantilla Activa</FormLabel>
                          <FormDescription>
                            Las plantillas inactivas no se usarán
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Variables */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-univers mb-4">Variables Disponibles</h2>
                <p className="text-sm text-gray-600 font-univers mb-4">
                  Haz clic para insertar en el editor
                </p>
                <div className="flex flex-wrap gap-2">
                  {commonVariables.map((variable) => (
                    <button
                      key={variable}
                      type="button"
                      onClick={() => insertVariable(variable)}
                      className="px-3 py-1 text-xs font-mono bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                    >
                      {variable}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column - Editor */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg border border-gray-200">
                <Tabs defaultValue="html" className="w-full">
                  <div className="border-b px-6 py-3 flex justify-between items-center">
                    <TabsList>
                      <TabsTrigger value="html" className="gap-2">
                        <Code className="h-4 w-4" />
                        HTML
                      </TabsTrigger>
                      <TabsTrigger value="text" className="gap-2">
                        <FileText className="h-4 w-4" />
                        Texto Plano
                      </TabsTrigger>
                      <TabsTrigger value="preview" className="gap-2">
                        <Eye className="h-4 w-4" />
                        Vista Previa
                      </TabsTrigger>
                    </TabsList>

                    {/* Preview Mode Toggle */}
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={previewMode === "desktop" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setPreviewMode("desktop")}
                      >
                        Desktop
                      </Button>
                      <Button
                        type="button"
                        variant={previewMode === "mobile" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setPreviewMode("mobile")}
                      >
                        Mobile
                      </Button>
                    </div>
                  </div>

                  <TabsContent value="html" className="m-0">
                    <FormField
                      control={form.control}
                      name="htmlContent"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <div className="h-[600px]">
                              <Editor
                                height="100%"
                                defaultLanguage="html"
                                value={field.value}
                                onChange={(value) => field.onChange(value || "")}
                                theme="vs-light"
                                options={{
                                  minimap: { enabled: false },
                                  fontSize: 14,
                                  wordWrap: "on",
                                }}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TabsContent>

                  <TabsContent value="text" className="m-0">
                    <FormField
                      control={form.control}
                      name="textContent"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Textarea
                              placeholder="Versión en texto plano del email..."
                              className="min-h-[600px] font-mono text-sm rounded-none border-0 focus:ring-0"
                              {...field}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </TabsContent>

                  <TabsContent value="preview" className="m-0 p-6">
                    <div
                      className={`mx-auto bg-white border rounded-lg shadow-sm ${
                        previewMode === "mobile" ? "max-w-sm" : "max-w-2xl"
                      }`}
                    >
                      <iframe
                        srcDoc={form.watch("htmlContent")}
                        className="w-full h-[600px] rounded-lg"
                        title="Email Preview"
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/admin/email-templates")}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-black text-white hover:bg-gray-800"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Guardar Plantilla
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}