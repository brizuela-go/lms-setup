"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  ChevronLeft,
  Users,
  Search,
  Plus,
  Loader2,
  Check,
  X,
  UserPlus,
  Download,
  Upload,
  CheckCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
} from "@/components/ui/breadcrumb";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Subject {
  id: string;
  name: string;
  code: string;
  teacher: {
    user: {
      name: string;
    };
  };
  enrollments: Array<{
    id: string;
    status: string;
    student: {
      id: string;
      studentId: string;
      user: {
        name: string;
        email: string;
        image: string | null;
      };
    };
  }>;
}

interface Student {
  id: string;
  studentId: string;
  isActivated: boolean;
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
  isEnrolled?: boolean;
  enrollmentId?: string;
  enrollmentStatus?: string;
}

export default function AddStudentsToSubjectPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [subject, setSubject] = useState<Subject | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [enrolledStudents, setEnrolledStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [activeTab, setActiveTab] = useState("available");

  // Cargar datos de la materia y estudiantes
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);

      try {
        // Cargar la materia
        const subjectResponse = await fetch(`/api/subjects?id=${params.id}`);
        if (!subjectResponse.ok) throw new Error("Error al cargar la materia");

        const subjectData = await subjectResponse.json();
        setSubject(subjectData.subject);

        // Mapear estudiantes ya inscritos
        const enrolledIds = new Set(
          subjectData.subject.enrollments.map((e: any) => e.student.id)
        );

        // Cargar todos los estudiantes
        const studentsResponse = await fetch("/api/students");
        if (!studentsResponse.ok)
          throw new Error("Error al cargar estudiantes");

        const studentsData = await studentsResponse.json();

        // Marcar estudiantes que ya están inscritos
        const allStudents = studentsData.students.map((student: any) => ({
          ...student,
          isEnrolled: enrolledIds.has(student.id),
          enrollmentId:
            subjectData.subject.enrollments.find(
              (e: any) => e.student.id === student.id
            )?.id || null,
          enrollmentStatus:
            subjectData.subject.enrollments.find(
              (e: any) => e.student.id === student.id
            )?.status || null,
        }));

        // Separar estudiantes disponibles y ya inscritos
        const available = allStudents.filter((s: Student) => !s.isEnrolled);
        const enrolled = allStudents.filter((s: Student) => s.isEnrolled);

        setStudents(available);
        setFilteredStudents(available);
        setEnrolledStudents(enrolled);
      } catch (error) {
        console.error("Error al cargar datos:", error);
        toast.error("Error al cargar datos. Inténtalo de nuevo.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [params.id]);

  // Filtrar estudiantes disponibles
  useEffect(() => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const filtered = students.filter(
        (student) =>
          student.user.name.toLowerCase().includes(query) ||
          student.user.email.toLowerCase().includes(query) ||
          student.studentId.toLowerCase().includes(query)
      );
      setFilteredStudents(filtered);
    } else {
      setFilteredStudents(students);
    }
  }, [students, searchQuery]);

  // Manejar seleccionar/deseleccionar todo
  useEffect(() => {
    if (selectAll) {
      setSelectedStudents(filteredStudents.map((s) => s.id));
    } else {
      setSelectedStudents([]);
    }
  }, [selectAll, filteredStudents]);

  // Verificar si todos los elementos están seleccionados
  useEffect(() => {
    if (
      filteredStudents.length > 0 &&
      selectedStudents.length === filteredStudents.length
    ) {
      setSelectAll(true);
    } else {
      setSelectAll(false);
    }
  }, [selectedStudents, filteredStudents]);

  // Alternar selección de estudiante
  const toggleStudentSelection = (id: string) => {
    setSelectedStudents((prev) =>
      prev.includes(id)
        ? prev.filter((studentId) => studentId !== id)
        : [...prev, id]
    );
  };

  // Añadir estudiantes a la materia
  const addStudentsToSubject = async () => {
    if (!selectedStudents.length || !subject) return;

    setIsSubmitting(true);

    try {
      // Hacer solicitud a la API para inscribir estudiantes
      const response = await fetch("/api/enrollments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subjectId: subject.id,
          studentIds: selectedStudents,
          status: "APPROVED", // Estado aprobado directamente por ser administrador
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al inscribir estudiantes");
      }

      toast.success(
        `${selectedStudents.length} estudiante(s) inscrito(s) correctamente`
      );

      // Actualizar la lista de estudiantes
      setStudents((prev) =>
        prev.filter((student) => !selectedStudents.includes(student.id))
      );

      // Limpiar selección
      setSelectedStudents([]);
      setSelectAll(false);

      // Recargar la página después de un breve retraso
      setTimeout(() => {
        router.refresh();

        // Actualizar las listas sin recargar
        const newlyEnrolled = students
          .filter((student) => selectedStudents.includes(student.id))
          .map((student) => ({
            ...student,
            isEnrolled: true,
            enrollmentStatus: "APPROVED",
          }));

        setEnrolledStudents((prev) => [...prev, ...newlyEnrolled]);
        setStudents((prev) =>
          prev.filter((student) => !selectedStudents.includes(student.id))
        );
        setFilteredStudents((prev) =>
          prev.filter((student) => !selectedStudents.includes(student.id))
        );
      }, 1000);
    } catch (error) {
      console.error("Error al inscribir estudiantes:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Error al inscribir estudiantes"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Eliminar estudiante de la materia
  const removeStudentFromSubject = async (
    studentId: string,
    enrollmentId: string
  ) => {
    if (!subject) return;

    try {
      // Hacer solicitud a la API para eliminar inscripción
      const response = await fetch(`/api/enrollments?id=${enrollmentId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al eliminar estudiante");
      }

      toast.success("Estudiante eliminado de la materia");

      // Actualizar listas
      const studentToMove = enrolledStudents.find((s) => s.id === studentId);
      if (studentToMove) {
        const updatedStudent = {
          ...studentToMove,
          isEnrolled: false,
          enrollmentId: null,
          enrollmentStatus: null,
        };

        setEnrolledStudents((prev) => prev.filter((s) => s.id !== studentId));
        setStudents((prev: any) => [...prev, updatedStudent]);

        // Si está activa la pestaña de disponibles, actualizar filteredStudents
        if (activeTab === "available") {
          setFilteredStudents((prev: any) => [...prev, updatedStudent]);
        }
      }
    } catch (error) {
      console.error("Error al eliminar estudiante:", error);
      toast.error(
        error instanceof Error ? error.message : "Error al eliminar estudiante"
      );
    }
  };

  // Obtener iniciales para avatar
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="container py-10 flex justify-center items-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p>Cargando datos...</p>
        </div>
      </div>
    );
  }

  if (!subject) {
    return (
      <div className="container py-10">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Materia no encontrada</h2>
          <p className="text-muted-foreground mb-4">
            No se ha podido encontrar la materia solicitada.
          </p>
          <Button asChild>
            <Link href="/admin/subjects">Volver a la lista</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-8">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href={`/admin/subjects/${subject.id}`}>
              <ChevronLeft className="size-5" />
            </Link>
          </Button>

          <div>
            <h1 className="text-3xl font-bold mb-2">Gestionar Estudiantes</h1>
            <p className="text-muted-foreground">
              Añadir o eliminar estudiantes de la materia{" "}
              <strong>{subject.name}</strong>{" "}
              <Badge variant="outline">{subject.code}</Badge>
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Upload className="mr-2 size-4" />
                Importar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Opciones de Importación</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Download className="mr-2 size-4" />
                Descargar Plantilla
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Upload className="mr-2 size-4" />
                Importar desde CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            disabled={selectedStudents.length === 0 || isSubmitting}
            onClick={addStudentsToSubject}
          >
            {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
            <Plus className="mr-2 size-4" />
            Añadir Seleccionados
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Estudiantes para {subject.name}</CardTitle>
          <CardDescription>
            Profesor: {subject.teacher.user.name}
          </CardDescription>
        </CardHeader>

        <Tabs defaultValue="available" onValueChange={setActiveTab}>
          <div className="px-6 pt-2">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="available">
                <UserPlus className="mr-2 size-4" />
                Estudiantes Disponibles
              </TabsTrigger>
              <TabsTrigger value="enrolled">
                <CheckCheck className="mr-2 size-4" />
                Estudiantes Inscritos{" "}
                <Badge variant="secondary" className="ml-2">
                  {enrolledStudents.length}
                </Badge>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="available" className="pt-3">
            <CardContent>
              <div className="flex justify-between items-center mb-4">
                <div className="relative w-full max-w-sm">
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

                {selectedStudents.length > 0 && (
                  <Button
                    size="sm"
                    onClick={addStudentsToSubject}
                    disabled={isSubmitting}
                  >
                    {isSubmitting && (
                      <Loader2 className="mr-2 size-4 animate-spin" />
                    )}
                    Añadir {selectedStudents.length} estudiante(s)
                  </Button>
                )}
              </div>

              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">
                        <Checkbox
                          checked={selectAll}
                          onCheckedChange={(checked) => {
                            setSelectAll(!!checked);
                          }}
                          aria-label="Seleccionar todos los estudiantes"
                        />
                      </TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>ID Estudiante</TableHead>
                      <TableHead>Correo</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-10">
                          <Users className="size-8 text-muted-foreground mx-auto mb-3" />
                          {students.length === 0 ? (
                            <>
                              <h3 className="text-lg font-medium mb-1">
                                No hay estudiantes disponibles
                              </h3>
                              <p className="text-muted-foreground max-w-md mx-auto mb-4">
                                Todos los estudiantes ya están inscritos en esta
                                materia.
                              </p>
                            </>
                          ) : (
                            <>
                              <h3 className="text-lg font-medium mb-1">
                                No se encontraron estudiantes
                              </h3>
                              <p className="text-muted-foreground max-w-md mx-auto mb-4">
                                No hay resultados para la búsqueda actual.
                              </p>
                              <Button
                                variant="outline"
                                onClick={() => setSearchQuery("")}
                              >
                                Mostrar todos
                              </Button>
                            </>
                          )}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredStudents.map((student) => (
                        <TableRow key={student.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedStudents.includes(student.id)}
                              onCheckedChange={() =>
                                toggleStudentSelection(student.id)
                              }
                              aria-label={`Seleccionar ${student.user.name}`}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="size-8">
                                <AvatarImage src={student.user.image || ""} />
                                <AvatarFallback>
                                  {getInitials(student.user.name)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium">
                                {student.user.name}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{student.studentId}</Badge>
                          </TableCell>
                          <TableCell>{student.user.email}</TableCell>
                          <TableCell>
                            {student.isActivated ? (
                              <Badge>Activado</Badge>
                            ) : (
                              <Badge variant="secondary">Pendiente</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleStudentSelection(student.id)}
                            >
                              {selectedStudents.includes(student.id) ? (
                                <>
                                  <Check className="mr-2 size-4" />
                                  Seleccionado
                                </>
                              ) : (
                                <>
                                  <Plus className="mr-2 size-4" />
                                  Seleccionar
                                </>
                              )}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </TabsContent>

          <TabsContent value="enrolled" className="pt-3">
            <CardContent>
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>ID Estudiante</TableHead>
                      <TableHead>Correo</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {enrolledStudents.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-10">
                          <Users className="size-8 text-muted-foreground mx-auto mb-3" />
                          <h3 className="text-lg font-medium mb-1">
                            No hay estudiantes inscritos
                          </h3>
                          <p className="text-muted-foreground max-w-md mx-auto mb-4">
                            Esta materia no tiene estudiantes inscritos.
                          </p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      enrolledStudents.map((student) => (
                        <TableRow key={student.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="size-8">
                                <AvatarImage src={student.user.image || ""} />
                                <AvatarFallback>
                                  {getInitials(student.user.name)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium">
                                {student.user.name}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{student.studentId}</Badge>
                          </TableCell>
                          <TableCell>{student.user.email}</TableCell>
                          <TableCell>
                            {student.enrollmentStatus === "APPROVED" ? (
                              <Badge>Aprobado</Badge>
                            ) : student.enrollmentStatus === "PENDING" ? (
                              <Badge variant="secondary">Pendiente</Badge>
                            ) : (
                              <Badge variant="destructive">Rechazado</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (student.enrollmentId) {
                                  removeStudentFromSubject(
                                    student.id,
                                    student.enrollmentId
                                  );
                                }
                              }}
                            >
                              <X className="mr-2 size-4" />
                              Eliminar
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </TabsContent>
        </Tabs>

        <CardFooter className="flex justify-between py-4">
          <Button variant="outline" asChild>
            <Link href={`/admin/subjects/${subject.id}`}>
              Volver a los Detalles
            </Link>
          </Button>

          {activeTab === "available" && selectedStudents.length > 0 && (
            <Button onClick={addStudentsToSubject} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
              <Plus className="mr-2 size-4" />
              Añadir {selectedStudents.length} Estudiante(s)
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
