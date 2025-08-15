"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { InputWithValidation } from "@/components/ui/input-with-validation";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ChevronLeft, Upload, X, Loader2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { createVendorProduct } from "@/lib/actions/products";

const productSchema = z.object({
  name: z.string().min(3),
  description: z.string().min(10),
  price: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0),
  stock: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0),
  categoryId: z.string().min(1),
  tags: z.string().optional(),
  images: z.array(z.string()).min(1),
});

type ProductForm = z.infer<typeof productSchema>;

export default function NewProductPage() {
  const router = useRouter();
  const t = useTranslations("Vendor.products.new");
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const res = await fetch("/api/categories", { cache: "no-store" });
        if (!res.ok) throw new Error("failed");
        const data: { id: number; name: string }[] = await res.json();
        if (isMounted) setCategories(data);
      } catch (e) {
        toast.error("No se pudieron cargar las categorías");
      } finally {
        if (isMounted) setCategoriesLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const form = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      price: "",
      stock: "",
      categoryId: "",
      tags: "",
      images: [],
    },
    mode: "onChange",
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    setUploadingImages(true);
    const files = Array.from(e.target.files);

    try {
      // In a real app, you would upload these to a cloud storage service
      // For now, we'll use placeholder URLs
      const newImageUrls = files.map((file, index) => {
        // Create a local URL for preview
        return URL.createObjectURL(file);
      });

      setImageUrls([...imageUrls, ...newImageUrls]);
      form.setValue("images", [...imageUrls, ...newImageUrls]);
      toast.success(`${files.length} imagen(es) agregadas`);
    } catch (error) {
      toast.error(t("toast.uploadError"));
    } finally {
      setUploadingImages(false);
    }
  };

  const removeImage = (index: number) => {
    const newImages = imageUrls.filter((_, i) => i !== index);
    setImageUrls(newImages);
    form.setValue("images", newImages);
  };

  const onSubmit = async (data: ProductForm) => {
    setIsLoading(true);
    try {
      await createVendorProduct({
        ...data,
        price: parseFloat(data.price),
        stock: parseInt(data.stock),
        categoryId: parseInt(data.categoryId),
        tags: data.tags ? data.tags.split(",").map(tag => tag.trim()) : [],
      });
      toast.success(t("toast.createSuccess"));
      router.push("/vendor/products");
    } catch (error) {
      toast.error(t("toast.createError"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/vendor/products"
          className="inline-flex items-center text-sm font-univers text-gray-600 hover:text-gray-900 mb-4"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Volver a productos
        </Link>

        <h1 className="text-2xl font-univers text-gray-900">Agregar Nuevo Producto</h1>
        <p className="text-sm text-gray-600 font-univers mt-1">
          Completa la información para agregar un nuevo producto a tu catálogo
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-univers mb-6">Información Básica</h2>

            <div className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre del Producto</FormLabel>
                    <FormControl>
                      <InputWithValidation
                        placeholder={t("placeholders.name")}
                        {...field}
                        showValidation={form.formState.dirtyFields.name}
                        isValid={form.formState.dirtyFields.name && !form.formState.errors.name}
                        isInvalid={!!form.formState.errors.name}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t("placeholders.description")}
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoría</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={categoriesLoading ? "Cargando categorías..." : "Selecciona una categoría"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((c) => (
                            <SelectItem key={c.id} value={String(c.id)}>
                              {c.name}
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
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Etiquetas (opcional)</FormLabel>
                      <FormControl>
                        <InputWithValidation
                          placeholder="rosas, amor, aniversario"
                          {...field}
                        />
                      </FormControl>
                      <p className="text-xs text-gray-500 mt-1">
                        Separa las etiquetas con comas
                      </p>
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </div>

          {/* Pricing & Inventory */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-univers mb-6">Precio e Inventario</h2>

            <div className="grid grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Precio (MXN)</FormLabel>
                    <FormControl>
                      <InputWithValidation
                        type="number"
                        step="0.01"
                        placeholder={t("placeholders.price")}
                        {...field}
                        showValidation={form.formState.dirtyFields.price}
                        isValid={form.formState.dirtyFields.price && !form.formState.errors.price}
                        isInvalid={!!form.formState.errors.price}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="stock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stock Disponible</FormLabel>
                    <FormControl>
                      <InputWithValidation
                        type="number"
                        placeholder={t("placeholders.stock")}
                        {...field}
                        showValidation={form.formState.dirtyFields.stock}
                        isValid={form.formState.dirtyFields.stock && !form.formState.errors.stock}
                        isInvalid={!!form.formState.errors.stock}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Images */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-univers mb-6">Imágenes del Producto</h2>

            <FormField
              control={form.control}
              name="images"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div>
                      {/* Image Upload Area */}
                      <div className="mb-6">
                        <label className="block">
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 cursor-pointer transition-colors">
                            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                            <p className="text-sm font-univers text-gray-600">
                              {uploadingImages ? (
                                <span className="flex items-center justify-center">
                                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                  Subiendo imágenes...
                                </span>
                              ) : (
                                "Arrastra imágenes aquí o haz clic para seleccionar"
                              )}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              PNG, JPG hasta 5MB
                            </p>
                          </div>
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            multiple
                            onChange={handleImageUpload}
                            disabled={uploadingImages}
                          />
                        </label>
                      </div>

                      {/* Image Preview Grid */}
                      {imageUrls.length > 0 && (
                        <div className="grid grid-cols-4 gap-4">
                          {imageUrls.map((url, index) => (
                            <div key={index} className="relative group">
                              <div className="aspect-square relative bg-gray-100 rounded-lg overflow-hidden">
                                <Image
                                  src={url}
                                  alt={`Producto ${index + 1}`}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => removeImage(index)}
                                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="h-4 w-4" />
                              </button>
                              {index === 0 && (
                                <span className="absolute bottom-2 left-2 bg-black text-white text-xs px-2 py-1 rounded">
                                  Principal
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/vendor/products")}
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
                  Creando...
                </>
              ) : (
                "Crear Producto"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}