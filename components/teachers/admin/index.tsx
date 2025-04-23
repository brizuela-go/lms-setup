"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import debounce from "lodash/debounce";
import {
  School,
  Search,
  Filter,
  PlusCircle,
  Trash2,
  Edit,
  MoreHorizontal,
  Loader2,
  Download,
  Upload,
  X,
  ArrowUpDown,
  BookOpen,
  Users,
  Building2,
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
import { TeacherCreationDialog } from "../teachers-creation-dialog";

// Tipos
interface Teacher {
  id: string;
  userId: string;
  department: string | null;
  bio: string | null;
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
    createdAt: string;
  };
  subjects: Array<{
    id: string;
    name: string;
    code: string;
    enrollments: Array<{
      id: string;
    }>;
  }>;
}

interface TeachersClientProps {
  initialTeachers: Teacher[];
}

export default function TeachersClient({
  initialTeachers,
}: TeachersClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Estados
  const [teachers, setTeachers] = useState<Teacher[]>(initialTeachers);
  const [filteredTeachers, setFilteredTeachers] =
    useState<Teacher[]>(initialTeachers);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [departmentFilter, setDepartmentFilter] = useState(
    searchParams.get("department") || "all"
  );
  const [sortBy, setSortBy] = useState(searchParams.get("sort") || "name-asc");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Obtener todos los departamentos únicos
  const departments = [
    ...new Set(teachers.map((t) => t.department).filter(Boolean)),
  ];

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredTeachers.length / itemsPerPage);
  const currentItems = filteredTeachers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Actualizar URL con filtros
  const updateUrlParams = useCallback(
    debounce((query: string, department: string, sort: string) => {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      if (department !== "all") params.set("department", department);
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

    let result = [...teachers];

    // Filtrar por búsqueda
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (teacher) =>
          teacher.user.name?.toLowerCase().includes(query) ||
          teacher.user.email.toLowerCase().includes(query) ||
          teacher.department?.toLowerCase()?.includes(query)
      );
    }

    // Filtrar por departamento
    if (departmentFilter !== "all") {
      result = result.filter(
        (teacher) => teacher.department === departmentFilter
      );
    }

    // Ordenar
    result = result.sort((a, b) => {
      switch (sortBy) {
        case "name-asc":
          return (a.user.name || "").localeCompare(b.user.name || "");
        case "name-desc":
          return (b.user.name || "").localeCompare(a.user.name || "");
        case "subjects-asc":
          return a.subjects.length - b.subjects.length;
        case "subjects-desc":
          return b.subjects.length - a.subjects.length;
        case "students-asc":
          return (
            a.subjects.reduce((sum, subj) => sum + subj.enrollments.length, 0) -
            b.subjects.reduce((sum, subj) => sum + subj.enrollments.length, 0)
          );
        case "students-desc":
          return (
            b.subjects.reduce((sum, subj) => sum + subj.enrollments.length, 0) -
            a.subjects.reduce((sum, subj) => sum + subj.enrollments.length, 0)
          );
        default:
          return 0;
      }
    });

    setFilteredTeachers(result);
    setCurrentPage(1);
    setIsLoading(false);

    // Actualizar URL
    updateUrlParams(searchQuery, departmentFilter, sortBy);
  }, [teachers, searchQuery, departmentFilter, sortBy, updateUrlParams]);

  // Refrescar datos
  const refreshData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/teachers");
      if (!response.ok) throw new Error("Error al cargar profesores");

      const data = await response.json();
      setTeachers(data.teachers);
    } catch (error) {
      toast.error("Error al cargar los datos");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Eliminar profesor
  const handleDeleteTeacher = async () => {
    if (!selectedTeacher) return;

    try {
      const response = await fetch(`/api/teachers?id=${selectedTeacher.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al eliminar profesor");
      }

      toast.success("Profesor eliminado correctamente");
      setDeleteDialogOpen(false);
      refreshData();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Error al eliminar profesor"
      );
    }
  };

  return (
    <div className="container py-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Profesores</h1>
          <p className="text-muted-foreground">
            Administra a todos los profesores registrados en la plataforma
          </p>
        </div>

        <div className="flex gap-2">
          <TeacherCreationDialog onSuccess={refreshData}>
            <Button>
              <PlusCircle className="mr-2 size-4" />
              Crear Profesor
            </Button>
          </TeacherCreationDialog>
        </div>
      </div>

      <Card className="mb-6">
        <CardContent className="p-4 flex flex-col md:flex-row gap-3 items-start md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, departamento o correo..."
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
            <Select
              value={departmentFilter}
              onValueChange={setDepartmentFilter}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por departamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los departamentos</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept} value={dept || ""}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name-asc">Nombre (A-Z)</SelectItem>
                <SelectItem value="name-desc">Nombre (Z-A)</SelectItem>
                <SelectItem value="subjects-asc">Materias (Menor)</SelectItem>
                <SelectItem value="subjects-desc">Materias (Mayor)</SelectItem>
                <SelectItem value="students-asc">
                  Estudiantes (Menor)
                </SelectItem>
                <SelectItem value="students-desc">
                  Estudiantes (Mayor)
                </SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setDepartmentFilter("all");
                setSortBy("name-asc");
              }}
              disabled={
                !searchQuery &&
                departmentFilter === "all" &&
                sortBy === "name-asc"
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
            <CardTitle>Lista de Profesores</CardTitle>
            <CardDescription>
              {isLoading ? (
                <div className="flex items-center">
                  <Loader2 className="size-4 animate-spin mr-2" />
                  Cargando...
                </div>
              ) : (
                `Mostrando ${filteredTeachers.length} de ${teachers.length} profesores`
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
                <TableHead>Departamento</TableHead>
                <TableHead>Correo</TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1 -ml-3 font-medium"
                    onClick={() =>
                      setSortBy(
                        sortBy === "subjects-asc"
                          ? "subjects-desc"
                          : "subjects-asc"
                      )
                    }
                  >
                    Materias
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
                        sortBy === "students-asc"
                          ? "students-desc"
                          : "students-asc"
                      )
                    }
                  >
                    Estudiantes
                    <ArrowUpDown className="size-4" />
                  </Button>
                </TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6">
                    <div className="flex flex-col items-center justify-center">
                      <School className="size-10 text-muted-foreground mb-3" />
                      {filteredTeachers.length === 0 && teachers.length > 0 ? (
                        <>
                          <h3 className="text-lg font-medium mb-1">
                            No se encontraron profesores
                          </h3>
                          <p className="text-muted-foreground max-w-md mb-4">
                            No hay resultados para los filtros aplicados.
                          </p>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setSearchQuery("");
                              setDepartmentFilter("all");
                              setSortBy("name-asc");
                            }}
                          >
                            Limpiar filtros
                          </Button>
                        </>
                      ) : teachers.length === 0 ? (
                        <>
                          <h3 className="text-lg font-medium mb-1">
                            No hay profesores registrados
                          </h3>
                          <p className="text-muted-foreground max-w-md mb-4">
                            Aún no se han registrado profesores en la
                            plataforma.
                          </p>
                          <TeacherCreationDialog onSuccess={refreshData}>
                            <Button>
                              <PlusCircle className="mr-2 size-4" />
                              Crear Profesor
                            </Button>
                          </TeacherCreationDialog>
                        </>
                      ) : (
                        <Loader2 className="size-10 animate-spin text-primary" />
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                currentItems.map((teacher) => (
                  <TableRow key={teacher.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={teacher.user.image || ""} />
                          <AvatarFallback>
                            {teacher.user.name &&
                              teacher.user.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{teacher.user.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {teacher.department ? (
                        <div className="flex items-center gap-1">
                          <Building2 className="size-4 text-muted-foreground" />
                          <span>{teacher.department}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">
                          Sin departamento
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{teacher.user.email}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <BookOpen className="size-4 text-muted-foreground" />
                        <span>{teacher.subjects.length}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="size-4 text-muted-foreground" />
                        <span>
                          {teacher.subjects.reduce(
                            (sum, subj) => sum + subj.enrollments.length,
                            0
                          )}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="size-4" />
                            <span className="sr-only">Opciones</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/teachers/${teacher.id}`}>
                              <School className="mr-2 size-4" />
                              Ver detalles
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/admin/teachers/${teacher.id}/subjects`}
                            >
                              <BookOpen className="mr-2 size-4" />
                              Ver materias
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/teachers/${teacher.id}/edit`}>
                              <Edit className="mr-2 size-4" />
                              Editar
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => {
                              setSelectedTeacher(teacher);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="mr-2 size-4" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
            de <span className="font-medium">{filteredTeachers.length}</span>{" "}
            profesores
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

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente al profesor{" "}
              <span className="font-semibold">
                {selectedTeacher?.user.name}
              </span>{" "}
              y todos sus datos relacionados. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteTeacher}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
