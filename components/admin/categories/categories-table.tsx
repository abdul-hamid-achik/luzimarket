"use client";

import { useState } from "react";
import Image from "next/image";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { CategoryDialog } from "./category-dialog";
import { DeleteCategoryDialog } from "./delete-category-dialog";
import { toast } from "sonner";

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  isActive: boolean;
  displayOrder: number;
  productCount?: number;
}

interface CategoriesTableProps {
  categories: Category[];
}

export function CategoriesTable({ categories }: CategoriesTableProps) {
  const t = useTranslations("Admin.categories");
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const handleEdit = (category: Category) => {
    setSelectedCategory(category);
    setIsEditOpen(true);
  };

  const handleDelete = (category: Category) => {
    setSelectedCategory(category);
    setIsDeleteOpen(true);
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-times-now">{t("title")}</h1>
        <Button 
          onClick={() => setIsCreateOpen(true)}
          className="bg-black text-white hover:bg-gray-800"
        >
          <Plus className="h-4 w-4 mr-2" />
          {t("createNew")}
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">{t("image")}</TableHead>
              <TableHead>{t("categoryName")}</TableHead>
              <TableHead>{t("slug")}</TableHead>
              <TableHead>{t("products")}</TableHead>
              <TableHead>{t("order")}</TableHead>
              <TableHead>{t("status")}</TableHead>
              <TableHead className="text-right">{t("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((category) => (
              <TableRow key={category.id}>
                <TableCell>
                  <div className="relative w-12 h-12 bg-gray-100 rounded overflow-hidden">
                    <Image
                      src={category.imageUrl || "/images/placeholder.jpg"}
                      alt={category.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                </TableCell>
                <TableCell className="font-medium">{category.name}</TableCell>
                <TableCell className="text-gray-600">{category.slug}</TableCell>
                <TableCell>{category.productCount || 0}</TableCell>
                <TableCell>{category.displayOrder}</TableCell>
                <TableCell>
                  <Badge 
                    variant={category.isActive ? "default" : "secondary"}
                    className={category.isActive ? "bg-green-50 text-green-700" : ""}
                  >
                    {category.isActive ? t("active") : t("inactive")}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleEdit(category)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleDelete(category)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <CategoryDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        mode="create"
      />

      {selectedCategory && (
        <>
          <CategoryDialog
            open={isEditOpen}
            onOpenChange={setIsEditOpen}
            mode="edit"
            category={selectedCategory}
          />

          <DeleteCategoryDialog
            open={isDeleteOpen}
            onOpenChange={setIsDeleteOpen}
            category={selectedCategory}
          />
        </>
      )}
    </>
  );
}