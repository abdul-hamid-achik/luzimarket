"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Download, FileText, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface ProductCSVImportProps {
    vendorId: string;
}

export function ProductCSVImport({ vendorId }: ProductCSVImportProps) {
    const router = useRouter();
    const [showDialog, setShowDialog] = useState(false);
    const [importing, setImporting] = useState(false);
    const [importResults, setImportResults] = useState<{
        imported: number;
        total: number;
        errors: Array<{ row: number; error: string }>;
    } | null>(null);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.name.endsWith(".csv")) {
            toast.error("Por favor selecciona un archivo CSV");
            return;
        }

        setImporting(true);
        setImportResults(null);

        try {
            const text = await file.text();

            const response = await fetch("/api/vendor/products/import", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ csvContent: text }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "Error importing products");
            }

            setImportResults({
                imported: result.imported,
                total: result.total,
                errors: result.errors || [],
            });

            if (result.imported > 0) {
                toast.success(`${result.imported} productos importados exitosamente`);
                router.refresh();
            }

            if (result.errors && result.errors.length > 0) {
                toast.error(`${result.errors.length} productos tuvieron errores`);
            }
        } catch (error: any) {
            console.error("Error importing CSV:", error);
            toast.error(error.message || "Error al importar CSV");
        } finally {
            setImporting(false);
            // Reset file input
            e.target.value = "";
        }
    };

    const handleExport = async () => {
        try {
            const response = await fetch("/api/vendor/products/export");

            if (!response.ok) throw new Error("Error exporting products");

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `products-${new Date().toISOString().split("T")[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            toast.success("Productos exportados exitosamente");
        } catch (error) {
            console.error("Error exporting products:", error);
            toast.error("Error al exportar productos");
        }
    };

    const downloadTemplate = () => {
        const template = `name,description,price,stock,category,tags,brand,colors,sizes,materials,weight
"Ramo de Rosas Rojas","Hermoso ramo de 12 rosas rojas frescas",599.00,50,"Flores","rosas,amor,romántico","FloraMax","rojo","grande","natural",500
"Caja de Chocolates Premium","Selección de chocolates artesanales",450.00,30,"Chocolates y Dulces","chocolate,gourmet,regalo","ChocoBoutique","mixto","mediano","chocolate belga",300`;

        const blob = new Blob([template], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "plantilla-productos.csv";
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Import Card */}
                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setShowDialog(true)}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Upload className="h-5 w-5" />
                            Importar CSV
                        </CardTitle>
                        <CardDescription>
                            Importa múltiples productos desde un archivo CSV
                        </CardDescription>
                    </CardHeader>
                </Card>

                {/* Export Card */}
                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={handleExport}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Download className="h-5 w-5" />
                            Exportar CSV
                        </CardTitle>
                        <CardDescription>
                            Descarga todos tus productos como CSV
                        </CardDescription>
                    </CardHeader>
                </Card>

                {/* Template Card */}
                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={downloadTemplate}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Plantilla CSV
                        </CardTitle>
                        <CardDescription>
                            Descarga una plantilla de ejemplo
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>

            {/* Import Dialog */}
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Importar Productos desde CSV</DialogTitle>
                        <DialogDescription>
                            Selecciona un archivo CSV con tus productos. Los productos serán creados como inactivos
                            y requerirán aprobación.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        {/* File Upload */}
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                            <input
                                type="file"
                                accept=".csv"
                                onChange={handleFileUpload}
                                className="hidden"
                                id="csv-upload"
                                disabled={importing}
                            />
                            <label htmlFor="csv-upload" className="cursor-pointer">
                                {importing ? (
                                    <div className="space-y-3">
                                        <Loader2 className="h-12 w-12 text-blue-600 mx-auto animate-spin" />
                                        <p className="text-sm font-medium">Importando productos...</p>
                                        <p className="text-xs text-gray-500">Esto puede tardar un momento</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                                        <div>
                                            <p className="text-sm font-medium">Haz clic para seleccionar archivo CSV</p>
                                            <p className="text-xs text-gray-500 mt-1">o arrastra y suelta aquí</p>
                                        </div>
                                    </div>
                                )}
                            </label>
                        </div>

                        {/* Import Results */}
                        {importResults && (
                            <div className="space-y-3">
                                <div className={`p-4 rounded-lg border ${importResults.errors.length === 0
                                        ? "bg-green-50 border-green-200"
                                        : "bg-yellow-50 border-yellow-200"
                                    }`}>
                                    <div className="flex items-center gap-2 mb-2">
                                        {importResults.errors.length === 0 ? (
                                            <CheckCircle className="h-5 w-5 text-green-600" />
                                        ) : (
                                            <AlertCircle className="h-5 w-5 text-yellow-600" />
                                        )}
                                        <p className="font-medium">
                                            {importResults.imported} de {importResults.total} productos importados
                                        </p>
                                    </div>

                                    {importResults.errors.length > 0 && (
                                        <div className="mt-3 space-y-1">
                                            <p className="text-sm font-medium">Errores:</p>
                                            <div className="max-h-40 overflow-y-auto space-y-1">
                                                {importResults.errors.map((err, idx) => (
                                                    <p key={idx} className="text-xs text-gray-700">
                                                        Fila {err.row}: {err.error}
                                                    </p>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setImportResults(null);
                                        setShowDialog(false);
                                    }}
                                    className="w-full"
                                >
                                    Cerrar
                                </Button>
                            </div>
                        )}

                        {/* Instructions */}
                        {!importResults && !importing && (
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <p className="text-sm font-medium mb-2">Formato del CSV:</p>
                                <ul className="text-xs text-gray-700 space-y-1">
                                    <li>• Columnas requeridas: name, description, price, stock, category</li>
                                    <li>• Columnas opcionales: tags, brand, colors, sizes, materials, weight</li>
                                    <li>• Los productos serán creados como inactivos</li>
                                    <li>• Máximo 500 productos por importación</li>
                                    <li>• Descarga la plantilla para ver el formato correcto</li>
                                </ul>

                                <Button
                                    variant="link"
                                    size="sm"
                                    onClick={downloadTemplate}
                                    className="mt-2 p-0 h-auto"
                                >
                                    Descargar plantilla de ejemplo
                                </Button>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

