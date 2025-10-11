import { db } from "@/db";
import { products, categories } from "@/db/schema";
import { eq } from "drizzle-orm";

export interface ProductCSVRow {
    name: string;
    description: string;
    price: number;
    stock: number;
    category: string;
    tags?: string;
    brand?: string;
    colors?: string;
    sizes?: string;
    materials?: string;
    weight?: number;
    sku?: string;
}

export interface CSVImportResult {
    success: boolean;
    imported: number;
    errors: Array<{ row: number; error: string }>;
    created: string[];
}

/**
 * Converts products to CSV format
 */
export function productsToCSV(products: any[]): string {
    const headers = [
        "name",
        "description",
        "price",
        "stock",
        "category",
        "tags",
        "brand",
        "colors",
        "sizes",
        "materials",
        "weight",
        "isActive",
    ];

    const rows = products.map((product) => {
        return [
            escapeCsvField(product.name),
            escapeCsvField(product.description || ""),
            product.price,
            product.stock || 0,
            escapeCsvField(product.categoryName || ""),
            escapeCsvField(Array.isArray(product.tags) ? product.tags.join(", ") : ""),
            escapeCsvField(product.brand || ""),
            escapeCsvField(Array.isArray(product.colors) ? product.colors.join(", ") : ""),
            escapeCsvField(Array.isArray(product.sizes) ? product.sizes.join(", ") : ""),
            escapeCsvField(Array.isArray(product.materials) ? product.materials.join(", ") : ""),
            product.weight || 0,
            product.isActive ? "true" : "false",
        ].join(",");
    });

    return [headers.join(","), ...rows].join("\n");
}

/**
 * Parses CSV content into product rows
 */
export function parseProductCSV(csvContent: string): {
    success: boolean;
    data?: ProductCSVRow[];
    error?: string;
} {
    try {
        const lines = csvContent.trim().split("\n");

        if (lines.length < 2) {
            return {
                success: false,
                error: "CSV file must contain headers and at least one row",
            };
        }

        // Parse headers
        const headers = lines[0].split(",").map(h => h.trim().toLowerCase());

        // Validate required headers
        const requiredHeaders = ["name", "description", "price", "stock", "category"];
        const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));

        if (missingHeaders.length > 0) {
            return {
                success: false,
                error: `Missing required headers: ${missingHeaders.join(", ")}`,
            };
        }

        // Parse data rows
        const data: ProductCSVRow[] = [];

        for (let i = 1; i < lines.length; i++) {
            const values = parseCSVLine(lines[i]);

            if (values.length === 0) continue; // Skip empty lines

            const row: any = {};
            headers.forEach((header, index) => {
                if (values[index] !== undefined) {
                    row[header] = values[index];
                }
            });

            // Validate and convert types
            const productRow: ProductCSVRow = {
                name: row.name?.trim(),
                description: row.description?.trim(),
                price: parseFloat(row.price),
                stock: parseInt(row.stock) || 0,
                category: row.category?.trim(),
                tags: row.tags?.trim(),
                brand: row.brand?.trim(),
                colors: row.colors?.trim(),
                sizes: row.sizes?.trim(),
                materials: row.materials?.trim(),
                weight: row.weight ? parseInt(row.weight) : undefined,
            };

            // Validation
            if (!productRow.name) {
                throw new Error(`Row ${i + 1}: Product name is required`);
            }
            if (!productRow.description) {
                throw new Error(`Row ${i + 1}: Description is required`);
            }
            if (isNaN(productRow.price) || productRow.price <= 0) {
                throw new Error(`Row ${i + 1}: Invalid price`);
            }
            if (isNaN(productRow.stock) || productRow.stock < 0) {
                throw new Error(`Row ${i + 1}: Invalid stock`);
            }
            if (!productRow.category) {
                throw new Error(`Row ${i + 1}: Category is required`);
            }

            data.push(productRow);
        }

        return {
            success: true,
            data,
        };
    } catch (error: any) {
        return {
            success: false,
            error: error.message || "Failed to parse CSV",
        };
    }
}

/**
 * Imports products from CSV data
 */
export async function importProductsFromCSV(
    vendorId: string,
    csvData: ProductCSVRow[]
): Promise<CSVImportResult> {
    const errors: Array<{ row: number; error: string }> = [];
    const created: string[] = [];
    let imported = 0;

    // Get all categories for mapping
    const allCategories = await db.select().from(categories);
    const categoryMap = new Map(allCategories.map(c => [c.name.toLowerCase(), c.id]));

    for (let i = 0; i < csvData.length; i++) {
        const row = csvData[i];

        try {
            // Find category
            const categoryId = categoryMap.get(row.category.toLowerCase());

            if (!categoryId) {
                errors.push({
                    row: i + 2, // +2 because CSV row 1 is headers, and arrays are 0-indexed
                    error: `Category "${row.category}" not found`,
                });
                continue;
            }

            // Generate slug
            const slug = generateSlug(row.name);

            // Check if product with this slug already exists
            const [existing] = await db
                .select()
                .from(products)
                .where(eq(products.slug, slug))
                .limit(1);

            if (existing) {
                errors.push({
                    row: i + 2,
                    error: `Product with name "${row.name}" already exists`,
                });
                continue;
            }

            // Create product
            const [product] = await db
                .insert(products)
                .values({
                    vendorId,
                    name: row.name,
                    description: row.description,
                    slug,
                    price: row.price.toString(),
                    stock: row.stock,
                    categoryId,
                    tags: row.tags ? row.tags.split(",").map(t => t.trim()) : [],
                    brand: row.brand,
                    colors: row.colors ? row.colors.split(",").map(c => c.trim()) : [],
                    sizes: row.sizes ? row.sizes.split(",").map(s => s.trim()) : [],
                    materials: row.materials ? row.materials.split(",").map(m => m.trim()) : [],
                    weight: row.weight,
                    isActive: false, // Set to false by default for admin approval
                })
                .returning();

            created.push(product.id);
            imported++;
        } catch (error: any) {
            errors.push({
                row: i + 2,
                error: error.message || "Failed to create product",
            });
        }
    }

    return {
        success: errors.length === 0,
        imported,
        errors,
        created,
    };
}

/**
 * Helper: Escapes CSV field
 */
function escapeCsvField(field: string): string {
    if (field.includes(",") || field.includes('"') || field.includes("\n")) {
        return `"${field.replace(/"/g, '""')}"`;
    }
    return field;
}

/**
 * Helper: Parses a CSV line handling quoted fields
 */
function parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];

        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                current += '"';
                i++; // Skip next quote
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === "," && !inQuotes) {
            result.push(current.trim());
            current = "";
        } else {
            current += char;
        }
    }

    result.push(current.trim());
    return result;
}

/**
 * Helper: Generates a URL-friendly slug
 */
function generateSlug(name: string): string {
    return name
        .toLowerCase()
        .trim()
        .replace(/[áàäâ]/g, "a")
        .replace(/[éèëê]/g, "e")
        .replace(/[íìïî]/g, "i")
        .replace(/[óòöô]/g, "o")
        .replace(/[úùüû]/g, "u")
        .replace(/ñ/g, "n")
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
        + "-" + Math.random().toString(36).substring(2, 8); // Add random suffix to ensure uniqueness
}

