"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  CheckCircle,
  XCircle,
  FileText,
  FileCheck,
  Pencil,
  Loader2,
  Download,
  User,
  Calendar,
  Clock,
  MessageCircle,
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
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Tipos para la submission
interface Question {
  id: string;
  order: number;
  text: string;
  type: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "OPEN_TEXT";
  points: number;
  options?: {
    id: string;
    text: string;
  }[];
  correctAnswer?: string | null;
}

interface Answer {
  id: string;
  questionId: string;
  answerText: string | null;
  answerOption: string | null;
  question: Question;
}

interface Submission {
  id: string;
  studentId: string;
  homeworkId: string;
  status: string;
  submittedAt: string;
  fileUrl: string | null;
  student: {
    id: string;
    studentId: string;
    user: {
      name: string;
      email: string;
      image?: string;
    };
  };
  homework: {
    id: string;
    title: string;
    description: string | null;
    totalPoints: number;
    dueDate: string;
    subject: {
      id: string;
      name: string;
      code: string;
    };
    questions: Question[];
  };
  answers: Answer[];
  grade?: {
    id: string;
    score: number;
    feedback: string | null;
    gradedAt: string;
  } | null;
}

// Esquema de validación para la calificación
const formSchema = z.object({
  score: z
    .number()
    .min(0, "La calificación no puede ser negativa")
    .max(100, "La calificación no puede ser mayor a 100"),
  feedback: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface GradeSubmissionFormProps {
  submission: Submission;
  teacherId: string;
}

export function GradeSubmissionForm({
  submission,
  teacherId,
}: GradeSubmissionFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Inicializar el formulario
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      score: submission.grade?.score || calculateSuggestedScore(),
      feedback: submission.grade?.feedback || "",
    },
  });

  // Calcular una calificación sugerida basada en las respuestas correctas
  function calculateSuggestedScore(): number {
    if (submission.homework.questions.length === 0) return 0;

    let totalPoints = 0;
    let earnedPoints = 0;

    submission.answers.forEach((answer) => {
      const question = submission.homework.questions.find(
        (q) => q.id === answer.questionId
      );
      if (!question) return;

      totalPoints += question.points;

      // Para preguntas de opción múltiple y verdadero/falso, verificar si la respuesta es correcta
      if (question.type !== "OPEN_TEXT" && question.correctAnswer !== null) {
        if (answer.answerOption === question.correctAnswer) {
          earnedPoints += question.points;
        }
      }
    });

    // Convertir a escala 0-100
    return totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
  }

  // Manejar el envío del formulario
  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);

    try {
      // Preparar datos para el envío
      const gradeData = {
        submissionId: submission.id,
        teacherId,
        studentId: submission.studentId,
        score: values.score,
        feedback: values.feedback || null,
      };

      // Enviar datos al servidor
      const response = await fetch("/api/grades", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(gradeData),
      });

      if (!response.ok) {
        throw new Error("Error al calificar la tarea");
      }

      // Mostrar mensaje de éxito
      toast.success("Tarea calificada correctamente");

      // Redireccionar a la página de la tarea
      router.push(
        `/teacher/subjects/${submission.homework.subject.id}/homeworks/${submission.homework.id}`
      );
      router.refresh();
    } catch (error) {
      console.error("Error al calificar tarea:", error);
      toast.error("Ocurrió un error al calificar la tarea");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Iniciales del estudiante para el avatar
  const studentInitials = submission.student.user.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  // Obtener el nombre de archivo de la URL
  function getFileNameFromUrl(url: string | null): string {
    if (!url) return "archivo";
    const parts = url.split("/");
    return parts[parts.length - 1];
  }

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <div className="md:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="size-5" />
              {submission.homework.title}
            </CardTitle>
            <CardDescription>
              {submission.homework.subject.name} (
              {submission.homework.subject.code})
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {submission.homework.description && (
              <div className="bg-muted/50 p-4 rounded-md">
                <h3 className="text-sm font-medium mb-2">
                  Descripción de la tarea:
                </h3>
                <p className="text-sm">{submission.homework.description}</p>
              </div>
            )}

            <div className="space-y-6">
              <h3 className="text-base font-medium border-b pb-2">
                Respuestas del estudiante
              </h3>

              {submission.answers.map((answer) => {
                const question = submission.homework.questions.find(
                  (q) => q.id === answer.questionId
                );
                if (!question) return null;

                // Determinar si la respuesta es correcta para preguntas de opción múltiple o verdadero/falso
                const isCorrect =
                  question.type !== "OPEN_TEXT" &&
                  question.correctAnswer !== null &&
                  answer.answerOption === question.correctAnswer;

                // Determinar si es una pregunta calificable automáticamente
                const isAutoGradable = question.type !== "OPEN_TEXT";

                return (
                  <div key={answer.id} className="border rounded-md p-4">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex-1">
                        <h4 className="font-medium">
                          Pregunta {question.order}: {question.text}
                        </h4>

                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline">
                            {question.type === "MULTIPLE_CHOICE"
                              ? "Opción múltiple"
                              : question.type === "TRUE_FALSE"
                              ? "Verdadero/Falso"
                              : "Texto abierto"}
                          </Badge>
                          <Badge variant="secondary">
                            {question.points} puntos
                          </Badge>
                        </div>
                      </div>

                      {isAutoGradable && (
                        <Badge
                          variant={isCorrect ? "default" : "destructive"}
                          className="ml-auto"
                        >
                          {isCorrect ? (
                            <CheckCircle className="size-3 mr-1" />
                          ) : (
                            <XCircle className="size-3 mr-1" />
                          )}
                          {isCorrect ? "Correcta" : "Incorrecta"}
                        </Badge>
                      )}
                    </div>

                    {/* Respuesta del estudiante */}
                    <div className="space-y-3">
                      <h5 className="text-sm text-muted-foreground">
                        Respuesta:
                      </h5>

                      {question.type === "MULTIPLE_CHOICE" &&
                        answer.answerOption && (
                          <div className="bg-muted/50 p-3 rounded-md">
                            {question.options?.find(
                              (opt) => opt.id === answer.answerOption
                            )?.text || "Opción no encontrada"}
                          </div>
                        )}

                      {question.type === "TRUE_FALSE" && (
                        <div className="bg-muted/50 p-3 rounded-md">
                          {answer.answerOption === "true"
                            ? "Verdadero"
                            : "Falso"}
                        </div>
                      )}

                      {question.type === "OPEN_TEXT" && (
                        <div className="bg-muted/50 p-3 rounded-md">
                          {answer.answerText || (
                            <em className="text-muted-foreground">
                              Sin respuesta
                            </em>
                          )}
                        </div>
                      )}

                      {/* Respuesta correcta para preguntas automáticas */}
                      {isAutoGradable && question.correctAnswer !== null && (
                        <div className="mt-2">
                          <h5 className="text-sm text-muted-foreground">
                            Respuesta correcta:
                          </h5>
                          <div className="bg-primary/5 p-3 rounded-md border-l-2 border-primary">
                            {question.type === "MULTIPLE_CHOICE"
                              ? question.options?.find(
                                  (opt) => opt.id === question.correctAnswer
                                )?.text || "Opción no encontrada"
                              : question.correctAnswer === "true"
                              ? "Verdadero"
                              : "Falso"}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Archivo adjunto si existe */}
              {submission.fileUrl && (
                <div className="border rounded-md p-4 space-y-3">
                  <h4 className="font-medium">Archivo adjunto</h4>

                  <div className="flex items-center gap-3 bg-muted/50 p-3 rounded-md">
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
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Calificación</CardTitle>
            <CardDescription>
              Asigna una calificación y retroalimentación opcional
            </CardDescription>
          </CardHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="score"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Calificación (0-100)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          {...field}
                          onChange={(e) =>
                            field.onChange(Number(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormDescription>
                        Calificación sugerida basada en respuestas correctas:{" "}
                        {calculateSuggestedScore()}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="feedback"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Retroalimentación (Opcional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Proporciona retroalimentación al estudiante..."
                          className="min-h-32"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Esta retroalimentación será visible para el estudiante
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>

              <CardFooter className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  )}
                  Guardar Calificación
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>
      </div>

      <div className="md:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle>Información</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <Avatar className="size-10">
                  <AvatarImage src={submission.student.user.image || ""} />
                  <AvatarFallback>{studentInitials}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-medium">
                    {submission.student.user.name}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {submission.student.user.email}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  ID: {submission.student.studentId}
                </Badge>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <h3 className="text-sm font-medium">Detalles de la entrega</h3>

              <div className="flex items-center gap-2 text-sm">
                <Clock className="size-4 text-muted-foreground" />
                <span>
                  Enviado el{" "}
                  {format(
                    new Date(submission.submittedAt),
                    "d 'de' MMMM, yyyy",
                    { locale: es }
                  )}
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <Calendar className="size-4 text-muted-foreground" />
                <span>
                  Fecha límite:{" "}
                  {format(
                    new Date(submission.homework.dueDate),
                    "d 'de' MMMM, yyyy",
                    { locale: es }
                  )}
                </span>
              </div>

              {submission.grade && (
                <div className="bg-muted p-3 rounded-md mt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Pencil className="size-4 text-primary" />
                    <h3 className="text-sm font-medium">Ya calificado</h3>
                  </div>

                  <div className="text-sm">
                    <p>
                      Calificación:{" "}
                      <span className="font-medium">
                        {submission.grade.score}
                      </span>
                      /100
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Calificado el{" "}
                      {format(
                        new Date(submission.grade.gradedAt),
                        "d 'de' MMMM, yyyy",
                        { locale: es }
                      )}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-medium">Resumen de la tarea</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Total de preguntas:
                  </span>
                  <span className="font-medium">
                    {submission.homework.questions.length}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Puntos totales:</span>
                  <span className="font-medium">
                    {submission.homework.totalPoints}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Archivo adjunto:
                  </span>
                  <span className="font-medium">
                    {submission.fileUrl ? "Sí" : "No"}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
