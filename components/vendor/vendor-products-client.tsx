"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
    Edit,
    Eye,
    EyeOff,
    Loader2,
    Trash2,
    Plus,
    AlertTriangle,
    PackageX,
    Copy,
    FolderTree
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { bulkUpdateVendorProductPrices, bulkDeleteVendorProducts, toggleVendorProductStatus, bulkUpdateVendorProductCategories, duplicateVendorProduct } from "@/lib/actions/products";

interface Product {
    id: string;
    name: string;
    price: string;
    stock: number | null;
    isActive: boolean | null;
    images: unknown;
    categoryId: number;
    categoryName: string | null;
}

interface VendorProductsClientProps {
    products: Product[];
    vendorId: string;
}

export function VendorProductsClient({ products, vendorId }: VendorProductsClientProps) {
    const router = useRouter();
    const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(false);
    const [showPriceDialog, setShowPriceDialog] = useState(false);
    const [showCategoryDialog, setShowCategoryDialog] = useState(false);
    const [priceUpdateType, setPriceUpdateType] = useState<'percentage' | 'fixed'>('percentage');
    const [priceValue, setPriceValue] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('');

    // Get unique categories from products
    const categories = Array.from(new Set(products.map(p => ({ id: p.categoryId, name: p.categoryName })).filter(c => c.name)));

    const handleSelectAll = () => {
        if (selectedProducts.size === products.length) {
            setSelectedProducts(new Set());
        } else {
            setSelectedProducts(new Set(products.map(p => p.id)));
        }
    };

    const handleToggleSelect = (productId: string) => {
        const newSelected = new Set(selectedProducts);
        if (newSelected.has(productId)) {
            newSelected.delete(productId);
        } else {
            newSelected.add(productId);
        }
        setSelectedProducts(newSelected);
    };

    const handleBulkDelete = async () => {
        if (selectedProducts.size === 0) return;

        if (!confirm(`¿Eliminar ${selectedProducts.size} producto(s)?`)) return;

        setIsLoading(true);
        try {
            const result = await bulkDeleteVendorProducts(Array.from(selectedProducts), vendorId);

            if (result.success) {
                toast.success(result.message || 'Productos eliminados');
                setSelectedProducts(new Set());
                router.refresh();
            } else {
                toast.error(result.error || 'Error al eliminar productos');
            }
        } catch (error) {
            toast.error('Error al eliminar productos');
        } finally {
            setIsLoading(false);
        }
    };

    const handleBulkUpdatePrices = async () => {
        if (!priceValue || isNaN(Number(priceValue))) {
            toast.error('Ingresa un valor válido');
            return;
        }

        setIsLoading(true);
        try {
            const result = await bulkUpdateVendorProductPrices(
                Array.from(selectedProducts),
                vendorId,
                {
                    type: priceUpdateType,
                    value: Number(priceValue)
                }
            );

            if (result.success) {
                toast.success(result.message || 'Precios actualizados');
                setSelectedProducts(new Set());
                setShowPriceDialog(false);
                setPriceValue('');
                router.refresh();
            } else {
                toast.error(result.error || 'Error al actualizar precios');
            }
        } catch (error) {
            toast.error('Error al actualizar precios');
        } finally {
            setIsLoading(false);
        }
    };

    const handleBulkUpdateCategories = async () => {
        if (!selectedCategory) {
            toast.error('Selecciona una categoría');
            return;
        }

        setIsLoading(true);
        try {
            const result = await bulkUpdateVendorProductCategories(
                Array.from(selectedProducts),
                vendorId,
                parseInt(selectedCategory)
            );

            if (result.success) {
                toast.success(result.message || 'Categorías actualizadas');
                setSelectedProducts(new Set());
                setShowCategoryDialog(false);
                setSelectedCategory('');
                router.refresh();
            } else {
                toast.error(result.error || 'Error al actualizar categorías');
            }
        } catch (error) {
            toast.error('Error al actualizar categorías');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDuplicate = async (productId: string) => {
        setIsLoading(true);
        try {
            const result = await duplicateVendorProduct(productId, vendorId);

            if (result.success) {
                toast.success('Producto duplicado exitosamente');
                router.refresh();
            } else {
                toast.error(result.error || 'Error al duplicar producto');
            }
        } catch (error) {
            toast.error('Error al duplicar producto');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Bulk Actions Bar */}
            {selectedProducts.size > 0 && (
                <div className="p-4 bg-gray-50 rounded-lg flex items-center justify-between">
                    <span className="text-sm font-medium">
                        {selectedProducts.size} seleccionados
                    </span>
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedProducts(new Set())}
                            disabled={isLoading}
                        >
                            Deseleccionar todo
                        </Button>
                        <Button
                            size="sm"
                            onClick={() => setShowPriceDialog(true)}
                            disabled={isLoading}
                        >
                            Actualizar precio
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setShowCategoryDialog(true)}
                            disabled={isLoading}
                        >
                            <FolderTree className="h-4 w-4 mr-2" />
                            Cambiar categoría
                        </Button>
                        <Button
                            size="sm"
                            variant="destructive"
                            onClick={handleBulkDelete}
                            disabled={isLoading}
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Eliminar
                        </Button>
                    </div>
                </div>
            )}

            {/* Products Table */}
            <div className="bg-white rounded-lg border border-gray-200">
                {products.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-500 font-univers mb-4">
                            No tienes productos aún
                        </p>
                        <Link href="/vendor/products/new">
                            <Button variant="outline">
                                <Plus className="h-4 w-4 mr-2" />
                                Agregar tu primer producto
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-left">
                                        <div onClick={(e) => e.stopPropagation()}>
                                            <Checkbox
                                                checked={selectedProducts.size === products.length}
                                                onCheckedChange={handleSelectAll}
                                                aria-label="Select all products"
                                            />
                                        </div>
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-univers font-medium text-gray-500 uppercase">
                                        Producto
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-univers font-medium text-gray-500 uppercase">
                                        Categoría
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-univers font-medium text-gray-500 uppercase">
                                        Precio
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-univers font-medium text-gray-500 uppercase">
                                        Stock
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-univers font-medium text-gray-500 uppercase">
                                        Estado
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-univers font-medium text-gray-500 uppercase">
                                        Acciones
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {products.map((product) => {
                                    const images = product.images as string[] || [];
                                    return (
                                        <tr key={product.id}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div onClick={(e) => e.stopPropagation()}>
                                                    <Checkbox
                                                        checked={selectedProducts.has(product.id)}
                                                        onCheckedChange={() => handleToggleSelect(product.id)}
                                                        aria-label={`Select ${product.name}`}
                                                        data-product-id={product.id}
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="h-10 w-10 flex-shrink-0 relative bg-gray-100 rounded">
                                                        {images[0] && (
                                                            <Image
                                                                src={images[0]}
                                                                alt={product.name}
                                                                fill
                                                                className="object-cover rounded"
                                                            />
                                                        )}
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-univers font-medium text-gray-900">
                                                            {product.name}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm text-gray-900 font-univers">
                                                    {product.categoryName || "-"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm text-gray-900 font-univers">
                                                    ${Number(product.price).toLocaleString('es-MX')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    {(product.stock || 0) === 0 ? (
                                                        <PackageX className="h-4 w-4 text-red-600" />
                                                    ) : (product.stock || 0) <= 10 ? (
                                                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                                                    ) : null}
                                                    <span className={`text-sm font-univers ${(product.stock || 0) === 0 ? 'text-red-600 font-medium' :
                                                        (product.stock || 0) <= 10 ? 'text-yellow-600 font-medium' :
                                                            'text-gray-900'
                                                        }`}>
                                                        {product.stock || 0}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <Badge className={product.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                                                    {product.isActive ? "Activo" : "Inactivo"}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <Link href={`/vendor/products/${product.id}/edit`}>
                                                        <Button variant="ghost" size="sm" title="Editar producto" aria-label="Editar">
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                    </Link>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDuplicate(product.id)}
                                                        title="Duplicar producto"
                                                    >
                                                        <Copy className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={async () => {
                                                            await toggleVendorProductStatus(product.id, vendorId);
                                                            router.refresh();
                                                        }}
                                                    >
                                                        {product.isActive ? (
                                                            <EyeOff className="h-4 w-4" />
                                                        ) : (
                                                            <Eye className="h-4 w-4" />
                                                        )}
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Price Update Dialog */}
            <Dialog open={showPriceDialog} onOpenChange={setShowPriceDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Actualizar precio de {selectedProducts.size} producto(s)</DialogTitle>
                        <DialogDescription>
                            Elige cómo actualizar los precios de los productos seleccionados
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <RadioGroup value={priceUpdateType} onValueChange={(v: any) => setPriceUpdateType(v)}>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="percentage" id="percentage" />
                                <Label htmlFor="percentage">Porcentaje (%)</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="fixed" id="fixed" />
                                <Label htmlFor="fixed">Cantidad fija ($)</Label>
                            </div>
                        </RadioGroup>

                        <div>
                            <Label htmlFor="priceValue">
                                {priceUpdateType === 'percentage' ? 'Porcentaje de cambio' : 'Cambio en pesos'}
                            </Label>
                            <Input
                                id="priceValue"
                                type="number"
                                step={priceUpdateType === 'percentage' ? '1' : '0.01'}
                                placeholder={priceUpdateType === 'percentage' ? '10' : '50.00'}
                                value={priceValue}
                                onChange={(e) => setPriceValue(e.target.value)}
                            />
                            <p className="text-sm text-gray-500 mt-1">
                                {priceUpdateType === 'percentage'
                                    ? 'Ejemplo: 10 aumenta precios en 10%'
                                    : 'Ejemplo: 50 aumenta precios en $50.00'}
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowPriceDialog(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleBulkUpdatePrices} disabled={isLoading}>
                            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Aplicar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Category Change Dialog */}
            <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Cambiar categoría de {selectedProducts.size} producto(s)</DialogTitle>
                        <DialogDescription>
                            Selecciona la nueva categoría para los productos seleccionados
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="category">Nueva Categoría</Label>
                            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecciona una categoría" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map((cat) => (
                                        <SelectItem key={cat.id} value={cat.id.toString()}>
                                            {cat.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCategoryDialog(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleBulkUpdateCategories} disabled={isLoading}>
                            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Aplicar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

