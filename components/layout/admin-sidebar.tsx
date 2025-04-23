"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { signOut } from "next-auth/react";
import {
  LucideIcon,
  Home,
  BookOpen,
  GraduationCap,
  Users,
  Settings,
  LogOut,
  School,
  BarChart,
  Bell,
  CircleUser,
} from "lucide-react";
import type { AdminUser } from "@/types";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { notificationService } from "@/services/notifications/service";

interface AdminSidebarProps {
  user: AdminUser;
}

interface SidebarItemProps {
  icon: LucideIcon;
  label: string;
  href: string;
  isActive?: boolean;
  badge?: number;
  badgeVariant?: "primary" | "secondary" | "destructive";
}

export function AdminSidebar({ user }: AdminSidebarProps) {
  const pathname = usePathname();
  const [pendingNotifications, setPendingNotifications] = useState<number>(0);

  // Fetch notification count on component mount
  useEffect(() => {
    const fetchNotificationCount = async () => {
      try {
        const notifications = await notificationService.getNotifications();
        const unreadCount = notifications.filter((n) => !n.isRead).length;
        setPendingNotifications(unreadCount);
      } catch (error) {
        console.error("Failed to fetch notification count:", error);
      }
    };

    fetchNotificationCount();
  }, []);

  // Generar iniciales para el avatar
  const initials =
    user.name
      ?.split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "AD";

  const isSuperAdmin = user.role === "SUPERADMIN";

  // Elementos de navegación
  const mainItems: SidebarItemProps[] = [
    {
      icon: Home,
      label: "Dashboard",
      href: "/admin",
      isActive: pathname === "/admin",
    },
    {
      icon: Users,
      label: "Usuarios",
      href: "/admin/users",
      isActive: pathname.startsWith("/admin/users"),
    },
    {
      icon: School,
      label: "Profesores",
      href: "/admin/teachers",
      isActive: pathname.startsWith("/admin/teachers"),
    },
    {
      icon: GraduationCap,
      label: "Estudiantes",
      href: "/admin/students",
      isActive: pathname.startsWith("/admin/students"),
    },
    {
      icon: BookOpen,
      label: "Materias",
      href: "/admin/subjects",
      isActive: pathname.startsWith("/admin/subjects"),
    },
    // {
    //   icon: BarChart,
    //   label: "Reportes",
    //   href: "/admin/reports",
    //   isActive: pathname.startsWith("/admin/reports"),
    // },
  ];

  // const secondaryItems: SidebarItemProps[] = [
  //   // {
  //   //   icon: Bell,
  //   //   label: "Notificaciones",
  //   //   href: "/admin/notifications",
  //   //   isActive: pathname.startsWith("/admin/notifications"),
  //   //   badge: pendingNotifications,
  //   //   badgeVariant: "secondary",
  //   // },
  //   {
  //     icon: CircleUser,
  //     label: "Mi Perfil",
  //     href: "/admin/profile",
  //     isActive: pathname.startsWith("/admin/profile"),
  //   },
  //   {
  //     icon: Settings,
  //     label: "Configuración",
  //     href: "/admin/settings",
  //     isActive: pathname.startsWith("/admin/settings"),
  //   },
  // ];

  return (
    <Sidebar side="left" variant="sidebar">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2">
          <School className="size-6 text-primary" />
          <span className="font-semibold text-lg">SaberPro</span>
          {isSuperAdmin && (
            <Badge variant="secondary" className="ml-1 text-xs h-5">
              SuperAdmin
            </Badge>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <div className="flex items-center gap-3 px-4 py-2">
              <Avatar>
                <AvatarImage src={user.image || ""} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="truncate">
                <p className="text-sm font-medium truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {user.email}
                </p>
              </div>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Administración</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={item.isActive}
                    tooltip={item.label}
                  >
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.label}</span>
                      {item.badge !== undefined && item.badge > 0 && (
                        <SidebarBadge
                          count={item.badge}
                          variant={item.badgeVariant || "primary"}
                        />
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* <SidebarGroup>
          <SidebarGroupLabel>Cuenta</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {secondaryItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={item.isActive}
                    tooltip={item.label}
                  >
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.label}</span>
                      {item.badge !== undefined && item.badge > 0 && (
                        <SidebarBadge
                          count={item.badge}
                          variant={item.badgeVariant || "primary"}
                        />
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup> */}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Cerrar Sesión"
              variant="outline"
              className="cursor-pointer"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut />

              <span>Cerrar Sesión</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

// Componente de badge para el sidebar
function SidebarBadge({
  count,
  variant = "primary",
}: {
  count: number;
  variant?: "primary" | "secondary" | "destructive";
}) {
  if (count <= 0) return null;

  let badgeClass = "bg-primary/10 text-primary";
  if (variant === "secondary")
    badgeClass = "bg-secondary/10 text-secondary-foreground";
  if (variant === "destructive")
    badgeClass = "bg-destructive/10 text-destructive";

  return (
    <span
      className={`ml-auto flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs font-medium ${badgeClass}`}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}
