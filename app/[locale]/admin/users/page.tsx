"use client";

import { useState } from "react";
import { User, Mail, Calendar, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getAdminUsers } from "@/lib/actions/admin/users";
import { lockUserAccount, unlockUserAccount } from "@/lib/actions/auth";

type UserData = {
  id: string;
  name: string | null;
  email: string;
  createdAt: Date | null;
  orderCount: number;
  totalSpent: number;
  userType: string;
  lockedUntil?: Date | null;
};

export default function AdminUsersPage() {
  const t = useTranslations("Admin.usersPage");
  const [activeFilter, setActiveFilter] = useState<string>("all");

  const { data: userList = [], isLoading } = useQuery<UserData[]>({
    queryKey: ["admin", "users"],
    queryFn: getAdminUsers,
    staleTime: 60 * 1000,
  });

  const [lockingId, setLockingId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const filteredUsers = activeFilter === "all"
    ? userList
    : userList.filter(user => user.userType === activeFilter);

  const filterTabs = [
    { id: "all", label: t("filterAll"), count: userList.length },
    { id: "customer", label: t("filterCustomer"), count: userList.filter(u => u.userType === "customer").length },
    { id: "vendor", label: t("filterVendor"), count: userList.filter(u => u.userType === "vendor").length },
    { id: "admin", label: t("filterAdmin"), count: userList.filter(u => u.userType === "admin").length },
  ];

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-univers text-gray-900">{t("title")}</h1>
          <p className="text-sm text-gray-600 font-univers mt-1">
            {t("subtitle")}
          </p>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-univers text-gray-900">{t("title")}</h1>
        <p className="text-sm text-gray-600 font-univers mt-1">
          {t("subtitle")}
        </p>
      </div>

      {/* User type filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex flex-wrap gap-2 mb-4">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              onClick={() => setActiveFilter(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-univers transition-colors ${activeFilter === tab.id
                ? "bg-blue-100 text-blue-700 border border-blue-200"
                : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-sm font-univers text-gray-600">{t("totalUsers")}</p>
          <p className="text-2xl font-univers font-semibold text-gray-900">{filteredUsers.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-sm font-univers text-gray-600">{t("activeUsers")}</p>
          <p className="text-2xl font-univers font-semibold text-green-600">
            {filteredUsers.filter(u => u.orderCount > 0).length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-sm font-univers text-gray-600">{t("newThisMonth")}</p>
          <p className="text-2xl font-univers font-semibold text-blue-600">
            {filteredUsers.filter(u => u.createdAt && new Date(u.createdAt).getMonth() === new Date().getMonth()).length}
          </p>
        </div>
      </div>

      {/* Users table */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-univers font-medium text-gray-500 uppercase tracking-wider">
                  {t("tableHeaders.user")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-univers font-medium text-gray-500 uppercase tracking-wider">
                  {t("tableHeaders.email")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-univers font-medium text-gray-500 uppercase tracking-wider">
                  {t("tableHeaders.type")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-univers font-medium text-gray-500 uppercase tracking-wider">
                  {t("tableHeaders.status", { default: "Status" })}
                </th>
                <th className="px-6 py-3 text-left text-xs font-univers font-medium text-gray-500 uppercase tracking-wider">
                  {t("tableHeaders.orders")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-univers font-medium text-gray-500 uppercase tracking-wider">
                  {t("tableHeaders.totalSpent")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-univers font-medium text-gray-500 uppercase tracking-wider">
                  {t("tableHeaders.registered")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-univers font-medium text-gray-500 uppercase tracking-wider">
                  {t("tableHeaders.actions")}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <User className="h-5 w-5 text-gray-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-univers font-medium text-gray-900">
                          {user.name || t("noName")}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900 font-univers">
                      <Mail className="h-4 w-4 mr-2 text-gray-400" />
                      {user.email}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-univers ${user.userType === 'admin' ? 'bg-red-100 text-red-800' :
                      user.userType === 'vendor' ? 'bg-purple-100 text-purple-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                      {user.userType === 'admin' ? t("userTypes.admin") :
                        user.userType === 'vendor' ? t("userTypes.vendor") :
                          t("userTypes.customer")}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.lockedUntil && new Date(user.lockedUntil) > new Date() ? (
                      <span className="text-xs font-univers px-2 py-1 rounded bg-red-100 text-red-800">
                        {t("locked", { default: "Locked" })}
                      </span>
                    ) : (
                      <span className="text-xs font-univers px-2 py-1 rounded bg-green-100 text-green-800">
                        {t("active", { default: "Active" })}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900 font-univers">
                      <ShoppingCart className="h-4 w-4 mr-2 text-gray-400" />
                      {user.orderCount}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-univers font-medium text-gray-900">
                      ${Number(user.totalSpent).toLocaleString('es-MX')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900 font-univers">
                      <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString('es-MX') : 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Link href={`/admin/users/${user.id}`}>
                        <Button size="sm" variant="outline">
                          {t("viewDetails")}
                        </Button>
                      </Link>
                      {user.lockedUntil && new Date(user.lockedUntil) > new Date() ? (
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={lockingId === user.id}
                          onClick={async () => {
                            setLockingId(user.id);
                            try {
                              await unlockUserAccount(user.id, user.userType as any);
                              await queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
                            } finally {
                              setLockingId(null);
                            }
                          }}
                        >
                          {t("unlock", { default: "Unlock" })}
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={lockingId === user.id}
                          onClick={async () => {
                            setLockingId(user.id);
                            try {
                              await lockUserAccount(user.id, user.userType as any);
                              await queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
                            } finally {
                              setLockingId(null);
                            }
                          }}
                        >
                          {t("lock", { default: "Lock" })}
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}