import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { PrismaClient } from "@prisma/client";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  BookOpen,
  ChevronLeft,
  Calendar,
  School,
  Edit,
  Trash2,
  Users,
  FileText,
  Clock,
  Plus,
  DownloadCloud,
  Upload,
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
import { Separator } from "@/components/ui/separator";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
} from "@/components/ui/breadcrumb";

interface Subject {
  id: string;
  name: string;
  code: string;
  description: string | null;
  startDate: string;
  endDate: string;
  createdAt: string;
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
    status: string;
    enrolledAt: string;
    student: {
      id: string;
      studentId: string;
      user: {
        id: string;
        name: string;
        email: string;
        image: string | null;
      };
    };
  }>;
  homeworks: Array<{
    id: string;
    title: string;
    dueDate: string;
    totalPoints: number;
    submissions: Array<{
      id: string;
      status: string;
      student: {
        user: {
          name: string;
        };
      };
      grade: {
        score: number;
      } | null;
    }>;
  }>;
}

const prisma = new PrismaClient();

async function getSubject(id: string) {
  try {
    const subject = await prisma.subject.findUnique({
      where: { id },
      include: {
        teacher: {
          include: {
            user: true,
          },
        },
        enrollments: {
          include: {
            student: {
              include: {
                user: true,
              },
            },
          },
        },
        homeworks: {
          include: {
            submissions: {
              include: {
                student: {
                  include: {
                    user: true,
                  },
                },
                grade: true,
              },
            },
          },
        },
      },
    });

    return subject;
  } catch (error) {
    console.error("Error al obtener materia:", error);
    return null;
  }
}

export default async function SubjectDetailPage({
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

  const subject = await getSubject(params.id);

  if (!subject) {
    notFound();
  }

  // Calcular estadísticas
  const approvedEnrollments = subject.enrollments.filter(
    (e) => e.status === "APPROVED"
  ).length;
  const pendingEnrollments = subject.enrollments.filter(
    (e) => e.status === "PENDING"
  ).length;
  const rejectedEnrollments = subject.enrollments.filter(
    (e) => e.status === "REJECTED"
  ).length;

  const totalSubmissions = subject.homeworks.reduce(
    (acc, hw) => acc + hw.submissions.length,
    0
  );
  const gradedSubmissions = subject.homeworks.reduce(
    (acc, hw) =>
      acc + hw.submissions.filter((sub) => sub.grade !== null).length,
    0
  );

  // Verificar si el período de la materia ha terminado, está en curso o es futuro
  const now = new Date();
  const startDate = new Date(subject.startDate);
  const endDate = new Date(subject.endDate);

  let status = "upcoming";
  if (now > endDate) {
    status = "completed";
  } else if (now >= startDate) {
    status = "active";
  }

  return (
    <div className="container py-10">
      <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-8">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            asChild
            className="hidden sm:flex"
          >
            <Link href="/admin/subjects">
              <ChevronLeft className="size-5" />
            </Link>
          </Button>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-3xl font-bold">{subject.name}</h1>
              <Badge variant="outline">{subject.code}</Badge>
              {status === "active" && (
                <Badge variant="default" className="ml-2">
                  Activa
                </Badge>
              )}
              {status === "completed" && (
                <Badge variant="secondary" className="ml-2">
                  Finalizada
                </Badge>
              )}
              {status === "upcoming" && (
                <Badge variant="outline" className="ml-2">
                  Próxima
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Calendar className="size-4" />
              <span>
                {format(new Date(subject.startDate), "d MMM", { locale: es })} -{" "}
                {format(new Date(subject.endDate), "d MMM, yyyy", {
                  locale: es,
                })}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <Button variant="outline" asChild>
            <Link href={`/admin/subjects/${subject.id}/edit`}>
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
              <CardTitle>Información de la Materia</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Profesor</p>
                  <div className="flex items-center gap-2">
                    <Avatar>
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
                    <div>
                      <p className="font-medium">{subject.teacher.user.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {subject.teacher.user.email}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Descripción
                  </p>
                  <p className="text-sm">
                    {subject.description || "Sin descripción"}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Período</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="size-4 text-muted-foreground" />
                    <span>
                      {format(new Date(subject.startDate), "d MMMM, yyyy", {
                        locale: es,
                      })}
                      {" - "}
                      {format(new Date(subject.endDate), "d MMMM, yyyy", {
                        locale: es,
                      })}
                    </span>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Creada el
                  </p>
                  <div className="flex items-center gap-2">
                    <Clock className="size-4 text-muted-foreground" />
                    <span>
                      {format(new Date(subject.createdAt), "d MMMM, yyyy", {
                        locale: es,
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t pt-4 flex flex-col gap-2">
              <Button className="w-full" variant="outline" asChild>
                <Link href={`/admin/subjects/${subject.id}/edit`}>
                  <Edit className="mr-2 size-4" />
                  Editar Información
                </Link>
              </Button>
            </CardFooter>
          </Card>

          <Card className="mt-6">
            <CardHeader className="pb-0">
              <CardTitle>Estadísticas</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="border rounded-lg p-4 text-center">
                  <p className="text-muted-foreground text-sm">Estudiantes</p>
                  <p className="text-3xl font-bold mt-1">
                    {approvedEnrollments}
                  </p>
                </div>
                <div className="border rounded-lg p-4 text-center">
                  <p className="text-muted-foreground text-sm">Tareas</p>
                  <p className="text-3xl font-bold mt-1">
                    {subject.homeworks.length}
                  </p>
                </div>
                <div className="border rounded-lg p-4 text-center">
                  <p className="text-muted-foreground text-sm">Entregas</p>
                  <p className="text-3xl font-bold mt-1">{totalSubmissions}</p>
                </div>
                <div className="border rounded-lg p-4 text-center">
                  <p className="text-muted-foreground text-sm">Calificadas</p>
                  <p className="text-3xl font-bold mt-1">{gradedSubmissions}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Tabs defaultValue="students">
            <TabsList className="mb-6">
              <TabsTrigger value="students" className="flex gap-2">
                <Users className="size-4" />
                <span>Estudiantes</span>
                <Badge variant="secondary" className="ml-1">
                  {approvedEnrollments}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="homeworks" className="flex gap-2">
                <FileText className="size-4" />
                <span>Tareas</span>
                <Badge variant="secondary" className="ml-1">
                  {subject.homeworks.length}
                </Badge>
              </TabsTrigger>
            </TabsList>

            {/* Tab: Estudiantes */}
            <TabsContent value="students">
              <Card>
                <CardHeader className="flex-row flex justify-between items-center pb-3">
                  <div>
                    <CardTitle>Estudiantes Inscritos</CardTitle>
                    <CardDescription>
                      Estudiantes que están tomando esta materia
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Plus className="mr-2 size-4" />
                          Añadir Estudiante
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Opciones</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link
                            href={`/admin/subjects/${subject.id}/add-students`}
                          >
                            <Users className="mr-2 size-4" />
                            Añadir estudiantes
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Upload className="mr-2 size-4" />
                          Importar desde CSV
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  {subject.enrollments.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="size-12 text-muted-foreground mx-auto mb-3 opacity-80" />
                      <h3 className="text-lg font-medium mb-1">
                        No hay estudiantes inscritos
                      </h3>
                      <p className="text-muted-foreground max-w-md mx-auto mb-4">
                        Esta materia no tiene estudiantes inscritos actualmente.
                      </p>
                      <Button asChild>
                        <Link
                          href={`/admin/subjects/${subject.id}/add-students`}
                        >
                          <Plus className="mr-2 size-4" />
                          Añadir Estudiantes
                        </Link>
                      </Button>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nombre</TableHead>
                          <TableHead>ID Estudiante</TableHead>
                          <TableHead>Correo</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Fecha de Inscripción</TableHead>
                          <TableHead>Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {subject.enrollments
                          .sort((a: any, b: any) =>
                            a.student.user.name.localeCompare(
                              b.student.user.name
                            )
                          )
                          .map((enrollment) => (
                            <TableRow key={enrollment.id}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Avatar className="size-8">
                                    <AvatarImage
                                      src={enrollment.student.user.image || ""}
                                    />
                                    <AvatarFallback>
                                      {enrollment.student.user.name &&
                                        enrollment.student.user.name
                                          .split(" ")
                                          .map((n) => n[0])
                                          .join("")
                                          .toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="font-medium">
                                    {enrollment.student.user.name}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {enrollment.student.studentId}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {enrollment.student.user.email}
                              </TableCell>
                              <TableCell>
                                {enrollment.status === "APPROVED" ? (
                                  <Badge>Aprobado</Badge>
                                ) : enrollment.status === "PENDING" ? (
                                  <Badge variant="secondary">Pendiente</Badge>
                                ) : (
                                  <Badge variant="destructive">Rechazado</Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                {format(
                                  new Date(enrollment.enrolledAt),
                                  "d MMM, yyyy",
                                  { locale: es }
                                )}
                              </TableCell>
                              <TableCell>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      Acciones
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem asChild>
                                      <Link
                                        href={`/admin/students/${enrollment.student.id}`}
                                      >
                                        <Users className="mr-2 size-4" />
                                        Ver perfil
                                      </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="text-destructive focus:text-destructive">
                                      <Trash2 className="mr-2 size-4" />
                                      Eliminar de la materia
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
                <CardFooter className="border-t pt-4">
                  <Button asChild variant="outline" className="w-full">
                    <Link href={`/admin/subjects/${subject.id}/students`}>
                      Ver Todos los Estudiantes
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            {/* Tab: Tareas */}
            <TabsContent value="homeworks">
              <Card>
                <CardHeader className="flex-row flex justify-between items-center pb-3">
                  <div>
                    <CardTitle>Tareas Asignadas</CardTitle>
                    <CardDescription>
                      Tareas y evaluaciones de la materia
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link
                        href={`/admin/subjects/${subject.id}/homeworks/create`}
                      >
                        <Plus className="mr-2 size-4" />
                        Crear Tarea
                      </Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {subject.homeworks.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="size-12 text-muted-foreground mx-auto mb-3 opacity-80" />
                      <h3 className="text-lg font-medium mb-1">
                        No hay tareas asignadas
                      </h3>
                      <p className="text-muted-foreground max-w-md mx-auto mb-4">
                        Aún no se han creado tareas para esta materia.
                      </p>
                      <Button asChild>
                        <Link
                          href={`/admin/subjects/${subject.id}/homeworks/create`}
                        >
                          <Plus className="mr-2 size-4" />
                          Crear Tarea
                        </Link>
                      </Button>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Título</TableHead>
                          <TableHead>Fecha de Entrega</TableHead>
                          <TableHead>Puntos</TableHead>
                          <TableHead>Entregas</TableHead>
                          <TableHead>Calificadas</TableHead>
                          <TableHead>Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {subject.homeworks
                          .sort(
                            (a, b) =>
                              new Date(b.dueDate).getTime() -
                              new Date(a.dueDate).getTime()
                          )
                          .map((homework) => {
                            const submissionsCount =
                              homework.submissions.length;
                            const gradedCount = homework.submissions.filter(
                              (s) => s.grade !== null
                            ).length;
                            const isPastDue =
                              new Date(homework.dueDate) < new Date();

                            return (
                              <TableRow key={homework.id}>
                                <TableCell className="font-medium">
                                  <Link
                                    href={`/admin/subjects/${subject.id}/homeworks/${homework.id}`}
                                    className="hover:underline"
                                  >
                                    {homework.title}
                                  </Link>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Calendar className="size-4 text-muted-foreground" />
                                    <span>
                                      {format(
                                        new Date(homework.dueDate),
                                        "d MMM, yyyy",
                                        { locale: es }
                                      )}
                                    </span>
                                    {isPastDue && (
                                      <Badge variant="secondary">Vencida</Badge>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>{homework.totalPoints}</TableCell>
                                <TableCell>
                                  <Badge variant="outline">
                                    {submissionsCount}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant={
                                      gradedCount === 0
                                        ? "outline"
                                        : gradedCount === submissionsCount
                                        ? "default"
                                        : "secondary"
                                    }
                                  >
                                    {gradedCount} / {submissionsCount}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm">
                                        Acciones
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem asChild>
                                        <Link
                                          href={`/admin/subjects/${subject.id}/homeworks/${homework.id}`}
                                        >
                                          <FileText className="mr-2 size-4" />
                                          Ver detalles
                                        </Link>
                                      </DropdownMenuItem>
                                      <DropdownMenuItem asChild>
                                        <Link
                                          href={`/admin/subjects/${subject.id}/homeworks/${homework.id}/edit`}
                                        >
                                          <Edit className="mr-2 size-4" />
                                          Editar
                                        </Link>
                                      </DropdownMenuItem>
                                      <DropdownMenuItem asChild>
                                        <Link
                                          href={`/admin/subjects/${subject.id}/homeworks/${homework.id}/submissions`}
                                        >
                                          <DownloadCloud className="mr-2 size-4" />
                                          Ver entregas
                                        </Link>
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem className="text-destructive focus:text-destructive">
                                        <Trash2 className="mr-2 size-4" />
                                        Eliminar
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
                <CardFooter className="border-t pt-4">
                  <Button asChild variant="outline" className="w-full">
                    <Link href={`/admin/subjects/${subject.id}/homeworks`}>
                      Ver Todas las Tareas
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
