import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { PrismaClient } from "@prisma/client";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  BookOpen,
  ArrowLeft,
  Clock,
  FileText,
  CheckCircle,
  GraduationCap,
  Filter,
  Search,
  AlertCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

const prisma = new PrismaClient();

// Obtener tareas de una materia para un estudiante
async function getSubjectHomeworks(subjectId: string, userId: string) {
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
        status: "APPROVED",
      },
    });

    if (!enrollment) {
      return null;
    }

    // Obtener la materia
    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
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

        const status = submission
          ? submission.grade
            ? "graded"
            : "submitted"
          : "pending";

        // Determinar si está vencida
        const isOverdue =
          !submission && new Date(homework.dueDate) < new Date();

        return {
          ...homework,
          status,
          isOverdue,
          submission,
        };
      })
    );

    return {
      subject,
      homeworks: homeworksWithStatus,
      stats: {
        total: homeworks.length,
        completed: homeworksWithStatus.filter(
          (hw) => hw.status === "submitted" || hw.status === "graded"
        ).length,
        pending: homeworksWithStatus.filter((hw) => hw.status === "pending")
          .length,
        overdue: homeworksWithStatus.filter((hw) => hw.isOverdue).length,
      },
    };
  } catch (error) {
    console.error("Error al obtener tareas:", error);
    return null;
  }
}

export default async function HomeworksPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();

  if (!session) {
    notFound();
  }

  const data = await getSubjectHomeworks(params.id, session.user.id);

  if (!data) {
    notFound();
  }

  const { subject, homeworks, stats } = data;

  return (
    <div className="container py-10">
      <div className="mb-6">
        <Link
          href={`/subjects/${params.id}`}
          className="text-sm flex items-center text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="mr-1 size-4" />
          Volver a {subject.name}
        </Link>

        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-1">Tareas</h1>
            <p className="text-muted-foreground flex items-center gap-1">
              <BookOpen className="size-4" />
              <span>
                {subject.name} ({subject.code})
              </span>
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 mb-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Tareas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <FileText className="size-5 text-muted-foreground mr-2" />
              <span className="text-2xl font-bold">{stats.total}</span>
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
              <CheckCircle className="size-5 text-green-500 mr-2" />
              <span className="text-2xl font-bold">{stats.completed}</span>
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
              <span className="text-2xl font-bold">{stats.pending}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Tareas Vencidas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <AlertCircle className="size-5 text-destructive mr-2" />
              <span className="text-2xl font-bold">{stats.overdue}</span>
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

          <div className="flex gap-2">
            <Select defaultValue="all">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="pending">Pendientes</SelectItem>
                <SelectItem value="submitted">Entregadas</SelectItem>
                <SelectItem value="graded">Calificadas</SelectItem>
                <SelectItem value="overdue">Vencidas</SelectItem>
              </SelectContent>
            </Select>

            <Select defaultValue="asc">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">Fecha de entrega (↑)</SelectItem>
                <SelectItem value="desc">Fecha de entrega (↓)</SelectItem>
                <SelectItem value="title">Título (A-Z)</SelectItem>
                <SelectItem value="status">Estado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {homeworks.length === 0 ? (
        <div className="text-center py-12 bg-muted/40 rounded-lg">
          <FileText className="mx-auto size-10 text-muted-foreground mb-3" />
          <h3 className="text-lg font-medium mb-1">
            No hay tareas disponibles
          </h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Esta materia aún no tiene tareas asignadas.
          </p>
        </div>
      ) : (
        <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Fecha de Entrega</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Calificación</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {homeworks.map((homework) => (
                <TableRow key={homework.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <div
                        className={getHomeworkStatusIcon(
                          homework.status,
                          homework.isOverdue
                        )}
                      >
                        {getHomeworkStatusIconContent(
                          homework.status,
                          homework.isOverdue
                        )}
                      </div>
                      <span className="truncate max-w-[200px]">
                        {homework.title}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm">
                        {format(new Date(homework.dueDate), "d 'de' MMMM", {
                          locale: es,
                        })}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(homework.dueDate), "h:mm a", {
                          locale: es,
                        })}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={getHomeworkStatusVariant(
                        homework.status,
                        homework.isOverdue
                      )}
                    >
                      {getHomeworkStatusText(
                        homework.status,
                        homework.isOverdue
                      )}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {homework.status === "graded" &&
                    homework.submission?.grade ? (
                      <div className="flex items-center gap-1">
                        <GraduationCap className="size-4 text-primary" />
                        <span className="font-medium">
                          {homework.submission.grade.score}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          / {homework.totalPoints}
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" asChild>
                      <Link
                        href={`/subjects/${subject.id}/homeworks/${homework.id}`}
                      >
                        {homework.status === "pending"
                          ? "Realizar"
                          : "Ver Detalles"}
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

// Funciones de utilidad para el estado de las tareas
function getHomeworkStatusVariant(status: string, isOverdue: boolean) {
  if (isOverdue) return "destructive";

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

function getHomeworkStatusText(status: string, isOverdue: boolean) {
  if (isOverdue) return "Vencida";

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

function getHomeworkStatusIcon(status: string, isOverdue: boolean) {
  if (isOverdue) return "bg-destructive/10 p-2 rounded-md";

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

function getHomeworkStatusIconContent(status: string, isOverdue: boolean) {
  if (isOverdue) return <AlertCircle className="size-4 text-destructive" />;

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
