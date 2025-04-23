"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  BookOpen,
  Home,
  Calendar,
  GraduationCap,
  User,
  LogOut,
  Menu,
  Bell,
} from "lucide-react";
import type { StudentUser } from "@/types";

import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface StudentNavbarProps {
  user: StudentUser;
}

const mainNavItems = [
  {
    title: "Inicio",
    href: "/dashboard",
    icon: <Home className="size-4" />,
  },
  {
    title: "Mis Materias",
    href: "/subjects",
    icon: <BookOpen className="size-4" />,
  },
  {
    title: "Tareas",
    href: "/homeworks",
    icon: <GraduationCap className="size-4" />,
  },
  {
    title: "Calendario",
    href: "/calendar",
    icon: <Calendar className="size-4" />,
  },
];

export function StudentNavbar({ user }: StudentNavbarProps) {
  const pathname = usePathname();
  const [notificationCount] = useState(3); // Ejemplo, se reemplazaría con datos reales

  // Generar las iniciales del nombre de usuario para el Avatar
  const initials =
    user.name
      ?.split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "ST";

  return (
    <header className="supports-backdrop-blur:bg-background/60 sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
      <div className="container flex h-14 items-center">
        {/* Logo y nombre - visible en todas las pantallas */}
        <div className="mr-4 flex">
          <Link href="/dashboard" className="flex items-center gap-2">
            <GraduationCap className="size-6" />
            <span className="font-semibold hidden sm:block">SaberPro</span>
          </Link>
        </div>

        {/* Menú de navegación principal - visible en pantallas MD+ */}
        <div className="hidden md:flex flex-1">
          <NavigationMenu>
            <NavigationMenuList>
              {mainNavItems.map((item) => (
                <NavigationMenuItem key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "group inline-flex h-9 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50",
                      pathname === item.href
                        ? "bg-accent text-accent-foreground"
                        : ""
                    )}
                  >
                    {item.icon}
                    <span className="ml-2">{item.title}</span>
                  </Link>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* Menú de usuario - visible en pantallas MD+ */}
        <div className="hidden md:flex items-center gap-2">
          {/* Notificaciones */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="size-5" />
                {notificationCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                    {notificationCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notificaciones</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="max-h-80 overflow-auto">
                {/* Aquí irían las notificaciones reales */}
                <div className="p-3 border-b">
                  <p className="text-sm font-medium">Nueva tarea asignada</p>
                  <p className="text-xs text-muted-foreground">
                    Se ha asignado la tarea "Ecuaciones diferenciales" en
                    Matemáticas.
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Hace 2 horas
                  </p>
                </div>
                <div className="p-3 border-b">
                  <p className="text-sm font-medium">Calificación publicada</p>
                  <p className="text-xs text-muted-foreground">
                    Se ha publicado tu calificación para "Programación web".
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Hace 1 día
                  </p>
                </div>
                <div className="p-3">
                  <p className="text-sm font-medium">Recordatorio de entrega</p>
                  <p className="text-xs text-muted-foreground">
                    La tarea "Análisis literario" vence mañana.
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Hace 3 días
                  </p>
                </div>
              </div>
              <DropdownMenuSeparator />
              <div className="p-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-center"
                >
                  Ver todas
                </Button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Perfil de usuario */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.image || ""} alt={user.name} />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile">
                  <User className="mr-2 size-4" />
                  Perfil
                </Link>
              </DropdownMenuItem>

              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="text-destructive focus:text-destructive"
              >
                <LogOut className="mr-2 size-4" />
                Cerrar Sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Menú móvil - visible en pantallas inferiores a MD */}
        <div className="flex md:hidden ml-auto">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="pr-0">
              <SheetHeader>
                <SheetTitle>Menú</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col py-6">
                <div className="flex items-center px-4 py-2 mb-6">
                  <Avatar className="h-10 w-10 mr-3">
                    <AvatarImage src={user.image || ""} alt={user.name} />
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </div>

                <nav className="flex flex-col gap-1 px-2">
                  {mainNavItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium",
                        pathname === item.href
                          ? "bg-accent text-accent-foreground"
                          : "hover:bg-accent hover:text-accent-foreground"
                      )}
                    >
                      {item.icon}
                      {item.title}
                    </Link>
                  ))}
                </nav>

                <div className="mt-auto px-4 py-2">
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={() => signOut({ callbackUrl: "/login" })}
                  >
                    <LogOut className="mr-2 size-4" />
                    Cerrar Sesión
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
