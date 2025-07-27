import { getTranslations } from "next-intl/server";
import { AdminHeader } from "@/components/admin/admin-header";
import { ImageModerationClient } from "./image-moderation-client";
import { getPendingImages, getModeratedImages, getModerationStats } from "@/lib/actions/image-moderation";

export default async function ImageModerationPage() {
  const t = await getTranslations("Admin.imageModeration");
  
  // Fetch initial data
  const [pendingResult, approvedResult, rejectedResult, statsResult] = await Promise.all([
    getPendingImages(),
    getModeratedImages("approved"),
    getModeratedImages("rejected"),
    getModerationStats(),
  ]);

  return (
    <div className="space-y-6">
      <AdminHeader 
        title={t("title")} 
        subtitle={t("subtitle")} 
      />

      <ImageModerationClient
        initialPendingImages={pendingResult.success ? pendingResult.data : []}
        initialApprovedImages={approvedResult.success ? approvedResult.data : []}
        initialRejectedImages={rejectedResult.success ? rejectedResult.data : []}
        stats={statsResult.success ? statsResult.data : { pending: 0, approved: 0, rejected: 0 }}
      />
    </div>
  );
}