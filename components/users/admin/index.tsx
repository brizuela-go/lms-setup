"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import debounce from "lodash/debounce";
import {
  CircleUser,
  Search,
  Filter,
  PlusCircle,
  Trash2,
  Edit,
  MoreHorizontal,
  Loader2,
  ArrowUpDown,
  X,
  Shield,
  ShieldAlert,
  GraduationCap,
  School,
  Power,
  KeyRound,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

// Tipos
interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
  image: string | null;
  createdAt: string;
  student: {
    id: string;
    studentId: string;
    isActivated: boolean;
  } | null;
  teacher: {
    id: string;
    department: string | null;
  } | null;
  admin: {
    id: string;
    isSuperAdmin: boolean;
  } | null;
}

interface UsersClientProps {
  initialUsers: User[];
}

export default function UsersClient({ initialUsers }: UsersClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Estados
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [filteredUsers, setFilteredUsers] = useState<User[]>(initialUsers);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [roleFilter, setRoleFilter] = useState(
    searchParams.get("role") || "all"
  );
  const [sortBy, setSortBy] = useState(searchParams.get("sort") || "name-asc");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const currentItems = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Actualizar URL con filtros
  const updateUrlParams = useCallback(
    debounce((query: string, role: string, sort: string) => {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      if (role !== "all") params.set("role", role);
      if (sort !== "name-asc") params.set("sort", sort);

      const newUrl =
        window.location.pathname +
        (params.toString() ? `?${params.toString()}` : "");

      window.history.replaceState({ path: newUrl }, "", newUrl);
    }, 300),
    []
  );

  // Aplicar filtros y ordenación
  useEffect(() => {
    setIsLoading(true);

    let result = [...users];

    // Filtrar por búsqueda
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (user) =>
          user.name?.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query) ||
          (user.student?.studentId &&
            user.student.studentId.toLowerCase().includes(query))
      );
    }

    // Filtrar por rol
    if (roleFilter !== "all") {
      result = result.filter((user) => user.role === roleFilter);
    }

    // Ordenar
    result = result.sort((a, b) => {
      switch (sortBy) {
        case "name-asc":
          return (a.name || "").localeCompare(b.name || "");
        case "name-desc":
          return (b.name || "").localeCompare(a.name || "");
        case "email-asc":
          return a.email.localeCompare(b.email);
        case "email-desc":
          return b.email.localeCompare(a.email);
        case "date-asc":
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        case "date-desc":
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        default:
          return 0;
      }
    });

    setFilteredUsers(result);
    setCurrentPage(1);
    setIsLoading(false);

    // Actualizar URL
    updateUrlParams(searchQuery, roleFilter, sortBy);
  }, [users, searchQuery, roleFilter, sortBy, updateUrlParams]);

  // Refrescar datos
  const refreshData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/users");
      if (!response.ok) throw new Error("Error al cargar usuarios");

      const data = await response.json();
      setUsers(data.users);
    } catch (error) {
      toast.error("Error al cargar los datos");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Eliminar usuario
  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      const response = await fetch(`/api/users/${selectedUser.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al eliminar usuario");
      }

      toast.success("Usuario eliminado correctamente");
      setDeleteDialogOpen(false);
      refreshData();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Error al eliminar usuario"
      );
    }
  };

  // Generar contraseña aleatoria
  function generateRandomPassword() {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let password = "";
    for (let i = 0; i < 10; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  // Resetear contraseña
  const handleResetPassword = async () => {
    if (!selectedUser) return;

    try {
      const password = generateRandomPassword();
      setNewPassword(password);

      const response = await fetch(`/api/users/${selectedUser.id}/password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al resetear contraseña");
      }

      // Si el usuario es estudiante y no está activado, activarlo
      if (selectedUser.student && !selectedUser.student.isActivated) {
        const activateResponse = await fetch("/api/students", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: selectedUser.student.id,
            isActivated: true,
          }),
        });

        if (!activateResponse.ok) {
          console.error("Error al activar estudiante");
        }
      }

      toast.success("Contraseña reseteada correctamente");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Error al resetear contraseña"
      );
      setResetPasswordDialogOpen(false);
    }
  };

  // Función para renderizar el ícono del rol
  const getRoleIcon = (role: string) => {
    switch (role) {
      case "STUDENT":
        return <GraduationCap className="size-4 text-blue-500" />;
      case "TEACHER":
        return <School className="size-4 text-green-500" />;
      case "ADMIN":
        return <Shield className="size-4 text-amber-500" />;
      case "SUPERADMIN":
        return <ShieldAlert className="size-4 text-rose-500" />;
      default:
        return <CircleUser className="size-4 text-muted-foreground" />;
    }
  };

  // Función para obtener el texto del rol
  const getRoleText = (role: string) => {
    switch (role) {
      case "STUDENT":
        return "Estudiante";
      case "TEACHER":
        return "Profesor";
      case "ADMIN":
        return "Administrador";
      case "SUPERADMIN":
        return "SuperAdmin";
      default:
        return role;
    }
  };

  return (
    <div className="container py-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Usuarios</h1>
          <p className="text-muted-foreground">
            Administra a todos los usuarios registrados en la plataforma
          </p>
        </div>
      </div>

      <Card className="mb-6">
        <CardContent className="p-4 flex flex-col md:flex-row gap-3 items-start md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, correo o ID..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1 h-7 w-7"
                onClick={() => setSearchQuery("")}
              >
                <X className="size-4" />
              </Button>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los roles</SelectItem>
                <SelectItem value="STUDENT">Estudiantes</SelectItem>
                <SelectItem value="TEACHER">Profesores</SelectItem>
                <SelectItem value="ADMIN">Administradores</SelectItem>
                <SelectItem value="SUPERADMIN">SuperAdmins</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name-asc">Nombre (A-Z)</SelectItem>
                <SelectItem value="name-desc">Nombre (Z-A)</SelectItem>
                <SelectItem value="email-asc">Email (A-Z)</SelectItem>
                <SelectItem value="email-desc">Email (Z-A)</SelectItem>
                <SelectItem value="date-asc">Creación (Antigua)</SelectItem>
                <SelectItem value="date-desc">Creación (Reciente)</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setRoleFilter("all");
                setSortBy("name-asc");
              }}
              disabled={
                !searchQuery && roleFilter === "all" && sortBy === "name-asc"
              }
            >
              Limpiar filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle>Lista de Usuarios</CardTitle>
            <CardDescription>
              {isLoading ? (
                <div className="flex items-center">
                  <Loader2 className="size-4 animate-spin mr-2" />
                  Cargando...
                </div>
              ) : (
                `Mostrando ${filteredUsers.length} de ${users.length} usuarios`
              )}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1 -ml-3 font-medium"
                    onClick={() =>
                      setSortBy(
                        sortBy === "name-asc" ? "name-desc" : "name-asc"
                      )
                    }
                  >
                    Nombre
                    <ArrowUpDown className="size-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1 -ml-3 font-medium"
                    onClick={() =>
                      setSortBy(
                        sortBy === "email-asc" ? "email-desc" : "email-asc"
                      )
                    }
                  >
                    Correo
                    <ArrowUpDown className="size-4" />
                  </Button>
                </TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Información</TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1 -ml-3 font-medium"
                    onClick={() =>
                      setSortBy(
                        sortBy === "date-asc" ? "date-desc" : "date-asc"
                      )
                    }
                  >
                    Creado
                    <ArrowUpDown className="size-4" />
                  </Button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6">
                    <div className="flex flex-col items-center justify-center">
                      <CircleUser className="size-10 text-muted-foreground mb-3" />
                      {filteredUsers.length === 0 && users.length > 0 ? (
                        <>
                          <h3 className="text-lg font-medium mb-1">
                            No se encontraron usuarios
                          </h3>
                          <p className="text-muted-foreground max-w-md mb-4">
                            No hay resultados para los filtros aplicados.
                          </p>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setSearchQuery("");
                              setRoleFilter("all");
                              setSortBy("name-asc");
                            }}
                          >
                            Limpiar filtros
                          </Button>
                        </>
                      ) : users.length === 0 ? (
                        <>
                          <h3 className="text-lg font-medium mb-1">
                            No hay usuarios registrados
                          </h3>
                          <p className="text-muted-foreground max-w-md mb-4">
                            Aún no se han registrado usuarios en la plataforma.
                          </p>
                        </>
                      ) : (
                        <Loader2 className="size-10 animate-spin text-primary" />
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                currentItems.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={user.image || ""} />
                          <AvatarFallback>
                            {user.name &&
                              user.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{user.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {getRoleIcon(user.role)}
                        <span>{getRoleText(user.role)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.student && (
                        <Badge variant="outline">
                          ID: {user.student.studentId}
                        </Badge>
                      )}
                      {user.teacher && user.teacher.department && (
                        <Badge variant="outline">
                          {user.teacher.department}
                        </Badge>
                      )}
                      {user.admin?.isSuperAdmin && (
                        <Badge variant="default">SuperAdmin</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {format(new Date(user.createdAt), "d MMM, yyyy", {
                        locale: es,
                      })}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter className="flex items-center justify-between py-4">
          <div className="text-sm text-muted-foreground">
            Mostrando <span className="font-medium">{currentItems.length}</span>{" "}
            de <span className="font-medium">{filteredUsers.length}</span>{" "}
            usuarios
          </div>
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
              >
                Siguiente
              </Button>
            </div>
          )}
        </CardFooter>
      </Card>

      {/* Diálogo para eliminar usuario */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente al usuario{" "}
              <span className="font-semibold">{selectedUser?.name}</span> (
              {selectedUser?.email}) y todos sus datos relacionados. Esta acción
              no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteUser}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Diálogo para resetear contraseña */}
      <AlertDialog
        open={resetPasswordDialogOpen}
        onOpenChange={setResetPasswordDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Resetear contraseña</AlertDialogTitle>
            <AlertDialogDescription>
              Se generará una nueva contraseña para el usuario{" "}
              <span className="font-semibold">{selectedUser?.name}</span> (
              {selectedUser?.email}). La contraseña actual dejará de funcionar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {newPassword ? (
            <div className="bg-muted/50 rounded-md p-4 my-2">
              <div className="flex items-center justify-between">
                <div className="font-medium mb-1">Nueva contraseña:</div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(newPassword);
                    toast.success("Contraseña copiada al portapapeles");
                  }}
                >
                  Copiar
                </Button>
              </div>
              <code className="bg-muted p-2 block rounded w-full overflow-x-auto">
                {newPassword}
              </code>
              <p className="text-sm text-muted-foreground mt-2">
                Guarda esta contraseña en un lugar seguro. No se volverá a
                mostrar.
              </p>
            </div>
          ) : (
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleResetPassword}>
                Resetear Contraseña
              </AlertDialogAction>
            </AlertDialogFooter>
          )}
          {newPassword && (
            <Button
              className="w-full mt-2"
              onClick={() => {
                setResetPasswordDialogOpen(false);
                setNewPassword("");
              }}
            >
              Cerrar
            </Button>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
