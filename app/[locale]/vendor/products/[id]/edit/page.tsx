"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { InputWithValidation } from "@/components/ui/input-with-validation";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ChevronLeft, Upload, X, Loader2, Trash2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getVendorProductById, updateVendorProduct, deleteVendorProduct } from "@/lib/actions/products";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const createProductSchema = (t: any) => z.object({
  name: z.string().min(3, t("validation.nameMinLength")),
  description: z.string().min(10, t("validation.descriptionMinLength")),
  price: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: t("validation.priceInvalid"),
  }),
  stock: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
    message: t("validation.stockInvalid"),
  }),
  categoryId: z.string().min(1, t("validation.categoryRequired")),
  tags: z.string().optional(),
  images: z.array(z.string()).min(1, t("validation.imagesRequired")),
  isActive: z.boolean(),
});

type ProductForm = z.infer<ReturnType<typeof createProductSchema>>;

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;
  const t = useTranslations("Vendor.products.edit");

  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  const productSchema = createProductSchema(t);

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
      isActive: true,
    },
    mode: "onChange",
  });

  const queryClient = useQueryClient();
  const { data: product, isLoading: loadingProduct } = useQuery({
    queryKey: ["vendor", "product", productId],
    queryFn: () => getVendorProductById(productId),
    staleTime: 60 * 1000,
  });

  useEffect(() => {
    if (!product) return;
    form.reset({
      name: product.name,
      description: product.description || "",
      price: product.price.toString(),
      stock: (product.stock ?? 0).toString(),
      categoryId: product.categoryId?.toString() || "",
      tags: (product.tags as string[] | null)?.join(", ") || "",
      images: (product.images as string[] | null) || [],
      isActive: product.isActive ?? true,
    });
    setImageUrls(((product.images as string[]) || []));
  }, [product, form]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    setUploadingImages(true);
    const files = Array.from(e.target.files);

    try {
      // In a real app, you would upload these to a cloud storage service
      const newImageUrls = files.map((file) => URL.createObjectURL(file));

      setImageUrls([...imageUrls, ...newImageUrls]);
      form.setValue("images", [...imageUrls, ...newImageUrls]);
      toast.success(t("toast.imagesAdded", { count: files.length }));
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
      await updateVendorProduct(productId, {
        ...data,
        price: parseFloat(data.price),
        stock: parseInt(data.stock),
        categoryId: parseInt(data.categoryId),
        tags: data.tags ? data.tags.split(",").map(tag => tag.trim()) : [],
      });
      await queryClient.invalidateQueries({ queryKey: ["vendor", "product", productId] });
      await queryClient.invalidateQueries({ queryKey: ["vendor", "products"] });
      toast.success(t("toast.updateSuccess"));
      router.push("/vendor/products");
    } catch (error) {
      toast.error(t("toast.updateError"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteVendorProduct(productId);
      await queryClient.invalidateQueries({ queryKey: ["vendor", "products"] });
      toast.success(t("toast.deleteSuccess"));
      router.push("/vendor/products");
    } catch (error) {
      toast.error(t("toast.deleteError"));
    } finally {
      setIsDeleting(false);
    }
  };

  // Show loading state while product data is being fetched
  if (loadingProduct) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  // Show error if product not found
  if (!product) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <p className="text-gray-500">{t("productNotFound", { default: "Producto no encontrado" })}</p>
        <Link href="/vendor/products">
          <Button variant="outline" className="mt-4">
            {t("backToProducts")}
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/vendor/products"
          className="inline-flex items-center text-sm font-univers text-gray-600 hover:text-gray-900 mb-4"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          {t("backToProducts")}
        </Link>

        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-univers text-gray-900">{t("editProduct")}</h1>
            <p className="text-sm text-gray-600 font-univers mt-1">
              {t("updateProductInfo")}
            </p>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="h-4 w-4 mr-2" />
                {t("deleteButton")}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("deleteDialogTitle")}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t("deleteDialogDescription")}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t("deleteDialogCancel")}</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="bg-red-600 text-white hover:bg-red-700"
                >
                  {isDeleting ? t("deleting") : t("deleteDialogConfirm")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-univers mb-6">{t("basicInfo")}</h2>

            <div className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("productName")}</FormLabel>
                    <FormControl>
                      <InputWithValidation
                        placeholder={t("productNamePlaceholder")}
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
                    <FormLabel>{t("description")}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t("descriptionPlaceholder")}
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
                      <FormLabel>{t("category")}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t("selectCategoryPlaceholder")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="1">{t("categories.1")}</SelectItem>
                          <SelectItem value="2">{t("categories.2")}</SelectItem>
                          <SelectItem value="3">{t("categories.3")}</SelectItem>
                          <SelectItem value="4">{t("categories.4")}</SelectItem>
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
                      <FormLabel>{t("tags")}</FormLabel>
                      <FormControl>
                        <InputWithValidation
                          placeholder={t("tagsPlaceholder")}
                          {...field}
                        />
                      </FormControl>
                      <p className="text-xs text-gray-500 mt-1">
                        {t("tagsSeparator")}
                      </p>
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </div>

          {/* Pricing & Inventory */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-univers mb-6">{t("priceAndInventory")}</h2>

            <div className="grid grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("price")}</FormLabel>
                    <FormControl>
                      <InputWithValidation
                        type="number"
                        step="0.01"
                        placeholder={t("pricePlaceholder")}
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
                    <FormLabel>{t("stock")}</FormLabel>
                    <FormControl>
                      <InputWithValidation
                        id="stock"
                        type="number"
                        placeholder={t("stockPlaceholder")}
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

            <div className="mt-6">
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                    </FormControl>
                    <FormLabel className="!mt-0 cursor-pointer">
                      {t("productActive")}
                    </FormLabel>
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Images */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-univers mb-6">{t("productImages")}</h2>

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
                                  {t("uploadingImages")}
                                </span>
                              ) : (
                                t("dragDropText")
                              )}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {t("imageFormats")}
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
                                  {t("mainImage")}
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
              {t("cancelButton")}
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-black text-white hover:bg-gray-800"
            >
              {isLoading || loadingProduct ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {t("saving")}
                </>
              ) : (
                t("saveButton")
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}