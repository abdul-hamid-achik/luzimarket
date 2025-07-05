import { db } from "@/db";
import { vendors, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { Check, X, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { approveVendor as approveVendorAction, rejectVendor as rejectVendorAction } from "@/lib/actions/admin/vendor";

async function getVendors() {
  const vendorList = await db
    .select({
      id: vendors.id,
      businessName: vendors.businessName,
      contactName: vendors.contactName,
      email: vendors.email,
      phone: vendors.phone,
      isActive: vendors.isActive,
      createdAt: vendors.createdAt,
    })
    .from(vendors)
    .orderBy(vendors.createdAt);

  return vendorList;
}

async function approveVendor(vendorId: string) {
  "use server";
  return approveVendorAction(vendorId);
}

async function rejectVendor(vendorId: string) {
  "use server";
  return rejectVendorAction(vendorId);
}

export default async function AdminVendorsPage() {
  const t = await getTranslations("Admin.vendorsPage");
  const vendorList = await getVendors();
  const pendingVendors = vendorList.filter(v => !v.isActive);
  const activeVendors = vendorList.filter(v => v.isActive);

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-univers text-gray-900">{t("title")}</h1>
        <p className="text-sm text-gray-600 font-univers mt-1">
          {t("subtitle")}
        </p>
      </div>

      {/* Pending approvals */}
      {pendingVendors.length > 0 && (
        <div>
          <h2 className="text-lg font-univers text-gray-900 mb-4">
            {t("vendorStatus.pending")} ({pendingVendors.length})
          </h2>
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-univers font-medium text-gray-500 uppercase tracking-wider">
                      {t("businessName")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-univers font-medium text-gray-500 uppercase tracking-wider">
                      {t("contactName")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-univers font-medium text-gray-500 uppercase tracking-wider">
                      {t("email")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-univers font-medium text-gray-500 uppercase tracking-wider">
                      {t("joined")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-univers font-medium text-gray-500 uppercase tracking-wider">
                      {t("actions")}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pendingVendors.map((vendor) => (
                    <tr key={vendor.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-univers font-medium text-gray-900">
                          {vendor.businessName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 font-univers">
                          {vendor.contactName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 font-univers">
                          {vendor.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 font-univers">
                          {new Date(vendor.createdAt!).toLocaleDateString('es-MX')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <form action={approveVendor.bind(null, vendor.id)}>
                            <Button
                              type="submit"
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              <Check className="h-4 w-4 mr-1" />
                              {t("activate")}
                            </Button>
                          </form>
                          <form action={rejectVendor.bind(null, vendor.id)}>
                            <Button
                              type="submit"
                              size="sm"
                              variant="outline"
                              className="border-red-300 text-red-600 hover:bg-red-50"
                            >
                              <X className="h-4 w-4 mr-1" />
                              {t("deactivate")}
                            </Button>
                          </form>
                          <Link href={`/admin/vendors/${vendor.id}`}>
                            <Button size="sm" variant="ghost">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Active vendors */}
      <div>
        <h2 className="text-lg font-univers text-gray-900 mb-4">
          {t("vendorStatus.active")} ({activeVendors.length})
        </h2>
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-univers font-medium text-gray-500 uppercase tracking-wider">
                    Negocio
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-univers font-medium text-gray-500 uppercase tracking-wider">
                    Contacto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-univers font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-univers font-medium text-gray-500 uppercase tracking-wider">
                    {t("phone")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-univers font-medium text-gray-500 uppercase tracking-wider">
                    {t("status")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-univers font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {activeVendors.map((vendor) => (
                  <tr key={vendor.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-univers font-medium text-gray-900">
                        {vendor.businessName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 font-univers">
                        {vendor.contactName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 font-univers">
                        {vendor.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 font-univers">
                        {vendor.phone}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-univers bg-green-100 text-green-800">
                        <span className="mr-1.5 h-2 w-2 rounded-full bg-green-400" />
                        {t("vendorStatus.active")}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Link href={`/admin/vendors/${vendor.id}`}>
                          <Button size="sm" variant="ghost">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <form action={rejectVendor.bind(null, vendor.id)}>
                          <Button
                            type="submit"
                            size="sm"
                            variant="ghost"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}