"use client";

import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Store,
  Users,
  ShoppingCart,
  Mail,
  Settings,
  Lock,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  Globe,
  ImageIcon
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { LogoutButton } from "@/components/admin/logout-button";
import { useTranslations } from "next-intl";
import LanguageSwitcher from "@/components/layout/language-switcher";

interface AdminSidebarProps {
  userEmail?: string;
}

export function AdminSidebar({ userEmail }: AdminSidebarProps) {
  const pathname = usePathname();
  const t = useTranslations("Admin");
  const { state, toggleSidebar } = useSidebar();

  const menuItems = [
    {
      title: t("dashboard"),
      href: "/admin",
      icon: LayoutDashboard,
    },
    {
      title: t("orders"),
      href: "/admin/orders",
      icon: ShoppingCart,
    },
    {
      title: t("products"),
      href: "/admin/products",
      icon: Package,
    },
    {
      title: t("imageModeration.title"),
      href: "/admin/moderation/images",
      icon: ImageIcon,
    },
    {
      title: t("vendors"),
      href: "/admin/vendors",
      icon: Store,
    },
    {
      title: t("users"),
      href: "/admin/users",
      icon: Users,
    },
    {
      title: t("financials"),
      href: "/admin/financials",
      icon: DollarSign,
    },
    {
      title: t("categories.title"),
      href: "/admin/categories",
      icon: Package,
    },
    {
      title: t("lockedAccounts.title"),
      href: "/admin/locked-accounts",
      icon: Lock,
    },
    {
      title: t("emails"),
      href: "/admin/email-templates",
      icon: Mail,
    },
    {
      title: t("settings"),
      href: "/admin/settings",
      icon: Settings,
    },
  ];

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-gray-200">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <Image
              src="/images/logos/logo-operations.png"
              alt="Luzimarket Operations"
              width={150}
              height={40}
              className={`transition-all duration-200 object-contain ${state === "collapsed" ? "h-8 w-auto max-w-[100px]" : "h-10 w-auto max-w-[150px]"
                }`}
              priority
            />
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="ml-auto"
          >
            {state === "collapsed" ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive = pathname === item.href ||
                  (item.href !== "/admin" && pathname.startsWith(item.href));

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link href={item.href}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-gray-200">
        <div className="p-2 space-y-2">
          <div className="flex items-center gap-2 px-2">
            <LanguageSwitcher />
          </div>
          {userEmail && state !== "collapsed" && (
            <p className="text-xs text-gray-600 px-2">{userEmail}</p>
          )}
          <LogoutButton />
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}