"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Eye, Check, X, Image as ImageIcon, Loader2 } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { approveImages, rejectImages } from "@/lib/actions/image-moderation";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface ImageModerationClientProps {
  initialPendingImages: any[];
  initialApprovedImages: any[];
  initialRejectedImages: any[];
  stats: {
    pending: number;
    approved: number;
    rejected: number;
  };
}

export function ImageModerationClient({
  initialPendingImages,
  initialApprovedImages,
  initialRejectedImages,
  stats,
}: ImageModerationClientProps) {
  const t = useTranslations("Admin.imageModeration");
  const [pendingImages, setPendingImages] = useState(initialPendingImages);
  const [approvedImages, setApprovedImages] = useState(initialApprovedImages);
  const [rejectedImages, setRejectedImages] = useState(initialRejectedImages);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionCategory, setRejectionCategory] = useState<string>("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectionNotes, setRejectionNotes] = useState("");
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Toggle image selection
  const toggleImageSelection = (imageId: string) => {
    setSelectedImages(prev =>
      prev.includes(imageId)
        ? prev.filter(id => id !== imageId)
        : [...prev, imageId]
    );
  };

  // Select/deselect all images
  const toggleSelectAll = () => {
    if (selectedImages.length === pendingImages.length) {
      setSelectedImages([]);
    } else {
      setSelectedImages(pendingImages.map(img => img.id));
    }
  };

  // Handle approval
  const handleApprove = async () => {
    if (selectedImages.length === 0) return;

    const confirmMessage = t("confirmApproval", { count: selectedImages.length });
    if (!confirm(confirmMessage)) return;

    setIsApproving(true);
    try {
      const result = await approveImages({ imageIds: selectedImages });
      
      if (result.success) {
        // Move approved images from pending to approved
        const approvedItems = pendingImages.filter(img => selectedImages.includes(img.id));
        setPendingImages(prev => prev.filter(img => !selectedImages.includes(img.id)));
        setApprovedImages(prev => [...approvedItems.map(img => ({ ...img, status: "approved", reviewedAt: new Date() })), ...prev]);
        setSelectedImages([]);
        toast.success(result.message);
      } else {
        toast.error(result.error || "Error al aprobar imágenes");
      }
    } catch (error) {
      toast.error("Error al aprobar imágenes");
    } finally {
      setIsApproving(false);
    }
  };

  // Handle rejection
  const handleReject = async () => {
    if (!rejectionCategory || !rejectionReason) {
      toast.error("Por favor completa todos los campos requeridos");
      return;
    }

    setIsRejecting(true);
    try {
      const result = await rejectImages({
        imageIds: selectedImages,
        reason: rejectionReason,
        category: rejectionCategory as any,
        notes: rejectionNotes,
      });
      
      if (result.success) {
        // Move rejected images from pending to rejected
        const rejectedItems = pendingImages.filter(img => selectedImages.includes(img.id));
        setPendingImages(prev => prev.filter(img => !selectedImages.includes(img.id)));
        setRejectedImages(prev => [
          ...rejectedItems.map(img => ({
            ...img,
            status: "rejected",
            reviewedAt: new Date(),
            rejectionReason,
            rejectionCategory,
            notes: rejectionNotes,
          })),
          ...prev,
        ]);
        setSelectedImages([]);
        setShowRejectDialog(false);
        setRejectionCategory("");
        setRejectionReason("");
        setRejectionNotes("");
        toast.success(result.message);
      } else {
        toast.error(result.error || "Error al rechazar imágenes");
      }
    } catch (error) {
      toast.error("Error al rechazar imágenes");
    } finally {
      setIsRejecting(false);
    }
  };

  // Image card component
  const ImageCard = ({ image, showActions = false }: { image: any; showActions?: boolean }) => (
    <Card className="overflow-hidden">
      <div className="relative aspect-square bg-gray-100">
        <Image
          src={image.imageUrl}
          alt={image.product?.name || "Product image"}
          fill
          className="object-cover"
        />
        {showActions && (
          <div className="absolute top-2 left-2">
            <Checkbox
              checked={selectedImages.includes(image.id)}
              onCheckedChange={() => toggleImageSelection(image.id)}
              className="bg-white"
            />
          </div>
        )}
        <Button
          variant="secondary"
          size="icon"
          className="absolute bottom-2 right-2"
          onClick={() => setPreviewImage(image.imageUrl)}
        >
          <Eye className="h-4 w-4" />
        </Button>
      </div>
      <CardContent className="p-4 space-y-2">
        <div>
          <p className="font-medium text-sm truncate">{image.product?.name}</p>
          <p className="text-xs text-gray-600">{image.vendor?.businessName}</p>
        </div>
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{t("uploadedAt")}</span>
          <span>
            {formatDistanceToNow(new Date(image.createdAt), {
              addSuffix: true,
              locale: es,
            })}
          </span>
        </div>
        {image.rejectionReason && (
          <div className="pt-2 border-t">
            <p className="text-xs text-red-600 font-medium">{t("rejectionReason")}</p>
            <p className="text-xs text-gray-600">{image.rejectionReason}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">{t("pending")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{pendingImages.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">{t("approved")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{approvedImages.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">{t("rejected")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{rejectedImages.length}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending" className="flex items-center gap-2">
            {t("pending")}
            {pendingImages.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {pendingImages.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved" className="flex items-center gap-2">
            {t("approved")}
          </TabsTrigger>
          <TabsTrigger value="rejected" className="flex items-center gap-2">
            {t("rejected")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingImages.length > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleSelectAll}
                >
                  {selectedImages.length === pendingImages.length
                    ? t("deselectAll")
                    : t("selectAll")}
                </Button>
                <span className="text-sm text-gray-600">
                  {selectedImages.length} seleccionadas
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleApprove}
                  disabled={selectedImages.length === 0 || isApproving}
                >
                  {isApproving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  <Check className="h-4 w-4 mr-2" />
                  {t("approveSelected")}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowRejectDialog(true)}
                  disabled={selectedImages.length === 0}
                >
                  <X className="h-4 w-4 mr-2" />
                  {t("rejectSelected")}
                </Button>
              </div>
            </div>
          )}

          {pendingImages.length === 0 ? (
            <Card className="p-8 text-center">
              <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">{t("noImages")}</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {pendingImages.map(image => (
                <ImageCard key={image.id} image={image} showActions />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          {approvedImages.length === 0 ? (
            <Card className="p-8 text-center">
              <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No hay imágenes aprobadas</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {approvedImages.map(image => (
                <ImageCard key={image.id} image={image} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="rejected" className="space-y-4">
          {rejectedImages.length === 0 ? (
            <Card className="p-8 text-center">
              <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No hay imágenes rechazadas</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {rejectedImages.map(image => (
                <ImageCard key={image.id} image={image} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("reject")} {selectedImages.length} imágenes</DialogTitle>
            <DialogDescription>
              {t("provideReason")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="category">{t("rejectionCategory")}</Label>
              <Select value={rejectionCategory} onValueChange={setRejectionCategory}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="quality">{t("rejectionCategories.quality")}</SelectItem>
                  <SelectItem value="inappropriate">{t("rejectionCategories.inappropriate")}</SelectItem>
                  <SelectItem value="copyright">{t("rejectionCategories.copyright")}</SelectItem>
                  <SelectItem value="misleading">{t("rejectionCategories.misleading")}</SelectItem>
                  <SelectItem value="other">{t("rejectionCategories.other")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="reason">{t("rejectionReason")}</Label>
              <Textarea
                id="reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Explica la razón del rechazo..."
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="notes">{t("additionalNotes")}</Label>
              <Textarea
                id="notes"
                value={rejectionNotes}
                onChange={(e) => setRejectionNotes(e.target.value)}
                placeholder="Notas adicionales..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={isRejecting || !rejectionCategory || !rejectionReason}
            >
              {isRejecting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Rechazar imágenes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Preview Dialog */}
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{t("viewFullSize")}</DialogTitle>
          </DialogHeader>
          {previewImage && (
            <div className="relative aspect-square w-full">
              <Image
                src={previewImage}
                alt="Full size preview"
                fill
                className="object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}