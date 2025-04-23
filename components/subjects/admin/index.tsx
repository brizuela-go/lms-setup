"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import debounce from "lodash/debounce";
import {
  BookOpen,
  Search,
  Filter,
  Plus,
  Trash2,
  Edit,
  MoreHorizontal,
  Calendar,
  Users,
  FileText,
  Download,
  Upload,
  School,
  ArrowUpDown,
  X,
  Loader2,
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
import { SubjectCreationDialog } from "@/components/subjects/subject-creation-dialog";

// Tipos
interface Teacher {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
  department: string | null;
}

interface Subject {
  id: string;
  name: string;
  code: string;
  description: string | null;
  startDate: string;
  endDate: string;
  teacher: {
    id: string;
    department: string | null;
    user: {
      id: string;
      name: string;
      email: string;
      image: string | null;
    };
  };
  enrollments: Array<{
    id: string;
    student: {
      id: string;
    };
  }>;
  homeworks: Array<{
    id: string;
  }>;
}

interface SubjectsClientProps {
  initialSubjects: Subject[];
  teachers: Teacher[];
}

export default function SubjectsClient({
  initialSubjects,
  teachers,
}: SubjectsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Estados
  const [subjects, setSubjects] = useState<Subject[]>(initialSubjects);
  const [filteredSubjects, setFilteredSubjects] =
    useState<Subject[]>(initialSubjects);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [teacherFilter, setTeacherFilter] = useState(
    searchParams.get("teacher") || "all"
  );
  const [sortBy, setSortBy] = useState(searchParams.get("sort") || "recent");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredSubjects.length / itemsPerPage);
  const currentItems = filteredSubjects.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Actualizar URL con filtros
  const updateUrlParams = useCallback(
    debounce((query: string, teacher: string, sort: string) => {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      if (teacher !== "all") params.set("teacher", teacher);
      if (sort !== "recent") params.set("sort", sort);

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

    let result = [...subjects];

    // Filtrar por búsqueda
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (subject) =>
          subject.name.toLowerCase().includes(query) ||
          subject.code.toLowerCase().includes(query) ||
          subject.description?.toLowerCase().includes(query)
      );
    }

    // Filtrar por profesor
    if (teacherFilter !== "all") {
      result = result.filter((subject) => subject.teacher.id === teacherFilter);
    }

    // Ordenar
    result = result.sort((a, b) => {
      switch (sortBy) {
        case "recent":
          return (
            new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
          );
        case "name":
          return a.name.localeCompare(b.name);
        case "start":
          return (
            new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
          );
        case "students":
          return b.enrollments.length - a.enrollments.length;
        default:
          return 0;
      }
    });

    setFilteredSubjects(result);
    setCurrentPage(1);
    setIsLoading(false);

    // Actualizar URL
    updateUrlParams(searchQuery, teacherFilter, sortBy);
  }, [subjects, searchQuery, teacherFilter, sortBy, updateUrlParams]);

  // Refrescar datos
  const refreshData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/subjects");
      if (!response.ok) throw new Error("Error al cargar materias");

      const data = await response.json();
      setSubjects(data.subjects);
    } catch (error) {
      toast.error("Error al cargar los datos");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Eliminar materia
  const handleDeleteSubject = async () => {
    if (!selectedSubject) return;

    try {
      const response = await fetch(`/api/subjects?id=${selectedSubject.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al eliminar materia");
      }

      toast.success("Materia eliminada correctamente");
      setDeleteDialogOpen(false);
      refreshData();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Error al eliminar materia"
      );
    }
  };

  return (
    <div className="container py-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Materias</h1>
          <p className="text-muted-foreground">
            Administra todas las materias y cursos disponibles en la plataforma
          </p>
        </div>

        <div className="flex gap-2">
          <SubjectCreationDialog teachers={teachers} onSuccess={refreshData} />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Filter className="mr-2 size-4" />
                Opciones
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Upload className="mr-2 size-4" />
                Importar materias
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Download className="mr-2 size-4" />
                Exportar datos
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={refreshData}>
                <Loader2 className="mr-2 size-4" />
                Actualizar datos
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Card className="mb-6">
        <CardContent className="p-4 flex flex-col md:flex-row gap-3 items-start md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o código..."
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
            <Select value={teacherFilter} onValueChange={setTeacherFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por profesor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los profesores</SelectItem>
                {teachers.map((teacher) => (
                  <SelectItem key={teacher.id} value={teacher.id}>
                    {teacher.user.name}
                    {teacher.department ? ` (${teacher.department})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Más recientes</SelectItem>
                <SelectItem value="name">Nombre (A-Z)</SelectItem>
                <SelectItem value="start">Fecha de inicio</SelectItem>
                <SelectItem value="students">Estudiantes</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setTeacherFilter("all");
                setSortBy("recent");
              }}
              disabled={
                !searchQuery && teacherFilter === "all" && sortBy === "recent"
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
            <CardTitle>Lista de Materias</CardTitle>
            <CardDescription>
              {isLoading ? (
                <div className="flex items-center">
                  <Loader2 className="size-4 animate-spin mr-2" />
                  Cargando...
                </div>
              ) : (
                `Mostrando ${filteredSubjects.length} de ${subjects.length} materias`
              )}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[200px]">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1 -ml-3 font-medium"
                    onClick={() =>
                      setSortBy(sortBy === "name" ? "recent" : "name")
                    }
                  >
                    Nombre
                    <ArrowUpDown className="size-4" />
                  </Button>
                </TableHead>
                <TableHead>Código</TableHead>
                <TableHead>Profesor</TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1 -ml-3 font-medium"
                    onClick={() =>
                      setSortBy(sortBy === "start" ? "recent" : "start")
                    }
                  >
                    Período
                    <ArrowUpDown className="size-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1 -ml-3 font-medium"
                    onClick={() =>
                      setSortBy(sortBy === "students" ? "recent" : "students")
                    }
                  >
                    Estudiantes
                    <ArrowUpDown className="size-4" />
                  </Button>
                </TableHead>
                <TableHead>Tareas</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6">
                    <div className="flex flex-col items-center justify-center">
                      <BookOpen className="size-10 text-muted-foreground mb-3" />
                      {filteredSubjects.length === 0 && subjects.length > 0 ? (
                        <>
                          <h3 className="text-lg font-medium mb-1">
                            No se encontraron materias
                          </h3>
                          <p className="text-muted-foreground max-w-md mb-4">
                            No hay resultados para los filtros aplicados.
                          </p>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setSearchQuery("");
                              setTeacherFilter("all");
                              setSortBy("recent");
                            }}
                          >
                            Limpiar filtros
                          </Button>
                        </>
                      ) : subjects.length === 0 ? (
                        <>
                          <h3 className="text-lg font-medium mb-1">
                            No hay materias registradas
                          </h3>
                          <p className="text-muted-foreground max-w-md mb-4">
                            Aún no se han creado materias en la plataforma.
                          </p>
                          <SubjectCreationDialog
                            teachers={teachers}
                            onSuccess={refreshData}
                          >
                            <Button>
                              <Plus className="mr-2 size-4" />
                              Crear Materia
                            </Button>
                          </SubjectCreationDialog>
                        </>
                      ) : (
                        <Loader2 className="size-10 animate-spin text-primary" />
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                currentItems.map((subject) => (
                  <TableRow key={subject.id}>
                    <TableCell>
                      <div className="font-medium">{subject.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {subject.description
                          ? subject.description.substring(0, 50) +
                            (subject.description.length > 50 ? "..." : "")
                          : "Sin descripción"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{subject.code}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="size-8">
                          <AvatarImage src={subject.teacher.user.image || ""} />
                          <AvatarFallback>
                            {subject.teacher.user.name &&
                              subject.teacher.user.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">
                            {subject.teacher.user.name}
                          </div>
                          {subject.teacher.department && (
                            <div className="text-xs text-muted-foreground truncate">
                              {subject.teacher.department}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm flex items-center gap-1">
                        <Calendar className="size-3.5 text-muted-foreground" />
                        <span>
                          {format(new Date(subject.startDate), "d MMM", {
                            locale: es,
                          })}{" "}
                          -
                          {format(new Date(subject.endDate), "d MMM, yyyy", {
                            locale: es,
                          })}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="size-4 text-muted-foreground" />
                        <span>{subject.enrollments.length}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <FileText className="size-4 text-muted-foreground" />
                        <span>{subject.homeworks.length}</span>
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
                            <Link href={`/admin/subjects/${subject.id}`}>
                              <BookOpen className="mr-2 size-4" />
                              Ver detalles
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/admin/subjects/${subject.id}/students`}
                            >
                              <Users className="mr-2 size-4" />
                              Estudiantes
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/admin/subjects/${subject.id}/homeworks`}
                            >
                              <FileText className="mr-2 size-4" />
                              Tareas
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/subjects/${subject.id}/edit`}>
                              <Edit className="mr-2 size-4" />
                              Editar
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => {
                              setSelectedSubject(subject);
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
            de <span className="font-medium">{filteredSubjects.length}</span>{" "}
            materias
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
              Esta acción eliminará permanentemente la materia{" "}
              <span className="font-semibold">{selectedSubject?.name}</span> (
              {selectedSubject?.code}) y todos sus datos relacionados. Esta
              acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteSubject}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
