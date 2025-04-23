import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { PrismaClient } from "@prisma/client";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Calendar,
  BookOpen,
  Users,
  GraduationCap,
  Clock,
  Bell,
  FileText,
  ArrowRight,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const prisma = new PrismaClient();

// Obtener datos del dashboard del profesor
async function getTeacherDashboardData(userId: string) {
  try {
    // Obtener datos del profesor
    const teacher = await prisma.teacher.findFirst({
      where: { userId },
    });

    if (!teacher) {
      return null;
    }

    // Obtener materias que imparte el profesor
    const subjects = await prisma.subject.findMany({
      where: { teacherId: teacher.id },
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
      },
      orderBy: { startDate: "desc" },
    });

    // Obtener tareas recientes
    const recentHomeworks = await prisma.homework.findMany({
      where: { teacherId: teacher.id },
      include: {
        subject: true,
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
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    // Obtener solicitudes de inscripción pendientes
    const pendingEnrollments = await prisma.enrollment.findMany({
      where: {
        subject: { teacherId: teacher.id },
        status: "PENDING",
      },
      include: {
        student: {
          include: {
            user: true,
          },
        },
        subject: true,
      },
      orderBy: { enrolledAt: "desc" },
    });

    // Obtener envíos recientes para calificar
    const recentSubmissions = await prisma.submission.findMany({
      where: {
        homework: {
          teacherId: teacher.id,
        },
        grade: null, // Sin calificar
      },
      include: {
        student: {
          include: {
            user: true,
          },
        },
        homework: {
          include: {
            subject: true,
          },
        },
      },
      orderBy: { submittedAt: "desc" },
      take: 5,
    });

    // Contar estudiantes activos
    const activeStudentsGroup = await prisma.enrollment.groupBy({
      where: {
        subject: { teacherId: teacher.id },
        status: "APPROVED",
      },
      by: ["studentId"],
    });
    const activeStudentsCount = activeStudentsGroup.length;

    // Contar tareas pendientes de calificar
    const pendingGradesCount = await prisma.submission.count({
      where: {
        homework: { teacherId: teacher.id },
        grade: null,
      },
    });

    return {
      teacher,
      subjects,
      recentHomeworks,
      pendingEnrollments,
      recentSubmissions,
      stats: {
        subjectsCount: subjects.length,
        activeStudentsCount,
        pendingGradesCount,
        pendingEnrollmentsCount: pendingEnrollments.length,
      },
    };
  } catch (error) {
    console.error("Error al obtener datos del dashboard:", error);
    return null;
  }
}

export default async function TeacherDashboard() {
  const session = await auth();

  if (!session || session.user.role !== "TEACHER") {
    redirect("/login");
  }

  const data = await getTeacherDashboardData(session.user.id);

  if (!data) {
    return (
      <div className="container py-10">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <AlertCircle className="size-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">
            No se encontraron datos de profesor
          </h2>
          <p className="text-muted-foreground max-w-md">
            No pudimos encontrar tu información de profesor. Si crees que esto
            es un error, por favor contacta a soporte.
          </p>
        </div>
      </div>
    );
  }

  const {
    subjects,
    recentHomeworks,
    pendingEnrollments,
    recentSubmissions,
    stats,
  } = data;

  // Obtener materias actualmente activas
  const activeSubjects = subjects.filter(
    (subject) =>
      new Date(subject.startDate) <= new Date() &&
      new Date(subject.endDate) >= new Date()
  );

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-2">
        ¡Bienvenid@, Profesor(a) {session.user.name.split(" ")[0]}!
      </h1>
      <p className="text-muted-foreground mb-8">
        Panel de control para administrar tus cursos y estudiantes
      </p>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Materias</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <BookOpen className="size-5 text-primary mr-2" />
              <span className="text-2xl font-bold">{stats.subjectsCount}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Estudiantes Activos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Users className="size-5 text-blue-500 mr-2" />
              <span className="text-2xl font-bold">
                {stats.activeStudentsCount}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Tareas por Calificar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Clock className="size-5 text-orange-500 mr-2" />
              <span className="text-2xl font-bold">
                {stats.pendingGradesCount}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Solicitudes Pendientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Bell className="size-5 text-destructive mr-2" />
              <span className="text-2xl font-bold">
                {stats.pendingEnrollmentsCount}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 mt-6 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Tareas por Calificar</CardTitle>
            <CardDescription>
              Envíos recientes pendientes de calificación
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentSubmissions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <GraduationCap className="size-10 text-muted-foreground mb-3" />
                <p className="text-muted-foreground">
                  No hay tareas pendientes por calificar
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentSubmissions.map((submission) => (
                  <div
                    key={submission.id}
                    className="flex items-start gap-4 border-b pb-4 last:border-0 last:pb-0"
                  >
                    <Avatar className="size-10">
                      <AvatarImage src={submission.student.user.image || ""} />
                      <AvatarFallback>
                        {(submission.student?.user.name ?? "NA")
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">
                        {submission.homework.title}
                      </h4>
                      <p className="text-sm text-muted-foreground truncate">
                        {submission.student.user.name} -{" "}
                        {submission.homework.subject.name}
                      </p>
                      <div className="flex items-center mt-1 text-xs">
                        <Clock className="size-3.5 mr-1 text-orange-500" />
                        <span>
                          Enviado el{" "}
                          {format(
                            new Date(submission.submittedAt),
                            "d 'de' MMMM",
                            { locale: es }
                          )}
                        </span>
                      </div>
                    </div>
                    <Button size="sm" asChild>
                      <Link
                        href={`/teacher/subjects/${submission.homework.subject.id}/homeworks/${submission.homework.id}/submissions/${submission.id}`}
                      >
                        Calificar
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
          {recentSubmissions.length > 0 && (
            <CardFooter>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/teacher/submissions">Ver todas las entregas</Link>
              </Button>
            </CardFooter>
          )}
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Solicitudes de Inscripción</CardTitle>
            <CardDescription>
              Aprueba o rechaza solicitudes de estudiantes
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pendingEnrollments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Users className="size-10 text-muted-foreground mb-3" />
                <p className="text-muted-foreground">
                  No hay solicitudes pendientes
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingEnrollments.map((enrollment) => (
                  <div
                    key={enrollment.id}
                    className="flex items-start gap-4 border-b pb-4 last:border-0 last:pb-0"
                  >
                    <Avatar className="size-10">
                      <AvatarImage src={enrollment.student.user.image || ""} />
                      <AvatarFallback>
                        {(enrollment.student.user.name ?? "NA")
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">
                        {enrollment.student.user.name}
                      </h4>
                      <p className="text-sm text-muted-foreground truncate">
                        {enrollment.subject.name} ({enrollment.subject.code})
                      </p>
                      <div className="flex items-center mt-1 text-xs">
                        <Clock className="size-3.5 mr-1 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          Solicitud:{" "}
                          {format(
                            new Date(enrollment.enrolledAt),
                            "d 'de' MMMM",
                            { locale: es }
                          )}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive"
                      >
                        Rechazar
                      </Button>
                      <Button size="sm">Aprobar</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
          {pendingEnrollments.length > 0 && (
            <CardFooter>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/teacher/enrollments">
                  Gestionar todas las solicitudes
                </Link>
              </Button>
            </CardFooter>
          )}
        </Card>
      </div>

      <div className="grid gap-6 mt-6 md:grid-cols-12">
        <Card className="md:col-span-8">
          <CardHeader>
            <CardTitle>Mis Materias Activas</CardTitle>
            <CardDescription>
              Materias que estás impartiendo actualmente
            </CardDescription>
          </CardHeader>
          <CardContent>
            {activeSubjects.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <BookOpen className="size-10 text-muted-foreground mb-3" />
                <p className="text-muted-foreground">
                  No tienes materias activas en este momento
                </p>
                <Button className="mt-4" asChild>
                  <Link href="/teacher/subjects">Ver todas mis materias</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {activeSubjects.slice(0, 3).map((subject) => (
                  <div
                    key={subject.id}
                    className="flex items-start gap-4 rounded-lg border p-4"
                  >
                    <div className="bg-primary/10 p-2 rounded-full">
                      <BookOpen className="size-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{subject.name}</h3>
                        <Badge variant="outline" className="ml-2">
                          {subject.code}
                        </Badge>
                      </div>

                      <div className="text-sm text-muted-foreground mt-1">
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <Calendar className="size-3.5" />
                            {format(new Date(subject.startDate), "d MMM", {
                              locale: es,
                            })}{" "}
                            -
                            {format(new Date(subject.endDate), "d MMM, yyyy", {
                              locale: es,
                            })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="size-3.5" />
                            {
                              subject.enrollments.filter(
                                (e) => e.status === "APPROVED"
                              ).length
                            }{" "}
                            estudiantes
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/teacher/subjects/${subject.id}`}>
                        Gestionar
                        <ArrowRight className="ml-2 size-4" />
                      </Link>
                    </Button>
                  </div>
                ))}

                {activeSubjects.length > 3 && (
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/teacher/subjects">
                      Ver todas ({activeSubjects.length})
                    </Link>
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-4">
          <CardHeader>
            <CardTitle>Tareas Recientes</CardTitle>
            <CardDescription>Últimas tareas creadas</CardDescription>
          </CardHeader>
          <CardContent>
            {recentHomeworks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <FileText className="size-10 text-muted-foreground mb-3" />
                <p className="text-muted-foreground">
                  No has creado tareas recientemente
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentHomeworks.slice(0, 4).map((homework) => (
                  <div
                    key={homework.id}
                    className="flex flex-col gap-1 border-b pb-3 last:border-0 last:pb-0"
                  >
                    <Link
                      href={`/teacher/subjects/${homework.subject.id}/homeworks/${homework.id}`}
                      className="font-medium text-sm hover:underline hover:text-primary truncate"
                    >
                      {homework.title}
                    </Link>

                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{homework.subject.name}</span>
                      <div className="flex items-center gap-1">
                        <FileText className="size-3" />
                        <span>
                          {format(new Date(homework.dueDate), "d MMM", {
                            locale: es,
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-1 text-xs">
                      <div className="flex items-center gap-1 text-green-500">
                        <CheckCircle className="size-3" />
                        <span>
                          {homework.submissions.filter((s) => s.grade).length}{" "}
                          calificadas
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-orange-500">
                        <Clock className="size-3" />
                        <span>
                          {homework.submissions.filter((s) => !s.grade).length}{" "}
                          pendientes
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button className="w-full" asChild>
              <Link href="/teacher/homeworks/create">
                <FileText className="mr-2 size-4" />
                Crear nueva tarea
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

// Componente para el Skeleton loading
export function DashboardSkeleton() {
  return (
    <div className="container py-10">
      <Skeleton className="h-8 w-64 mb-2" />
      <Skeleton className="h-4 w-96 mb-8" />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {Array(4)
          .fill(0)
          .map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-6 w-16" />
              </CardContent>
            </Card>
          ))}
      </div>

      <div className="grid gap-6 mt-6 md:grid-cols-2">
        {Array(2)
          .fill(0)
          .map((_, i) => (
            <Card key={i} className="col-span-1">
              <CardHeader>
                <Skeleton className="h-5 w-40 mb-1" />
                <Skeleton className="h-4 w-60" />
              </CardHeader>
              <CardContent className="space-y-4">
                {Array(3)
                  .fill(0)
                  .map((_, j) => (
                    <div
                      key={j}
                      className="flex items-start gap-4 border-b pb-4 last:border-0 last:pb-0"
                    >
                      <Skeleton className="size-10 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-3 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  ))}
              </CardContent>
            </Card>
          ))}
      </div>
    </div>
  );
}
