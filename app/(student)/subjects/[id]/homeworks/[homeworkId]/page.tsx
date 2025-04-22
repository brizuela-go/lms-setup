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
  AlertCircle,
  HelpCircle,
  Upload,
  ListChecks,
  Download,
  FileCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SubmitHomeworkForm } from "@/components/homeworks/submit-homework-form";

const prisma = new PrismaClient();

// Obtener detalles de una tarea específica
async function getHomeworkDetails(
  subjectId: string,
  homeworkId: string,
  userId: string
) {
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

    // Obtener la tarea
    const homework = await prisma.homework.findUnique({
      where: { id: homeworkId },
      include: {
        questions: {
          orderBy: {
            order: "asc",
          },
        },
      },
    });

    if (!homework) {
      return null;
    }

    // Verificar si el estudiante ya ha enviado esta tarea
    const submission = await prisma.submission.findFirst({
      where: {
        homeworkId,
        studentId: student.id,
      },
      include: {
        answers: {
          include: {
            question: true,
          },
        },
        grade: true,
      },
    });

    const isOverdue = !submission && new Date(homework.dueDate) < new Date();

    const status = submission
      ? submission.grade
        ? "graded"
        : "submitted"
      : isOverdue
      ? "overdue"
      : "pending";

    return {
      subject,
      homework,
      student,
      submission,
      status,
      isOverdue,
    };
  } catch (error) {
    console.error("Error al obtener detalles de la tarea:", error);
    return null;
  }
}

export default async function HomeworkDetailPage({
  params,
}: {
  params: { id: string; homeworkId: string };
}) {
  const session = await auth();

  if (!session) {
    notFound();
  }

  const data = await getHomeworkDetails(
    params.id,
    params.homeworkId,
    session.user.id
  );

  if (!data) {
    notFound();
  }

  const { subject, homework, student, submission, status, isOverdue } = data;

  // Determinar si la tarea es calificable (no ha vencido o ya fue enviada)
  const canSubmit = status === "pending" || status === "submitted";

  // Formatear la fecha de entrega
  const formattedDueDate = format(
    new Date(homework.dueDate),
    "d 'de' MMMM 'a las' h:mm a",
    { locale: es }
  );

  return (
    <div className="container py-10">
      <div className="mb-6">
        <Link
          href={`/subjects/${params.id}/homeworks`}
          className="text-sm flex items-center text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="mr-1 size-4" />
          Volver a tareas
        </Link>

        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-3xl font-bold">{homework.title}</h1>
              <Badge variant={getHomeworkStatusVariant(status)}>
                {getHomeworkStatusText(status)}
              </Badge>
            </div>
            <p className="text-muted-foreground flex items-center gap-1">
              <BookOpen className="size-4" />
              <span>
                {subject.name} ({subject.code})
              </span>
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Instrucciones</CardTitle>
              <CardDescription>
                Lee atentamente antes de comenzar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {homework.description ? (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <p>{homework.description}</p>
                </div>
              ) : (
                <p className="text-muted-foreground italic">
                  No hay instrucciones adicionales para esta tarea.
                </p>
              )}

              <div className="mt-6 rounded-md bg-muted p-4">
                <div className="flex items-center gap-2 mb-3">
                  <ListChecks className="size-5 text-muted-foreground" />
                  <h3 className="font-medium">Resumen de la Tarea</h3>
                </div>

                <ul className="space-y-3 text-sm">
                  <li className="flex items-center gap-2">
                    <Clock className="size-4 text-muted-foreground shrink-0" />
                    <span>
                      Fecha de entrega:{" "}
                      <span className="font-medium">{formattedDueDate}</span>
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <HelpCircle className="size-4 text-muted-foreground shrink-0" />
                    <span>
                      Total de preguntas:{" "}
                      <span className="font-medium">
                        {homework.questions.length}
                      </span>
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <FileCheck className="size-4 text-muted-foreground shrink-0" />
                    <span>
                      Puntos totales:{" "}
                      <span className="font-medium">
                        {homework.totalPoints}
                      </span>
                    </span>
                  </li>
                  {homework.allowFileUpload && (
                    <li className="flex items-center gap-2">
                      <Upload className="size-4 text-muted-foreground shrink-0" />
                      <span>Se permite adjuntar archivos</span>
                    </li>
                  )}
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Mostrar las preguntas o las respuestas si ya se envió */}
          {submission ? (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Tu Envío</CardTitle>
                <CardDescription>
                  {submission.grade
                    ? `Enviado el ${format(
                        new Date(submission.submittedAt),
                        "d 'de' MMMM, yyyy",
                        { locale: es }
                      )}, calificado con ${submission.grade.score} puntos`
                    : `Enviado el ${format(
                        new Date(submission.submittedAt),
                        "d 'de' MMMM, yyyy",
                        { locale: es }
                      )}, pendiente de calificación`}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {submission.answers.map((answer) => (
                  <div key={answer.id} className="space-y-2">
                    <h3 className="font-medium text-sm">
                      Pregunta {answer.question.order}: {answer.question.text}
                    </h3>

                    {answer.question.type === "MULTIPLE_CHOICE" && (
                      <div className="mt-1">
                        <Badge variant="outline">
                          Opción seleccionada: {answer.answerOption}
                        </Badge>
                      </div>
                    )}

                    {answer.question.type === "TRUE_FALSE" && (
                      <div className="mt-1">
                        <Badge variant="outline">
                          Respuesta:{" "}
                          {answer.answerOption === "true"
                            ? "Verdadero"
                            : "Falso"}
                        </Badge>
                      </div>
                    )}

                    {answer.question.type === "OPEN_TEXT" &&
                      answer.answerText && (
                        <div className="bg-muted/50 p-3 rounded-md text-sm mt-1">
                          {answer.answerText}
                        </div>
                      )}

                    {submission.grade && submission.grade.feedback && (
                      <div className="bg-primary/5 p-3 rounded-md mt-2 border-l-2 border-primary">
                        <p className="text-xs font-medium text-primary mb-1">
                          Retroalimentación del profesor:
                        </p>
                        <p className="text-sm">{submission.grade.feedback}</p>
                      </div>
                    )}

                    <Separator className="my-4" />
                  </div>
                ))}

                {submission.fileUrl && (
                  <div className="pt-2">
                    <h3 className="font-medium text-sm mb-2">
                      Archivo adjunto:
                    </h3>
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-md">
                      <FileCheck className="size-5 text-primary" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {getFileNameFromUrl(submission.fileUrl)}
                        </p>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <a
                          href={submission.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Download className="mr-2 size-4" />
                          Descargar
                        </a>
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>

              {status === "submitted" && (
                <CardFooter>
                  <Button className="w-full md:w-auto" disabled>
                    Esperando calificación
                  </Button>
                </CardFooter>
              )}
            </Card>
          ) : (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Enviar Tarea</CardTitle>
                <CardDescription>
                  {isOverdue
                    ? "Esta tarea ha vencido y ya no acepta envíos"
                    : "Completa todas las preguntas antes de enviar"}
                </CardDescription>
              </CardHeader>

              {isOverdue ? (
                <CardContent>
                  <div className="flex items-center justify-center gap-2 p-6 bg-destructive/10 rounded-md text-destructive">
                    <AlertCircle className="size-5" />
                    <p className="font-medium">
                      Lo sentimos, esta tarea ya no acepta envíos
                    </p>
                  </div>
                </CardContent>
              ) : (
                <SubmitHomeworkForm
                  studentId={student.id}
                  subjectId={subject.id}
                  homework={homework}
                />
              )}
            </Card>
          )}
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Estado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 rounded-md bg-muted">
                  <div className={getStatusIconClass(status)}>
                    {getStatusIcon(status)}
                    <h3 className="font-medium">{getStatusTitle(status)}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    {getStatusDescription(status, formattedDueDate)}
                  </p>
                </div>

                {submission?.grade && (
                  <div className="p-4 rounded-md bg-primary/10">
                    <div className="flex items-center gap-2 text-primary">
                      <FileCheck className="size-5" />
                      <h3 className="font-medium">Calificación</h3>
                    </div>
                    <div className="mt-3 text-center">
                      <div className="text-3xl font-bold">
                        {submission.grade.score}
                        <span className="text-base text-muted-foreground ml-1">
                          / {homework.totalPoints}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Calificada el{" "}
                        {format(
                          new Date(submission.grade.gradedAt),
                          "d 'de' MMMM, yyyy",
                          { locale: es }
                        )}
                      </p>
                    </div>
                  </div>
                )}

                <div className="rounded-md border p-4">
                  <h3 className="text-sm font-medium mb-2">
                    Detalles de la Tarea
                  </h3>
                  <ul className="space-y-3 text-sm">
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">
                        Asignada por:
                      </span>
                      <span className="font-medium">
                        {subject.teacher.user.name}
                      </span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">
                        Fecha límite:
                      </span>
                      <span className="font-medium">
                        {format(new Date(homework.dueDate), "d MMM, yyyy", {
                          locale: es,
                        })}
                      </span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">
                        Hora límite:
                      </span>
                      <span className="font-medium">
                        {format(new Date(homework.dueDate), "h:mm a", {
                          locale: es,
                        })}
                      </span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">Puntos:</span>
                      <span className="font-medium">
                        {homework.totalPoints}
                      </span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">Preguntas:</span>
                      <span className="font-medium">
                        {homework.questions.length}
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Función para obtener el nombre del archivo de una URL
function getFileNameFromUrl(url: string) {
  try {
    const parts = url.split("/");
    return parts[parts.length - 1];
  } catch (error) {
    return "archivo";
  }
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
    case "overdue":
      return "destructive";
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
    case "overdue":
      return "Vencida";
    default:
      return "Pendiente";
  }
}

// Funciones para mostrar el estado de la tarea
function getStatusIcon(status: string) {
  switch (status) {
    case "graded":
      return <FileCheck className="size-5" />;
    case "submitted":
      return <CheckCircle className="size-5" />;
    case "pending":
      return <Clock className="size-5" />;
    case "overdue":
      return <AlertCircle className="size-5" />;
    default:
      return <HelpCircle className="size-5" />;
  }
}

function getStatusIconClass(status: string) {
  switch (status) {
    case "graded":
      return "flex items-center gap-2 text-primary";
    case "submitted":
      return "flex items-center gap-2 text-secondary-foreground";
    case "pending":
      return "flex items-center gap-2 text-orange-500";
    case "overdue":
      return "flex items-center gap-2 text-destructive";
    default:
      return "flex items-center gap-2";
  }
}

function getStatusTitle(status: string) {
  switch (status) {
    case "graded":
      return "Tarea Calificada";
    case "submitted":
      return "Tarea Entregada";
    case "pending":
      return "Tarea Pendiente";
    case "overdue":
      return "Tarea Vencida";
    default:
      return "Estado Desconocido";
  }
}

function getStatusDescription(status: string, dueDate: string) {
  switch (status) {
    case "graded":
      return "Esta tarea ya ha sido calificada por tu profesor.";
    case "submitted":
      return "Has entregado esta tarea correctamente. Tu profesor la calificará pronto.";
    case "pending":
      return `Esta tarea debe ser entregada antes del ${dueDate}.`;
    case "overdue":
      return "La fecha límite de entrega ha pasado. Ya no puedes enviar esta tarea.";
    default:
      return "El estado de esta tarea es desconocido.";
  }
}
