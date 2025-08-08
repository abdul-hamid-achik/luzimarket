"use client";

import { Link, usePathname, getPathname } from "@/i18n/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  BarChart3,
  Settings,
  Store,
  CreditCard,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  Globe
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
import { useTranslations } from "next-intl";
import LanguageSwitcher from "@/components/layout/language-switcher";

interface VendorSidebarProps {
  userEmail?: string;
  vendorName?: string;
}

export function VendorSidebar({ userEmail, vendorName }: VendorSidebarProps) {
  const pathname = usePathname();
  const t = useTranslations("vendor.layout");
  const { state, toggleSidebar } = useSidebar();

  const menuItems = [
    {
      title: t("dashboard"),
      href: "/vendor/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: t("products"),
      href: "/vendor/products",
      icon: Package,
    },
    {
      title: t("orders"),
      href: "/vendor/orders",
      icon: ShoppingCart,
    },
    {
      title: t("analytics"),
      href: "/vendor/analytics",
      icon: BarChart3,
    },
    {
      title: t("financials"),
      href: "/vendor/financials",
      icon: DollarSign,
    },
    {
      title: t("payments"),
      href: "/vendor/stripe-onboarding",
      icon: CreditCard,
    },
    {
      title: t("settings"),
      href: "/vendor/settings",
      icon: Settings,
    },
  ];

  const localizedMenuItems = menuItems.map((item) => ({
    ...item,
    href: getPathname({ href: item.href }),
  }));

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-gray-200">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center ${state === "collapsed" ? "" : "flex-shrink-0"}`}>
              <Store className="h-5 w-5 text-gray-600" />
            </div>
            {state !== "collapsed" && (
              <div>
                <p className="text-sm font-univers font-medium text-gray-900">{t("vendorPanel")}</p>
                {vendorName && <p className="text-xs text-gray-600">{vendorName}</p>}
              </div>
            )}
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
              {localizedMenuItems.map((item) => {
                const isActive = pathname === item.href ||
                  (item.href !== "/vendor/dashboard" && pathname.startsWith(item.href));

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
            <Globe className="h-4 w-4 text-gray-500" />
            <LanguageSwitcher />
          </div>
          {userEmail && state !== "collapsed" && (
            <p className="text-xs text-gray-600 px-2">{userEmail}</p>
          )}
          <form action="/api/auth/signout" method="POST">
            <Button
              type="submit"
              variant="ghost"
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              {state !== "collapsed" && t("logout")}
            </Button>
          </form>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}