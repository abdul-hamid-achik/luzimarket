import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getTranslations } from "next-intl/server";
import { AdminFinancialReports } from "./admin-financial-reports";

export default async function AdminFinancialReportsPage() {
  const session = await auth();
  
  if (!session || session.user.role !== "admin") {
    redirect("/login");
  }

  const t = await getTranslations("admin.financials.reports");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-times-now text-3xl">{t("title")}</h1>
        <p className="text-muted-foreground mt-2">{t("description")}</p>
      </div>

      <AdminFinancialReports />
    </div>
  );
}