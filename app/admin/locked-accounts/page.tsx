"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Lock, Unlock, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { getLockedAccounts, unlockUserAccount } from "@/lib/actions/auth";

interface LockedAccount {
  id: string;
  email: string;
  name: string;
  lockedUntil: Date | null;
  failedLoginAttempts: number | null;
  lastFailedLoginAt: Date | null;
}

export default function LockedAccountsPage() {
  const [lockedAccounts, setLockedAccounts] = useState<{
    customers: LockedAccount[];
    vendors: LockedAccount[];
    admins: LockedAccount[];
  }>({ customers: [], vendors: [], admins: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [unlockingId, setUnlockingId] = useState<string | null>(null);

  useEffect(() => {
    loadLockedAccounts();
  }, []);

  const loadLockedAccounts = async () => {
    setIsLoading(true);
    try {
      const accounts = await getLockedAccounts();
      // Filter out any accounts with null values since they shouldn't be locked
      setLockedAccounts({
        customers: accounts.customers.filter(a => a.lockedUntil && a.failedLoginAttempts && a.lastFailedLoginAt) as LockedAccount[],
        vendors: accounts.vendors.filter(a => a.lockedUntil && a.failedLoginAttempts && a.lastFailedLoginAt) as LockedAccount[],
        admins: accounts.admins.filter(a => a.lockedUntil && a.failedLoginAttempts && a.lastFailedLoginAt) as LockedAccount[],
      });
    } catch (error) {
      console.error("Error loading locked accounts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnlock = async (userId: string, userType: "customer" | "vendor" | "admin") => {
    setUnlockingId(userId);
    try {
      const result = await unlockUserAccount(userId, userType);
      if (result.success) {
        // Reload the accounts list
        await loadLockedAccounts();
      }
    } catch (error) {
      console.error("Error unlocking account:", error);
    } finally {
      setUnlockingId(null);
    }
  };

  const renderAccountsTable = (accounts: LockedAccount[], userType: "customer" | "vendor" | "admin") => {
    if (accounts.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          No hay cuentas bloqueadas en esta categoría
        </div>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead>Intentos fallidos</TableHead>
            <TableHead>Último intento</TableHead>
            <TableHead>Bloqueado hasta</TableHead>
            <TableHead>Tiempo restante</TableHead>
            <TableHead>Acción</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {accounts.map((account) => {
            const now = new Date();
            const lockedUntil = account.lockedUntil ? new Date(account.lockedUntil) : now;
            const minutesRemaining = account.lockedUntil ? Math.max(0, Math.ceil((lockedUntil.getTime() - now.getTime()) / (1000 * 60))) : 0;

            return (
              <TableRow key={account.id}>
                <TableCell className="font-medium">{account.email}</TableCell>
                <TableCell>{account.name}</TableCell>
                <TableCell>
                  <Badge variant="destructive">{account.failedLoginAttempts || 0}</Badge>
                </TableCell>
                <TableCell>
                  {account.lastFailedLoginAt ? format(new Date(account.lastFailedLoginAt), "dd/MM/yyyy HH:mm", { locale: es }) : '-'}
                </TableCell>
                <TableCell>
                  {format(lockedUntil, "dd/MM/yyyy HH:mm", { locale: es })}
                </TableCell>
                <TableCell>
                  {minutesRemaining > 0 ? (
                    <span className="text-red-600 font-medium">{minutesRemaining} min</span>
                  ) : (
                    <span className="text-green-600">Expirado</span>
                  )}
                </TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    onClick={() => handleUnlock(account.id, userType)}
                    disabled={unlockingId === account.id}
                  >
                    {unlockingId === account.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Unlock className="h-4 w-4" />
                    )}
                    <span className="ml-2">Desbloquear</span>
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    );
  };

  const totalLocked = 
    lockedAccounts.customers.length + 
    lockedAccounts.vendors.length + 
    lockedAccounts.admins.length;

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-times-now mb-2">Cuentas Bloqueadas</h1>
          <p className="text-gray-600 font-univers">
            Gestionar cuentas bloqueadas por intentos fallidos de inicio de sesión
          </p>
        </div>
        <Button onClick={loadLockedAccounts} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bloqueadas</CardTitle>
            <Lock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLocked}</div>
            <p className="text-xs text-muted-foreground">
              Cuentas actualmente bloqueadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Umbral de bloqueo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5 intentos</div>
            <p className="text-xs text-muted-foreground">
              En ventana de 15 minutos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Duración del bloqueo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">30 minutos</div>
            <p className="text-xs text-muted-foreground">
              Desbloqueo automático
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <Tabs defaultValue="customers">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="customers">
                  Clientes ({lockedAccounts.customers.length})
                </TabsTrigger>
                <TabsTrigger value="vendors">
                  Vendedores ({lockedAccounts.vendors.length})
                </TabsTrigger>
                <TabsTrigger value="admins">
                  Administradores ({lockedAccounts.admins.length})
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="customers" className="mt-4">
                {renderAccountsTable(lockedAccounts.customers, "customer")}
              </TabsContent>
              
              <TabsContent value="vendors" className="mt-4">
                {renderAccountsTable(lockedAccounts.vendors, "vendor")}
              </TabsContent>
              
              <TabsContent value="admins" className="mt-4">
                {renderAccountsTable(lockedAccounts.admins, "admin")}
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
}