"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { signOut } from "next-auth/react";
import {
  LucideIcon,
  Home,
  BookOpen,
  GraduationCap,
  Users,
  FileText,
  Bell,
  Settings,
  LogOut,
  ClipboardList,
  CircleUser,
} from "lucide-react";

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

interface TeacherSidebarProps {
  user?: {
    name: string;
    email: string;
    image?: string;
  };
  pendingNotifications?: number;
  pendingSubmissions?: number;
  pendingEnrollments?: number;
}

interface SidebarItemProps {
  icon: LucideIcon;
  label: string;
  href: string;
  isActive?: boolean;
  badge?: number;
  badgeVariant?: "primary" | "secondary" | "destructive";
}

export function TeacherSidebar({
  user = { name: "Profesor", email: "profesor@saberpro.com" },
  pendingNotifications = 3,
  pendingSubmissions = 5,
  pendingEnrollments = 2,
}: TeacherSidebarProps) {
  const pathname = usePathname();

  // Generar iniciales para el avatar
  const initials =
    user.name
      ?.split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "PR";

  // Elementos de navegación
  const mainItems: SidebarItemProps[] = [
    {
      icon: Home,
      label: "Dashboard",
      href: "/dashboard",
      isActive: pathname === "/dashboard",
    },
    {
      icon: BookOpen,
      label: "Mis Materias",
      href: "/teacher/subjects",
      isActive: pathname.startsWith("/teacher/subjects"),
    },
    {
      icon: GraduationCap,
      label: "Entregas y Calificaciones",
      href: "/teacher/submissions",
      isActive: pathname.startsWith("/teacher/submissions"),
      badge: pendingSubmissions,
      badgeVariant: "primary",
    },
    {
      icon: FileText,
      label: "Tareas",
      href: "/teacher/homeworks",
      isActive: pathname.startsWith("/teacher/homeworks"),
    },
    {
      icon: Users,
      label: "Estudiantes",
      href: "/teacher/students",
      isActive: pathname.startsWith("/teacher/students"),
    },
    {
      icon: ClipboardList,
      label: "Solicitudes de Inscripción",
      href: "/teacher/enrollments",
      isActive: pathname.startsWith("/teacher/enrollments"),
      badge: pendingEnrollments,
      badgeVariant: "destructive",
    },
  ];

  const secondaryItems: SidebarItemProps[] = [
    {
      icon: Bell,
      label: "Notificaciones",
      href: "/teacher/notifications",
      isActive: pathname.startsWith("/teacher/notifications"),
      badge: pendingNotifications,
      badgeVariant: "secondary",
    },
    {
      icon: CircleUser,
      label: "Mi Perfil",
      href: "/teacher/profile",
      isActive: pathname.startsWith("/teacher/profile"),
    },
    {
      icon: Settings,
      label: "Configuración",
      href: "/teacher/settings",
      isActive: pathname.startsWith("/teacher/settings"),
    },
  ];

  return (
    <Sidebar side="left" variant="sidebar">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2">
          <GraduationCap className="size-6 text-primary" />
          <span className="font-semibold text-lg">SaberPro</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <div className="flex items-center gap-3 px-4 py-2">
              <Avatar>
                <AvatarImage src={user.image} />
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
          <SidebarGroupLabel>Principal</SidebarGroupLabel>
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
                      {item.badge && (
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

        <SidebarGroup>
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
                      {item.badge && (
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
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              tooltip="Cerrar Sesión"
              variant="outline"
            >
              <button onClick={() => signOut({ callbackUrl: "/login" })}>
                <LogOut />
                <span>Cerrar Sesión</span>
              </button>
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
