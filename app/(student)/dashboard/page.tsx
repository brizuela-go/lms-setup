import { Suspense } from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { PrismaClient } from "@prisma/client";
import {
  CalendarCheck,
  GraduationCap,
  Clock,
  BookOpen,
  AlertCircle,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";

const prisma = new PrismaClient();

async function getStudentData(userId: string) {
  try {
    // Obtener datos del estudiante y sus materias inscritas
    const student = await prisma.student.findFirst({
      where: { userId },
      include: {
        enrollments: {
          include: {
            subject: true,
          },
        },
      },
    });

    if (!student) {
      return null;
    }

    // Obtener tareas pendientes
    const pendingHomeworks = await prisma.homework.findMany({
      where: {
        subject: {
          enrollments: {
            some: {
              studentId: student.id,
            },
          },
        },
        dueDate: {
          gt: new Date(),
        },
        submissions: {
          none: {
            studentId: student.id,
          },
        },
      },
      include: {
        subject: true,
      },
      orderBy: {
        dueDate: "asc",
      },
      take: 5,
    });

    // Obtener calificaciones recientes
    const recentGrades = await prisma.grade.findMany({
      where: {
        studentId: student.id,
      },
      include: {
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
      orderBy: {
        gradedAt: "desc",
      },
      take: 5,
    });

    return {
      student,
      enrolledSubjects: student.enrollments.map((e) => e.subject),
      pendingHomeworks,
      recentGrades,
    };
  } catch (error) {
    console.error("Error al obtener datos del estudiante:", error);
    return null;
  }
}

export default async function StudentDashboard() {
  const session = await auth();

  if (!session || session.user.role !== "STUDENT") {
    redirect("/login");
  }

  const data = await getStudentData(session.user.id);

  if (!data) {
    return (
      <div className="container py-10">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <AlertCircle className="size-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">
            No se encontraron datos de estudiante
          </h2>
          <p className="text-muted-foreground max-w-md">
            No pudimos encontrar tu información de estudiante. Si crees que esto
            es un error, por favor contacta a soporte.
          </p>
        </div>
      </div>
    );
  }

  const { student, enrolledSubjects, pendingHomeworks, recentGrades } = data;

  // Calcular progreso general (promedio de todas las asignaturas)
  const overallProgress =
    enrolledSubjects.length > 0
      ? Math.round(
          enrolledSubjects.reduce((acc, subject) => {
            // Aquí podríamos calcular el progreso real de cada asignatura
            return acc + 50; // Por ahora, un valor fijo para ejemplo
          }, 0) / enrolledSubjects.length
        )
      : 0;

  return (
    <div className="py-10">
      <h1 className="text-3xl font-bold mb-2">
        ¡Bienvenid@, {session.user.name}!
      </h1>
      <p className="text-muted-foreground mb-8">
        Aquí está un resumen de tu actividad académica
      </p>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Materias Inscritas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <GraduationCap className="size-5 text-primary mr-2" />
              <span className="text-2xl font-bold">
                {enrolledSubjects.length}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Tareas Pendientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Clock className="size-5 text-orange-500 mr-2" />
              <span className="text-2xl font-bold">
                {pendingHomeworks.length}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Tareas Completadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <CalendarCheck className="size-5 text-green-500 mr-2" />
              <span className="text-2xl font-bold">{recentGrades.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Progreso General
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              <Progress value={overallProgress} className="h-2" />
              <p className="text-xs text-muted-foreground text-right">
                {overallProgress}% completado
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 mt-6 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Tareas Pendientes</CardTitle>
            <CardDescription>Próximas entregas</CardDescription>
          </CardHeader>
          <CardContent>
            {pendingHomeworks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CalendarCheck className="size-10 text-muted-foreground mb-3" />
                <p className="text-muted-foreground">
                  No tienes tareas pendientes por el momento
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingHomeworks.map((homework) => (
                  <div
                    key={homework.id}
                    className="flex items-start gap-4 border-b pb-4 last:border-0 last:pb-0"
                  >
                    <div className="bg-primary/10 p-2 rounded-md">
                      <BookOpen className="size-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{homework.title}</h4>
                      <p className="text-sm text-muted-foreground truncate">
                        {homework.subject.name}
                      </p>
                      <div className="flex items-center mt-1 text-xs">
                        <Clock className="size-3.5 mr-1 text-orange-500" />
                        <span>
                          Vence el{" "}
                          {format(new Date(homework.dueDate), "d 'de' MMMM", {
                            locale: es,
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Calificaciones Recientes</CardTitle>
            <CardDescription>Tus últimas evaluaciones</CardDescription>
          </CardHeader>
          <CardContent>
            {recentGrades.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <GraduationCap className="size-10 text-muted-foreground mb-3" />
                <p className="text-muted-foreground">
                  No tienes calificaciones recientes
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentGrades.map((grade) => (
                  <div
                    key={grade.id}
                    className="flex items-start gap-4 border-b pb-4 last:border-0 last:pb-0"
                  >
                    <div
                      className={`p-2 rounded-md ${getScoreColor(grade.score)}`}
                    >
                      <span className="text-lg font-semibold">
                        {grade.score}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">
                        {grade.submission.homework.title}
                      </h4>
                      <p className="text-sm text-muted-foreground truncate">
                        {grade.submission.homework.subject.name}
                      </p>
                      <div className="flex items-center mt-1 text-xs text-muted-foreground">
                        {format(new Date(grade.gradedAt), "d 'de' MMMM, yyyy", {
                          locale: es,
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Mis Materias</CardTitle>
          <CardDescription>
            Asignaturas en las que estás inscrito
          </CardDescription>
        </CardHeader>
        <CardContent>
          {enrolledSubjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <BookOpen className="size-10 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">
                No estás inscrito en ninguna materia
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {enrolledSubjects.map((subject) => (
                <Card key={subject.id} className="overflow-hidden">
                  <div className="h-2 bg-primary" />
                  <CardHeader className="pb-2">
                    <CardTitle className="truncate text-lg">
                      {subject.name}
                    </CardTitle>
                    <CardDescription className="truncate">
                      {subject.code}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        Progreso
                      </span>
                      <span className="text-xs font-medium">50%</span>
                    </div>
                    <Progress value={50} className="h-1" />
                    <p className="text-xs text-muted-foreground mt-2">
                      {format(new Date(subject.startDate), "d MMM", {
                        locale: es,
                      })}{" "}
                      -
                      {format(new Date(subject.endDate), "d MMM, yyyy", {
                        locale: es,
                      })}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
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
                      <Skeleton className="size-10 rounded-md" />
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

// Función para obtener el color en base a la calificación
function getScoreColor(score: number) {
  if (score >= 90) return "bg-green-500/10 text-green-500";
  if (score >= 80) return "bg-blue-500/10 text-blue-500";
  if (score >= 70) return "bg-yellow-500/10 text-yellow-500";
  if (score >= 60) return "bg-orange-500/10 text-orange-500";
  return "bg-red-500/10 text-red-500";
}
