import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { PrismaClient } from "@prisma/client";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  BookOpen,
  Users,
  Calendar,
  Clock,
  FileText,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Mail,
  GraduationCap,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

const prisma = new PrismaClient();

// Obtener datos de una materia específica
async function getSubjectData(subjectId: string, userId: string) {
  try {
    // Obtener el estudiante
    const student = await prisma.student.findFirst({
      where: { userId },
    });

    if (!student) {
      return null;
    }

    // Verificar que el estudiante esté inscrito en la materia
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        studentId: student.id,
        subjectId,
      },
    });

    if (!enrollment) {
      return null;
    }

    // Obtener la materia con su profesor
    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
      include: {
        teacher: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!subject) {
      return null;
    }

    // Obtener todas las tareas de la materia
    const homeworks = await prisma.homework.findMany({
      where: { subjectId },
      orderBy: { dueDate: "asc" },
    });

    // Para cada tarea, verificar si el estudiante la ha completado
    const homeworksWithStatus = await Promise.all(
      homeworks.map(async (homework) => {
        const submission = await prisma.submission.findFirst({
          where: {
            homeworkId: homework.id,
            studentId: student.id,
          },
          include: {
            grade: true,
          },
        });

        return {
          ...homework,
          status: submission
            ? submission.grade
              ? "graded"
              : "submitted"
            : "pending",
          submission,
        };
      })
    );

    // Calcular estadísticas
    const completedHomeworks = homeworksWithStatus.filter(
      (hw) => hw.status === "submitted" || hw.status === "graded"
    ).length;

    const pendingHomeworks = homeworksWithStatus.filter(
      (hw) => hw.status === "pending"
    ).length;

    const upcomingDeadlines = homeworksWithStatus
      .filter(
        (hw) => hw.status === "pending" && new Date(hw.dueDate) > new Date()
      )
      .sort(
        (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      )
      .slice(0, 3);

    // Calcular calificaciones
    const grades = homeworksWithStatus
      .filter((hw) => hw.status === "graded")
      .map((hw) => hw.submission.grade.score);

    const averageGrade = grades.length
      ? grades.reduce((acc, grade) => acc + grade, 0) / grades.length
      : 0;

    const progress = homeworks.length
      ? Math.round((completedHomeworks / homeworks.length) * 100)
      : 0;

    return {
      subject,
      homeworks: homeworksWithStatus,
      stats: {
        totalHomeworks: homeworks.length,
        completedHomeworks,
        pendingHomeworks,
        upcomingDeadlines,
        averageGrade,
        progress,
      },
    };
  } catch (error) {
    console.error("Error al obtener datos de la materia:", error);
    return null;
  }
}

export default async function SubjectDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();

  if (!session) {
    notFound();
  }

  const data = await getSubjectData(params.id, session.user.id);

  if (!data) {
    notFound();
  }

  const { subject, homeworks, stats } = data;

  // Generar iniciales del profesor para el Avatar
  const teacherInitials = subject.teacher.user.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="container py-10">
      <div className="mb-6">
        <Link
          href="/subjects"
          className="text-sm flex items-center text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="mr-1 size-4" />
          Volver a materias
        </Link>

        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-1">{subject.name}</h1>
            <p className="text-muted-foreground flex items-center gap-1">
              <BookOpen className="size-4" />
              <span>{subject.code}</span>
            </p>
          </div>

          <div className="flex gap-2 items-start">
            <Button variant="outline" asChild>
              <Link href={`/subjects/${subject.id}/homeworks`}>
                <FileText className="mr-2 size-4" />
                Ver Tareas
              </Link>
            </Button>
            <Button>
              <GraduationCap className="mr-2 size-4" />
              Mis Calificaciones
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Resumen de la Materia</CardTitle>
              <CardDescription>
                Información general y progreso actual
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Progreso General</span>
                  <span className="text-sm font-medium">{stats.progress}%</span>
                </div>
                <Progress value={stats.progress} className="h-2" />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-primary/10 rounded-md p-3 text-center">
                  <p className="text-xs text-muted-foreground">Promedio</p>
                  <p className="text-2xl font-bold mt-1">
                    {stats.averageGrade.toFixed(1)}
                  </p>
                </div>
                <div className="bg-green-500/10 rounded-md p-3 text-center">
                  <p className="text-xs text-muted-foreground">Completadas</p>
                  <p className="text-2xl font-bold mt-1">
                    {stats.completedHomeworks}
                  </p>
                </div>
                <div className="bg-orange-500/10 rounded-md p-3 text-center">
                  <p className="text-xs text-muted-foreground">Pendientes</p>
                  <p className="text-2xl font-bold mt-1">
                    {stats.pendingHomeworks}
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <h3 className="text-sm font-medium">Próximas Entregas</h3>
                {stats.upcomingDeadlines.length > 0 ? (
                  <div className="space-y-2 mt-3">
                    {stats.upcomingDeadlines.map((homework) => (
                      <div
                        key={homework.id}
                        className="flex items-start gap-3 p-3 rounded-md border"
                      >
                        <div className="bg-orange-500/10 p-2 rounded-md">
                          <Clock className="size-4 text-orange-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium truncate">
                            {homework.title}
                          </h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            Vence el{" "}
                            {format(new Date(homework.dueDate), "d 'de' MMMM", {
                              locale: es,
                            })}
                          </p>
                        </div>
                        <Button size="sm" asChild>
                          <Link
                            href={`/subjects/${subject.id}/homeworks/${homework.id}`}
                          >
                            Ver
                          </Link>
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground flex items-center gap-2 p-3">
                    <CheckCircle className="size-4 text-green-500" />
                    <span>No hay próximas entregas pendientes</span>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <h3 className="text-sm font-medium">Detalles de la Materia</h3>
                <div className="space-y-3 mt-3">
                  <div className="flex items-start gap-3 p-3 rounded-md border">
                    <div className="bg-muted p-2 rounded-md">
                      <Calendar className="size-4 text-foreground" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium">Periodo</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(
                          new Date(subject.startDate),
                          "d 'de' MMMM, yyyy",
                          { locale: es }
                        )}{" "}
                        -
                        {format(
                          new Date(subject.endDate),
                          "d 'de' MMMM, yyyy",
                          { locale: es }
                        )}
                      </p>
                    </div>
                  </div>

                  {subject.description && (
                    <div className="flex items-start gap-3 p-3 rounded-md border">
                      <div className="bg-muted p-2 rounded-md">
                        <FileText className="size-4 text-foreground" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium">Descripción</h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          {subject.description}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Profesor</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center text-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage
                    src={subject.teacher.user.image}
                    alt={subject.teacher.user.name}
                  />
                  <AvatarFallback className="text-lg">
                    {teacherInitials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-medium">{subject.teacher.user.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {subject.teacher.department || "Departamento Académico"}
                  </p>
                </div>
                <Button variant="outline" className="w-full" asChild>
                  <Link href={`mailto:${subject.teacher.user.email}`}>
                    <Mail className="mr-2 size-4" />
                    Contactar Profesor
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Tareas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <CheckCircle className="size-4 text-green-500" />
                  <span>Completadas ({stats.completedHomeworks})</span>
                </h3>
                <Progress
                  value={
                    stats.totalHomeworks
                      ? (stats.completedHomeworks / stats.totalHomeworks) * 100
                      : 0
                  }
                  className="h-2"
                />
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <AlertCircle className="size-4 text-orange-500" />
                  <span>Pendientes ({stats.pendingHomeworks})</span>
                </h3>
                <Progress
                  value={
                    stats.totalHomeworks
                      ? (stats.pendingHomeworks / stats.totalHomeworks) * 100
                      : 0
                  }
                  className="h-2 bg-muted"
                />
              </div>

              <div className="pt-2">
                <Button className="w-full" asChild>
                  <Link href={`/subjects/${subject.id}/homeworks`}>
                    Ver Todas las Tareas
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Últimas Tareas</CardTitle>
        </CardHeader>
        <CardContent>
          {homeworks.length === 0 ? (
            <div className="text-center py-6">
              <FileText className="mx-auto size-10 text-muted-foreground mb-3" />
              <h3 className="text-lg font-medium mb-1">
                No hay tareas disponibles
              </h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Esta materia aún no tiene tareas asignadas.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {homeworks.slice(0, 5).map((homework) => (
                <div
                  key={homework.id}
                  className="flex items-start gap-4 border rounded-md p-4"
                >
                  <div className={getHomeworkStatusIcon(homework.status)}>
                    {getHomeworkStatusIconContent(homework.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium truncate">{homework.title}</h4>
                      <Badge
                        variant={getHomeworkStatusVariant(homework.status)}
                      >
                        {getHomeworkStatusText(homework.status)}
                      </Badge>
                    </div>

                    {homework.description && (
                      <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                        {homework.description}
                      </p>
                    )}

                    <div className="flex items-center mt-2 text-xs text-muted-foreground">
                      <Clock className="size-3.5 mr-1" />
                      <span>
                        {new Date(homework.dueDate) < new Date()
                          ? `Venció el ${format(
                              new Date(homework.dueDate),
                              "d 'de' MMMM",
                              { locale: es }
                            )}`
                          : `Vence el ${format(
                              new Date(homework.dueDate),
                              "d 'de' MMMM",
                              { locale: es }
                            )}`}
                      </span>

                      {homework.status === "graded" &&
                        homework.submission.grade && (
                          <span className="ml-4 flex items-center">
                            <GraduationCap className="size-3.5 mr-1" />
                            Calificación: {homework.submission.grade.score}
                          </span>
                        )}
                    </div>
                  </div>
                  <Button size="sm" asChild>
                    <Link
                      href={`/subjects/${subject.id}/homeworks/${homework.id}`}
                    >
                      {homework.status === "pending"
                        ? "Realizar"
                        : "Ver Detalles"}
                    </Link>
                  </Button>
                </div>
              ))}

              {homeworks.length > 5 && (
                <div className="flex justify-center pt-2">
                  <Button variant="outline" asChild>
                    <Link href={`/subjects/${subject.id}/homeworks`}>
                      Ver Todas las Tareas
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Funciones de utilidad para el estado de las tareas
function getHomeworkStatusVariant(status: string) {
  switch (status) {
    case "graded":
      return "default";
    case "submitted":
      return "secondary";
    case "pending":
      return "outline";
    default:
      return "outline";
  }
}

function getHomeworkStatusText(status: string) {
  switch (status) {
    case "graded":
      return "Calificada";
    case "submitted":
      return "Entregada";
    case "pending":
      return "Pendiente";
    default:
      return "Pendiente";
  }
}

function getHomeworkStatusIcon(status: string) {
  switch (status) {
    case "graded":
      return "bg-primary/10 p-2 rounded-md";
    case "submitted":
      return "bg-secondary/10 p-2 rounded-md";
    case "pending":
      return "bg-orange-500/10 p-2 rounded-md";
    default:
      return "bg-muted p-2 rounded-md";
  }
}

function getHomeworkStatusIconContent(status: string) {
  switch (status) {
    case "graded":
      return <GraduationCap className="size-4 text-primary" />;
    case "submitted":
      return <CheckCircle className="size-4 text-secondary-foreground" />;
    case "pending":
      return <Clock className="size-4 text-orange-500" />;
    default:
      return <FileText className="size-4" />;
  }
}
