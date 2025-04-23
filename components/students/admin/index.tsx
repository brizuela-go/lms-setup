"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import debounce from "lodash/debounce";
import {
  Users,
  Search,
  Filter,
  PlusCircle,
  Trash2,
  Edit,
  MoreHorizontal,
  Loader2,
  Download,
  Upload,
  UserPlus,
  X,
  ArrowUpDown,
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
import { StudentCreationDialog } from "@/components/students/student-creation-dialog";

// Tipos
interface Student {
  id: string;
  userId: string;
  studentId: string;
  isActivated: boolean;
  joinedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
  enrollments: Array<{
    id: string;
    subject: {
      id: string;
      name: string;
      code: string;
    };
  }>;
}

interface StudentsClientProps {
  initialStudents: Student[];
}

export default function StudentsClient({
  initialStudents,
}: StudentsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Estados
  const [students, setStudents] = useState<Student[]>(initialStudents);
  const [filteredStudents, setFilteredStudents] =
    useState<Student[]>(initialStudents);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [statusFilter, setStatusFilter] = useState(
    searchParams.get("status") || "all"
  );
  const [sortBy, setSortBy] = useState(searchParams.get("sort") || "name-asc");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const currentItems = filteredStudents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Actualizar URL con filtros
  const updateUrlParams = useCallback(
    debounce((query: string, status: string, sort: string) => {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      if (status !== "all") params.set("status", status);
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

    let result = [...students];

    // Filtrar por búsqueda
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (student) =>
          student.user.name?.toLowerCase().includes(query) ||
          student.user.email.toLowerCase().includes(query) ||
          student.studentId.toLowerCase().includes(query)
      );
    }

    // Filtrar por estado
    if (statusFilter !== "all") {
      const isActivated = statusFilter === "active";
      result = result.filter((student) => student.isActivated === isActivated);
    }

    // Ordenar
    result = result.sort((a, b) => {
      switch (sortBy) {
        case "name-asc":
          return (a.user.name || "").localeCompare(b.user.name || "");
        case "name-desc":
          return (b.user.name || "").localeCompare(a.user.name || "");
        case "date-asc":
          return (
            new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime()
          );
        case "date-desc":
          return (
            new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime()
          );
        case "id-asc":
          return a.studentId.localeCompare(b.studentId);
        case "id-desc":
          return b.studentId.localeCompare(a.studentId);
        default:
          return 0;
      }
    });

    setFilteredStudents(result);
    setCurrentPage(1);
    setIsLoading(false);

    // Actualizar URL
    updateUrlParams(searchQuery, statusFilter, sortBy);
  }, [students, searchQuery, statusFilter, sortBy, updateUrlParams]);

  // Refrescar datos
  const refreshData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/students");
      if (!response.ok) throw new Error("Error al cargar estudiantes");

      const data = await response.json();
      setStudents(data.students);
    } catch (error) {
      toast.error("Error al cargar los datos");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Eliminar estudiante
  const handleDeleteStudent = async () => {
    if (!selectedStudent) return;

    try {
      const response = await fetch(`/api/students?id=${selectedStudent.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al eliminar estudiante");
      }

      toast.success("Estudiante eliminado correctamente");
      setDeleteDialogOpen(false);
      refreshData();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Error al eliminar estudiante"
      );
    }
  };

  // Regenerar ID de estudiante
  const handleRegenerateId = async (student: Student) => {
    try {
      const newId = Math.floor(100000 + Math.random() * 900000).toString();

      const response = await fetch("/api/students", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: student.id,
          studentId: newId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al regenerar ID");
      }

      toast.success(`ID regenerado: ${newId}`);
      refreshData();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Error al regenerar ID"
      );
    }
  };

  return (
    <div className="container py-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Estudiantes</h1>
          <p className="text-muted-foreground">
            Administra a todos los estudiantes registrados en la plataforma
          </p>
        </div>

        <div className="flex gap-2">
          <StudentCreationDialog onSuccess={refreshData} />
        </div>
      </div>

      <Card className="mb-6">
        <CardContent className="p-4 flex flex-col md:flex-row gap-3 items-start md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, ID o correo..."
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
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="active">Activados</SelectItem>
                <SelectItem value="pending">Pendientes</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name-asc">Nombre (A-Z)</SelectItem>
                <SelectItem value="name-desc">Nombre (Z-A)</SelectItem>
                <SelectItem value="date-asc">Fecha (Antigua)</SelectItem>
                <SelectItem value="date-desc">Fecha (Reciente)</SelectItem>
                <SelectItem value="id-asc">ID Estudiante (Asc)</SelectItem>
                <SelectItem value="id-desc">ID Estudiante (Desc)</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("all");
                setSortBy("name-asc");
              }}
              disabled={
                !searchQuery && statusFilter === "all" && sortBy === "name-asc"
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
            <CardTitle>Lista de Estudiantes</CardTitle>
            <CardDescription>
              {isLoading ? (
                <div className="flex items-center">
                  <Loader2 className="size-4 animate-spin mr-2" />
                  Cargando...
                </div>
              ) : (
                `Mostrando ${filteredStudents.length} de ${students.length} estudiantes`
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
                      setSortBy(sortBy === "id-asc" ? "id-desc" : "id-asc")
                    }
                  >
                    ID Estudiante
                    <ArrowUpDown className="size-4" />
                  </Button>
                </TableHead>
                <TableHead>Correo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Materias</TableHead>
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
                    Fecha de Registro
                    <ArrowUpDown className="size-4" />
                  </Button>
                </TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6">
                    <div className="flex flex-col items-center justify-center">
                      <Users className="size-10 text-muted-foreground mb-3" />
                      {filteredStudents.length === 0 && students.length > 0 ? (
                        <>
                          <h3 className="text-lg font-medium mb-1">
                            No se encontraron estudiantes
                          </h3>
                          <p className="text-muted-foreground max-w-md mb-4">
                            No hay resultados para los filtros aplicados.
                          </p>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setSearchQuery("");
                              setStatusFilter("all");
                              setSortBy("name-asc");
                            }}
                          >
                            Limpiar filtros
                          </Button>
                        </>
                      ) : students.length === 0 ? (
                        <>
                          <h3 className="text-lg font-medium mb-1">
                            No hay estudiantes registrados
                          </h3>
                          <p className="text-muted-foreground max-w-md mb-4">
                            Aún no se han registrado estudiantes en la
                            plataforma.
                          </p>
                          <StudentCreationDialog onSuccess={refreshData}>
                            <Button>
                              <UserPlus className="mr-2 size-4" />
                              Crear Estudiante
                            </Button>
                          </StudentCreationDialog>
                        </>
                      ) : (
                        <Loader2 className="size-10 animate-spin text-primary" />
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                currentItems.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={student.user.image || ""} />
                          <AvatarFallback>
                            {student.user.name &&
                              student.user.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{student.user.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{student.studentId}</Badge>
                    </TableCell>
                    <TableCell>{student.user.email}</TableCell>
                    <TableCell>
                      {student.isActivated ? (
                        <Badge variant={"outline"}>Activado</Badge>
                      ) : (
                        <Badge variant="secondary">Pendiente</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={"outline"}>
                        {student.enrollments?.length}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(student?.joinedAt), "d MMM, yyyy", {
                        locale: es,
                      })}
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
                            <Link href={`/admin/students/${student.id}`}>
                              <Users className="mr-2 size-4" />
                              Ver detalles
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/students/${student.id}/edit`}>
                              <Edit className="mr-2 size-4" />
                              Editar
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleRegenerateId(student)}
                          >
                            <Loader2 className="mr-2 size-4" />
                            Regenerar ID
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => {
                              setSelectedStudent(student);
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
            de <span className="font-medium">{filteredStudents.length}</span>{" "}
            estudiantes
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
              Esta acción eliminará permanentemente al estudiante{" "}
              <span className="font-semibold">
                {selectedStudent?.user.name}
              </span>{" "}
              y todos sus datos relacionados. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteStudent}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
