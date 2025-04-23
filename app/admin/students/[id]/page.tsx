import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { PrismaClient } from "@prisma/client";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Users,
  ChevronLeft,
  Calendar,
  Mail,
  BookOpen,
  FileText,
  GraduationCap,
  Edit,
  Trash2,
  Loader2,
  KeyRound,
  Clock,
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
    createdAt: string;
  };
  enrollments: Array<{
    id: string;
    status: string;
    enrolledAt: string;
    subject: {
      id: string;
      name: string;
      code: string;
      teacherId: string;
      teacher: {
        user: {
          name: string;
        };
      };
    };
  }>;
  submissions: Array<{
    id: string;
    status: string;
    submittedAt: string;
    homework: {
      id: string;
      title: string;
      subject: {
        id: string;
        name: string;
        code: string;
      };
    };
    grade: {
      id: string;
      score: number;
      gradedAt: string;
    } | null;
  }>;
  grades: Array<{
    id: string;
    score: number;
    gradedAt: string;
    teacher: {
      user: {
        name: string;
      };
    };
    submission: {
      homework: {
        title: string;
        subject: {
          name: string;
        };
      };
    };
  }>;
}

const prisma = new PrismaClient();

async function getStudent(id: string) {
  try {
    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        user: true,
        enrollments: {
          include: {
            subject: {
              include: {
                teacher: {
                  include: {
                    user: true,
                  },
                },
              },
            },
          },
        },
        submissions: {
          include: {
            homework: {
              include: {
                subject: true,
              },
            },
            grade: true,
          },
        },
        grades: {
          include: {
            teacher: {
              include: {
                user: true,
              },
            },
            submission: {
              include: {
                homework: {
                  include: {
                    subject: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return student;
  } catch (error) {
    console.error("Error al obtener estudiante:", error);
    return null;
  }
}

export default async function StudentDetailPage({
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

  const student = await getStudent(params.id);

  if (!student) {
    notFound();
  }

  // Calcular promedio de calificaciones
  const averageGrade =
    student.grades.length > 0
      ? student.grades.reduce((sum, grade) => sum + grade.score, 0) /
        student.grades.length
      : null;

  // Generar iniciales para el avatar
  const initials = student.user.name
    ? student.user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "ST";

  return (
    <div className="container py-10">
      <div className="mb-6">
        <Breadcrumb>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={"/admin/students"}>Dashboard</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={"/admin/students"}>Estudiantes</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <BreadcrumbLink>{student.user.name}</BreadcrumbLink>
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
            <Link href="/admin/students">
              <ChevronLeft className="size-5" />
            </Link>
          </Button>

          <div>
            <h1 className="text-3xl font-bold mb-2">{student.user.name}</h1>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Users className="size-4" />
              <span className="mr-4">Estudiante</span>
              <Badge variant="outline">{student.studentId}</Badge>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <Button variant="outline" asChild>
            <Link href={`/admin/students/${student.id}/edit`}>
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
              <CardTitle>Información del Estudiante</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center mb-6">
                <Avatar className="size-20 mb-4">
                  <AvatarImage src={student.user.image || ""} />
                  <AvatarFallback className="text-xl">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <h3 className="text-xl font-semibold">{student.user.name}</h3>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Mail className="size-4" />
                  <span>{student.user.email}</span>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    ID de Estudiante
                  </p>
                  <div className="flex justify-between items-center">
                    <Badge variant="outline" className="text-base px-3 py-1">
                      {student.studentId}
                    </Badge>
                    <Button variant="ghost" size="sm">
                      <Loader2 className="size-4 mr-1" />
                      Regenerar
                    </Button>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Estado</p>
                  <div className="flex items-center gap-2">
                    {student.isActivated ? (
                      <>
                        <Badge>Activado</Badge>
                        <span className="text-sm text-muted-foreground">
                          Puede iniciar sesión
                        </span>
                      </>
                    ) : (
                      <>
                        <Badge variant="secondary">Pendiente</Badge>
                        <span className="text-sm text-muted-foreground">
                          Activación pendiente
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Fecha de Registro
                  </p>
                  <div className="flex items-center gap-2">
                    <Calendar className="size-4 text-muted-foreground" />
                    <span>
                      {format(new Date(student.joinedAt), "d MMMM, yyyy", {
                        locale: es,
                      })}
                    </span>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Última Actividad
                  </p>
                  <div className="flex items-center gap-2">
                    <Clock className="size-4 text-muted-foreground" />
                    <span>No disponible</span>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t pt-4 flex flex-col gap-2">
              <Button className="w-full" variant="outline">
                <KeyRound className="mr-2 size-4" />
                Resetear Contraseña
              </Button>
              <Button className="w-full" asChild>
                <Link href={`/admin/students/${student.id}/edit`}>
                  <Edit className="mr-2 size-4" />
                  Editar Datos
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
                  <p className="text-muted-foreground text-sm">Materias</p>
                  <p className="text-3xl font-bold mt-1">
                    {student.enrollments.length}
                  </p>
                </div>
                <div className="border rounded-lg p-4 text-center">
                  <p className="text-muted-foreground text-sm">Entregas</p>
                  <p className="text-3xl font-bold mt-1">
                    {student.submissions.length}
                  </p>
                </div>
                <div className="border rounded-lg p-4 text-center">
                  <p className="text-muted-foreground text-sm">Promedio</p>
                  <p className="text-3xl font-bold mt-1">
                    {averageGrade ? averageGrade.toFixed(1) : "N/A"}
                  </p>
                </div>
                <div className="border rounded-lg p-4 text-center">
                  <p className="text-muted-foreground text-sm">
                    Calificaciones
                  </p>
                  <p className="text-3xl font-bold mt-1">
                    {student.grades.length}
                  </p>
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
              </TabsTrigger>
              <TabsTrigger value="submissions" className="flex gap-2">
                <FileText className="size-4" />
                <span>Entregas</span>
              </TabsTrigger>
              <TabsTrigger value="grades" className="flex gap-2">
                <GraduationCap className="size-4" />
                <span>Calificaciones</span>
              </TabsTrigger>
            </TabsList>

            {/* Tab: Materias */}
            <TabsContent value="subjects">
              <Card>
                <CardHeader>
                  <CardTitle>Materias Inscritas</CardTitle>
                  <CardDescription>
                    Materias en las que está inscrito el estudiante
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {student.enrollments.length === 0 ? (
                    <div className="text-center py-8">
                      <BookOpen className="size-12 text-muted-foreground mx-auto mb-3 opacity-80" />
                      <h3 className="text-lg font-medium mb-1">
                        No hay materias inscritas
                      </h3>
                      <p className="text-muted-foreground max-w-md mx-auto">
                        El estudiante no está inscrito en ninguna materia
                        actualmente.
                      </p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nombre</TableHead>
                          <TableHead>Código</TableHead>
                          <TableHead>Profesor</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Inscrito el</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {student.enrollments.map((enrollment) => (
                          <TableRow key={enrollment.id}>
                            <TableCell className="font-medium">
                              <Link
                                href={`/admin/subjects/${enrollment.subject.id}`}
                                className="hover:underline"
                              >
                                {enrollment.subject.name}
                              </Link>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {enrollment.subject.code}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {enrollment.subject.teacher.user.name}
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
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Entregas */}
            <TabsContent value="submissions">
              <Card>
                <CardHeader>
                  <CardTitle>Entregas de Tareas</CardTitle>
                  <CardDescription>
                    Historial de entregas realizadas por el estudiante
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {student.submissions.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="size-12 text-muted-foreground mx-auto mb-3 opacity-80" />
                      <h3 className="text-lg font-medium mb-1">
                        No hay entregas realizadas
                      </h3>
                      <p className="text-muted-foreground max-w-md mx-auto">
                        El estudiante no ha realizado entregas de tareas.
                      </p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tarea</TableHead>
                          <TableHead>Materia</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Calificación</TableHead>
                          <TableHead>Fecha</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {student.submissions.map((submission) => (
                          <TableRow key={submission.id}>
                            <TableCell className="font-medium">
                              {submission.homework.title}
                            </TableCell>
                            <TableCell>
                              {submission.homework.subject.name}
                            </TableCell>
                            <TableCell>
                              {submission.status === "GRADED" ? (
                                <Badge>Calificado</Badge>
                              ) : submission.status === "SUBMITTED" ? (
                                <Badge variant="secondary">Entregado</Badge>
                              ) : (
                                <Badge variant="outline">Pendiente</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {submission.grade ? (
                                <span className="font-medium">
                                  {submission.grade.score}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">
                                  Sin calificar
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              {format(
                                new Date(submission.submittedAt),
                                "d MMM, yyyy",
                                { locale: es }
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Calificaciones */}
            <TabsContent value="grades">
              <Card>
                <CardHeader>
                  <CardTitle>Calificaciones</CardTitle>
                  <CardDescription>
                    Historial de calificaciones del estudiante
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {student.grades.length === 0 ? (
                    <div className="text-center py-8">
                      <GraduationCap className="size-12 text-muted-foreground mx-auto mb-3 opacity-80" />
                      <h3 className="text-lg font-medium mb-1">
                        No hay calificaciones
                      </h3>
                      <p className="text-muted-foreground max-w-md mx-auto">
                        El estudiante no tiene calificaciones registradas.
                      </p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tarea</TableHead>
                          <TableHead>Materia</TableHead>
                          <TableHead>Calificación</TableHead>
                          <TableHead>Profesor</TableHead>
                          <TableHead>Fecha</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {student.grades.map((grade) => (
                          <TableRow key={grade.id}>
                            <TableCell className="font-medium">
                              {grade.submission.homework.title}
                            </TableCell>
                            <TableCell>
                              {grade.submission.homework.subject.name}
                            </TableCell>
                            <TableCell className="font-medium">
                              {grade.score}
                            </TableCell>
                            <TableCell>{grade.teacher.user.name}</TableCell>
                            <TableCell>
                              {format(new Date(grade.gradedAt), "d MMM, yyyy", {
                                locale: es,
                              })}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
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
