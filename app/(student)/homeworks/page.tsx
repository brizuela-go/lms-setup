// app/(student)/homeworks/page.tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { PrismaClient } from "@prisma/client";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  FileText,
  Clock,
  BookOpen,
  Calendar,
  Search,
  Filter,
  CheckCircle,
  AlertCircle,
  GraduationCap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const prisma = new PrismaClient();

// Obtener todas las tareas del estudiante
async function getStudentHomeworks(userId: string) {
  try {
    // Obtener el estudiante
    const student = await prisma.student.findFirst({
      where: { userId },
    });

    if (!student) {
      return null;
    }

    // Obtener las materias del estudiante
    const enrollments = await prisma.enrollment.findMany({
      where: {
        studentId: student.id,
        status: "APPROVED",
      },
      include: {
        subject: true,
      },
    });

    // Obtener todas las tareas de las materias en las que está inscrito
    const subjectIds = enrollments.map((e) => e.subject.id);

    if (subjectIds.length === 0) {
      return {
        student,
        pendingHomeworks: [],
        completedHomeworks: [],
        overdueHomeworks: [],
        subjects: [],
      };
    }

    const homeworks = await prisma.homework.findMany({
      where: {
        subjectId: { in: subjectIds },
      },
      include: {
        subject: true,
        submissions: {
          where: {
            studentId: student.id,
          },
          include: {
            grade: true,
          },
        },
      },
    });

    // Clasificar las tareas
    const now = new Date();

    const pendingHomeworks = homeworks.filter((hw) => {
      return hw.submissions.length === 0 && new Date(hw.dueDate) > now;
    });

    const completedHomeworks = homeworks.filter((hw) => {
      return hw.submissions.length > 0;
    });

    const overdueHomeworks = homeworks.filter((hw) => {
      return hw.submissions.length === 0 && new Date(hw.dueDate) <= now;
    });

    return {
      student,
      pendingHomeworks,
      completedHomeworks,
      overdueHomeworks,
      subjects: enrollments.map((e) => e.subject),
    };
  } catch (error) {
    console.error("Error al obtener tareas:", error);
    return null;
  }
}

export default async function HomeworksPage() {
  const session = await auth();

  if (!session || session.user.role !== "STUDENT") {
    redirect("/login");
  }

  const data = await getStudentHomeworks(session.user.id);

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

  const { pendingHomeworks, completedHomeworks, overdueHomeworks, subjects } =
    data;

  // Calcular estadísticas
  const totalHomeworks =
    pendingHomeworks.length +
    completedHomeworks.length +
    overdueHomeworks.length;
  const completionRate =
    totalHomeworks > 0
      ? Math.round((completedHomeworks.length / totalHomeworks) * 100)
      : 0;

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-2">Mis Tareas</h1>
      <p className="text-muted-foreground mb-8">
        Administra y visualiza todas tus tareas pendientes y completadas
      </p>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Tareas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <FileText className="size-5 text-muted-foreground mr-2" />
              <span className="text-2xl font-bold">{totalHomeworks}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
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
            <CardTitle className="text-sm font-medium">Completadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <CheckCircle className="size-5 text-green-500 mr-2" />
              <span className="text-2xl font-bold">
                {completedHomeworks.length}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Vencidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <AlertCircle className="size-5 text-destructive mr-2" />
              <span className="text-2xl font-bold">
                {overdueHomeworks.length}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Progreso General</CardTitle>
            <CardDescription>Tu avance en la entrega de tareas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Progreso Total</span>
                  <span className="text-sm font-medium">{completionRate}%</span>
                </div>
                <Progress value={completionRate} className="h-2" />
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {subjects.map((subject) => {
                  // Calcular progreso por materia
                  const subjectHomeworks = [
                    ...pendingHomeworks,
                    ...completedHomeworks,
                    ...overdueHomeworks,
                  ].filter((hw) => hw.subjectId === subject.id);

                  const subjectCompletedHomeworks = completedHomeworks.filter(
                    (hw) => hw.subjectId === subject.id
                  );

                  const subjectProgress =
                    subjectHomeworks.length > 0
                      ? Math.round(
                          (subjectCompletedHomeworks.length /
                            subjectHomeworks.length) *
                            100
                        )
                      : 0;

                  return (
                    <Card key={subject.id} className="overflow-hidden">
                      <div className="h-1 bg-primary" />
                      <CardContent className="p-4">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-medium truncate text-sm">
                            {subject.name}
                          </h4>
                          <Badge variant="outline" className="text-xs">
                            {subject.code}
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">
                              Progreso
                            </span>
                            <span>{subjectProgress}%</span>
                          </div>
                          <Progress value={subjectProgress} className="h-1.5" />
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="bg-card rounded-lg border shadow-sm mb-6">
        <div className="flex flex-col md:flex-row md:items-center gap-3 p-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar tareas..." className="pl-9" />
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Select defaultValue="all">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por materia" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las materias</SelectItem>
                {subjects.map((subject) => (
                  <SelectItem key={subject.id} value={subject.id}>
                    {subject.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select defaultValue="pending">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="pending">Pendientes</SelectItem>
                <SelectItem value="completed">Completadas</SelectItem>
                <SelectItem value="overdue">Vencidas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Tabs defaultValue="pending">
        <TabsList className="mb-6">
          <TabsTrigger value="pending" className="min-w-28">
            <Clock className="size-4 mr-2" />
            Pendientes ({pendingHomeworks.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="min-w-28">
            <CheckCircle className="size-4 mr-2" />
            Completadas ({completedHomeworks.length})
          </TabsTrigger>
          <TabsTrigger value="overdue" className="min-w-28">
            <AlertCircle className="size-4 mr-2" />
            Vencidas ({overdueHomeworks.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          {pendingHomeworks.length === 0 ? (
            <div className="text-center py-12 bg-muted/40 rounded-lg">
              <Clock className="mx-auto size-10 text-muted-foreground mb-3" />
              <h3 className="text-lg font-medium mb-1">
                No tienes tareas pendientes
              </h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                ¡Enhorabuena! Estás al día con todas tus tareas.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {pendingHomeworks.map((homework) => (
                <HomeworkCard
                  key={homework.id}
                  homework={homework}
                  status="pending"
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed">
          {completedHomeworks.length === 0 ? (
            <div className="text-center py-12 bg-muted/40 rounded-lg">
              <CheckCircle className="mx-auto size-10 text-muted-foreground mb-3" />
              <h3 className="text-lg font-medium mb-1">
                No tienes tareas completadas
              </h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Aún no has entregado ninguna tarea. Revisa tus tareas
                pendientes.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {completedHomeworks.map((homework) => (
                <HomeworkCard
                  key={homework.id}
                  homework={homework}
                  status="completed"
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="overdue">
          {overdueHomeworks.length === 0 ? (
            <div className="text-center py-12 bg-muted/40 rounded-lg">
              <AlertCircle className="mx-auto size-10 text-muted-foreground mb-3" />
              <h3 className="text-lg font-medium mb-1">
                No tienes tareas vencidas
              </h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                ¡Muy bien! No tienes tareas pendientes fuera de plazo.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {overdueHomeworks.map((homework) => (
                <HomeworkCard
                  key={homework.id}
                  homework={homework}
                  status="overdue"
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

type HomeworkStatus = "pending" | "completed" | "overdue";

interface HomeworkCardProps {
  homework: any; // Tipado simplificado para el ejemplo
  status: HomeworkStatus;
}

function HomeworkCard({ homework, status }: HomeworkCardProps) {
  const isGraded =
    homework.submissions.length > 0 && homework.submissions[0].grade;
  const score = isGraded ? homework.submissions[0].grade.score : null;

  return (
    <Card className="overflow-hidden">
      <div className={`h-2 ${getStatusColor(status)}`} />
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-medium truncate">{homework.title}</h3>
              {status === "completed" && (
                <Badge variant={isGraded ? "default" : "secondary"}>
                  {isGraded ? "Calificada" : "Entregada"}
                </Badge>
              )}
              {status === "pending" && (
                <Badge variant="outline">Pendiente</Badge>
              )}
              {status === "overdue" && (
                <Badge variant="destructive">Vencida</Badge>
              )}
            </div>

            <p className="text-sm text-muted-foreground truncate">
              {homework.subject.name} ({homework.subject.code})
            </p>

            <div className="flex flex-wrap gap-2 mt-3">
              <div className="flex items-center text-xs gap-1">
                <Calendar className="size-3.5 text-muted-foreground" />
                <span>
                  {format(new Date(homework.dueDate), "d 'de' MMMM", {
                    locale: es,
                  })}
                </span>
              </div>

              <div className="flex items-center text-xs gap-1">
                <Clock className="size-3.5 text-muted-foreground" />
                <span>
                  {format(new Date(homework.dueDate), "h:mm a", {
                    locale: es,
                  })}
                </span>
              </div>

              {isGraded && (
                <div className="flex items-center text-xs gap-1">
                  <GraduationCap className="size-3.5 text-primary" />
                  <span className="font-medium">{score}/100</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4">
          <Button
            size="sm"
            className="w-full"
            variant={status === "overdue" ? "secondary" : "default"}
            asChild
          >
            <Link
              href={`/subjects/${homework.subject.id}/homeworks/${homework.id}`}
            >
              {status === "completed"
                ? "Ver detalles"
                : status === "overdue"
                ? "Ver detalles"
                : "Realizar tarea"}
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function getStatusColor(status: HomeworkStatus): string {
  switch (status) {
    case "pending":
      return "bg-orange-500";
    case "completed":
      return "bg-green-500";
    case "overdue":
      return "bg-destructive";
    default:
      return "bg-primary";
  }
}
