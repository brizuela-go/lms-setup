import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { PrismaClient } from "@prisma/client";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  School,
  ChevronLeft,
  Mail,
  Edit,
  Trash2,
  Building2,
  BookOpen,
  Users,
  Calendar,
  KeyRound,
  FileText,
  GraduationCap,
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
} from "@/components/ui/breadcrumb";

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
    startDate: string;
    endDate: string;
    enrollments: Array<{
      id: string;
      student: {
        id: string;
        user: {
          name: string;
        };
      };
    }>;
    homeworks: Array<{
      id: string;
    }>;
  }>;
}

const prisma = new PrismaClient();

async function getTeacher(id: string) {
  try {
    const teacher = await prisma.teacher.findUnique({
      where: { id },
      include: {
        user: true,
        subjects: {
          include: {
            enrollments: {
              include: {
                student: {
                  include: {
                    user: true,
                  },
                },
              },
            },
            homeworks: true,
          },
        },
      },
    });

    return teacher;
  } catch (error) {
    console.error("Error al obtener profesor:", error);
    return null;
  }
}

export default async function TeacherDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();

  if (
    !session ||
    (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")
  ) {
    redirect("/login");
  }

  const teacher = await getTeacher(params.id);

  if (!teacher) {
    notFound();
  }

  // Calcular estadísticas
  const totalSubjects = teacher.subjects.length;
  const totalStudents = new Set(
    teacher.subjects.flatMap((subject) =>
      subject.enrollments.map((enrollment) => enrollment.student.id)
    )
  ).size;
  const totalHomeworks = teacher.subjects.reduce(
    (acc, subject) => acc + subject.homeworks.length,
    0
  );

  // Generar iniciales para el avatar
  const initials = teacher.user.name
    ? teacher.user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "PR";

  return (
    <div className="container py-10">
      <div className="mb-6">
        <Breadcrumb>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/admin">Dashboard</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/admin/teachers">Profesores</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <BreadcrumbLink>{teacher.user.name}</BreadcrumbLink>
          </BreadcrumbItem>
        </Breadcrumb>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-8">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            asChild
            className="hidden sm:flex"
          >
            <Link href="/admin/teachers">
              <ChevronLeft className="size-5" />
            </Link>
          </Button>

          <div>
            <h1 className="text-3xl font-bold mb-2">{teacher.user.name}</h1>
            <div className="flex items-center gap-1 text-muted-foreground">
              <School className="size-4" />
              <span className="mr-4">Profesor</span>
              {teacher.department && (
                <Badge variant="outline">{teacher.department}</Badge>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <Button variant="outline" asChild>
            <Link href={`/admin/teachers/${teacher.id}/edit`}>
              <Edit className="mr-2 size-4" />
              Editar
            </Link>
          </Button>
          <Button variant="destructive">
            <Trash2 className="mr-2 size-4" />
            Eliminar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card>
            <CardHeader className="pb-0">
              <CardTitle>Información del Profesor</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center mb-6">
                <Avatar className="size-20 mb-4">
                  <AvatarImage src={teacher.user.image || ""} />
                  <AvatarFallback className="text-xl">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <h3 className="text-xl font-semibold">{teacher.user.name}</h3>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Mail className="size-4" />
                  <span>{teacher.user.email}</span>
                </div>
                {teacher.department && (
                  <div className="flex items-center gap-1 text-muted-foreground mt-1">
                    <Building2 className="size-4" />
                    <span>{teacher.department}</span>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Biografía
                  </p>
                  <p className="text-sm">
                    {teacher.bio || "Sin biografía disponible"}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Registrado el
                  </p>
                  <div className="flex items-center gap-2">
                    <Calendar className="size-4 text-muted-foreground" />
                    <span>
                      {format(
                        new Date(teacher.user.createdAt),
                        "d MMMM, yyyy",
                        {
                          locale: es,
                        }
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t pt-4 flex flex-col gap-2">
              <Button className="w-full" variant="outline" asChild>
                <Link href={`/admin/teachers/${teacher.id}/edit`}>
                  <Edit className="mr-2 size-4" />
                  Editar Información
                </Link>
              </Button>
              <Button className="w-full" variant="outline">
                <KeyRound className="mr-2 size-4" />
                Resetear Contraseña
              </Button>
            </CardFooter>
          </Card>

          <Card className="mt-6">
            <CardHeader className="pb-0">
              <CardTitle>Estadísticas</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="border rounded-lg p-4 text-center">
                  <p className="text-muted-foreground text-sm">Materias</p>
                  <p className="text-3xl font-bold mt-1">{totalSubjects}</p>
                </div>
                <div className="border rounded-lg p-4 text-center">
                  <p className="text-muted-foreground text-sm">Estudiantes</p>
                  <p className="text-3xl font-bold mt-1">{totalStudents}</p>
                </div>
                <div className="border rounded-lg p-4 text-center">
                  <p className="text-muted-foreground text-sm">Tareas</p>
                  <p className="text-3xl font-bold mt-1">{totalHomeworks}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Tabs defaultValue="subjects">
            <TabsList className="mb-6">
              <TabsTrigger value="subjects" className="flex gap-2">
                <BookOpen className="size-4" />
                <span>Materias</span>
                <Badge variant="secondary" className="ml-1">
                  {totalSubjects}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="students" className="flex gap-2">
                <Users className="size-4" />
                <span>Estudiantes</span>
                <Badge variant="secondary" className="ml-1">
                  {totalStudents}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="homeworks" className="flex gap-2">
                <FileText className="size-4" />
                <span>Tareas</span>
                <Badge variant="secondary" className="ml-1">
                  {totalHomeworks}
                </Badge>
              </TabsTrigger>
            </TabsList>

            {/* Tab: Materias */}
            <TabsContent value="subjects">
              <Card>
                <CardHeader>
                  <CardTitle>Materias Asignadas</CardTitle>
                  <CardDescription>
                    Materias que imparte el profesor
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {teacher.subjects.length === 0 ? (
                    <div className="text-center py-8">
                      <BookOpen className="size-12 text-muted-foreground mx-auto mb-3 opacity-80" />
                      <h3 className="text-lg font-medium mb-1">
                        No hay materias asignadas
                      </h3>
                      <p className="text-muted-foreground max-w-md mx-auto mb-4">
                        Este profesor no tiene materias asignadas actualmente.
                      </p>
                      <Button asChild>
                        <Link href="/admin/subjects/new">
                          Crear Nueva Materia
                        </Link>
                      </Button>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nombre</TableHead>
                          <TableHead>Código</TableHead>
                          <TableHead>Período</TableHead>
                          <TableHead>Estudiantes</TableHead>
                          <TableHead>Tareas</TableHead>
                          <TableHead>Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {teacher.subjects.map((subject) => (
                          <TableRow key={subject.id}>
                            <TableCell className="font-medium">
                              <Link
                                href={`/admin/subjects/${subject.id}`}
                                className="hover:underline"
                              >
                                {subject.name}
                              </Link>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{subject.code}</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1 text-sm">
                                <Calendar className="size-3.5 text-muted-foreground" />
                                <span>
                                  {format(
                                    new Date(subject.startDate),
                                    "d MMM",
                                    {
                                      locale: es,
                                    }
                                  )}{" "}
                                  -{" "}
                                  {format(
                                    new Date(subject.endDate),
                                    "d MMM, yyyy",
                                    {
                                      locale: es,
                                    }
                                  )}
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
                            <TableCell>
                              <Button size="sm" variant="outline" asChild>
                                <Link href={`/admin/subjects/${subject.id}`}>
                                  Ver
                                </Link>
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Estudiantes */}
            <TabsContent value="students">
              <Card>
                <CardHeader>
                  <CardTitle>Estudiantes</CardTitle>
                  <CardDescription>
                    Estudiantes en las materias del profesor
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {totalStudents === 0 ? (
                    <div className="text-center py-8">
                      <Users className="size-12 text-muted-foreground mx-auto mb-3 opacity-80" />
                      <h3 className="text-lg font-medium mb-1">
                        No hay estudiantes
                      </h3>
                      <p className="text-muted-foreground max-w-md mx-auto">
                        No hay estudiantes inscritos en las materias de este
                        profesor.
                      </p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nombre</TableHead>
                          <TableHead>Materia</TableHead>
                          <TableHead>Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {/* Mostrar estudiantes únicos */}
                        {Array.from(
                          new Map(
                            teacher.subjects
                              .flatMap((subject) =>
                                subject.enrollments.map((enrollment) => ({
                                  studentId: enrollment.student.id,
                                  studentName: enrollment.student.user.name,
                                  subjectName: subject.name,
                                  subjectId: subject.id,
                                }))
                              )
                              .map((item) => [
                                item.studentId + item.subjectId,
                                item,
                              ])
                          ).values()
                        ).map((item) => (
                          <TableRow key={`${item.studentId}-${item.subjectId}`}>
                            <TableCell className="font-medium">
                              <Link
                                href={`/admin/students/${item.studentId}`}
                                className="hover:underline"
                              >
                                {item.studentName}
                              </Link>
                            </TableCell>
                            <TableCell>
                              <Link
                                href={`/admin/subjects/${item.subjectId}`}
                                className="hover:underline"
                              >
                                {item.subjectName}
                              </Link>
                            </TableCell>
                            <TableCell>
                              <Button size="sm" variant="outline" asChild>
                                <Link
                                  href={`/admin/students/${item.studentId}`}
                                >
                                  Ver Perfil
                                </Link>
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Tareas */}
            <TabsContent value="homeworks">
              <Card>
                <CardHeader>
                  <CardTitle>Tareas Asignadas</CardTitle>
                  <CardDescription>
                    Tareas creadas por el profesor
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {totalHomeworks === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="size-12 text-muted-foreground mx-auto mb-3 opacity-80" />
                      <h3 className="text-lg font-medium mb-1">
                        No hay tareas asignadas
                      </h3>
                      <p className="text-muted-foreground max-w-md mx-auto">
                        Este profesor no ha creado tareas todavía.
                      </p>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <GraduationCap className="size-12 text-muted-foreground mx-auto mb-3 opacity-80" />
                      <h3 className="text-lg font-medium mb-1">
                        Módulo en desarrollo
                      </h3>
                      <p className="text-muted-foreground max-w-md mx-auto mb-4">
                        La vista detallada de tareas está actualmente en
                        desarrollo.
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Este profesor tiene un total de{" "}
                        <strong>{totalHomeworks}</strong> tareas asignadas en
                        sus <strong>{totalSubjects}</strong> materias.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
