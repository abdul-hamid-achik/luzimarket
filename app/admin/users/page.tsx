import { db } from "@/db";
import { users, orders } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { User, Mail, Calendar, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

async function getUsers() {
  const userList = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      createdAt: users.createdAt,
      orderCount: sql<number>`(
        SELECT COUNT(*) FROM ${orders}
        WHERE ${orders.userId} = ${users.id}
      )`,
      totalSpent: sql<number>`(
        SELECT COALESCE(SUM(${orders.total}::numeric), 0) FROM ${orders}
        WHERE ${orders.userId} = ${users.id}
        AND ${orders.paymentStatus} = 'succeeded'
      )`,
    })
    .from(users)
    .orderBy(desc(users.createdAt));

  return userList;
}

export default async function AdminUsersPage() {
  const userList = await getUsers();


  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-univers text-gray-900">Usuarios</h1>
        <p className="text-sm text-gray-600 font-univers mt-1">
          Administra todos los usuarios de la plataforma
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-sm font-univers text-gray-600">Total usuarios</p>
          <p className="text-2xl font-univers font-semibold text-gray-900">{userList.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-sm font-univers text-gray-600">Usuarios activos</p>
          <p className="text-2xl font-univers font-semibold text-green-600">
            {userList.filter(u => u.orderCount > 0).length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-sm font-univers text-gray-600">Nuevos este mes</p>
          <p className="text-2xl font-univers font-semibold text-blue-600">
            {userList.filter(u => u.createdAt && new Date(u.createdAt).getMonth() === new Date().getMonth()).length}
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
                  Usuario
                </th>
                <th className="px-6 py-3 text-left text-xs font-univers font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-univers font-medium text-gray-500 uppercase tracking-wider">
                  Órdenes
                </th>
                <th className="px-6 py-3 text-left text-xs font-univers font-medium text-gray-500 uppercase tracking-wider">
                  Total gastado
                </th>
                <th className="px-6 py-3 text-left text-xs font-univers font-medium text-gray-500 uppercase tracking-wider">
                  Registro
                </th>
                <th className="px-6 py-3 text-left text-xs font-univers font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {userList.map((user) => (
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
                          {user.name || 'Sin nombre'}
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
                      {new Date(user.createdAt!).toLocaleDateString('es-MX')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Link href={`/admin/users/${user.id}`}>
                        <Button size="sm" variant="outline">
                          Ver detalles
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
  );
}