"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/es/login");
  };

  return (
    <button 
      onClick={handleLogout}
      className="flex items-center gap-3 px-3 py-2 w-full text-sm font-univers text-red-600 rounded-md hover:bg-red-50 transition-colors"
      data-testid="logout-button"
    >
      <LogOut className="h-4 w-4" />
      Cerrar Sesión
    </button>
  );
}