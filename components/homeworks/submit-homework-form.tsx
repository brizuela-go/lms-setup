"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2, CheckCircle, CircleX, Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { FileUploader } from "@/components/upload/file-uploader";

// Definir el tipo de datos de la tarea
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
  correctAnswer?: string;
}

interface Homework {
  id: string;
  title: string;
  description?: string | null;
  dueDate: string;
  totalPoints: number;
  allowFileUpload: boolean;
  questions: Question[];
}

// Crear un schema de validación dinámico basado en las preguntas
function createFormSchema(homework: Homework) {
  const schema: Record<string, any> = {};

  // Agregar validaciones para cada pregunta
  homework.questions.forEach((question) => {
    const fieldName = `question_${question.id}`;

    switch (question.type) {
      case "MULTIPLE_CHOICE":
        schema[fieldName] = z
          .string()
          .min(1, "Por favor, selecciona una opción");
        break;
      case "TRUE_FALSE":
        schema[fieldName] = z
          .string()
          .min(1, "Por favor, selecciona verdadero o falso");
        break;
      case "OPEN_TEXT":
        schema[fieldName] = z
          .string()
          .min(1, "Por favor, escribe una respuesta")
          .max(10000, "La respuesta es demasiado larga");
        break;
    }
  });

  // Si se permite subir archivos, agregar validación opcional
  if (homework.allowFileUpload) {
    schema.fileUrl = z.string().optional();
  }

  return z.object(schema);
}

interface SubmitHomeworkFormProps {
  studentId: string;
  subjectId: string;
  homework: Homework;
}

export function SubmitHomeworkForm({
  studentId,
  subjectId,
  homework,
}: SubmitHomeworkFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Crear schema dinámico para el formulario
  const formSchema = createFormSchema(homework);
  type FormValues = z.infer<typeof formSchema>;

  // Configurar el formulario
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: homework.questions.reduce((acc, question) => {
      acc[`question_${question.id}`] = "";
      return acc;
    }, {} as Record<string, string>),
  });

  // Manejar el envío del formulario
  async function onSubmit(values: FormValues) {
    // Mostrar confirmación antes de enviar
    if (!showConfirmation) {
      setShowConfirmation(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setIsSubmitting(true);

    try {
      // Preparar datos para el envío
      const answers = homework.questions.map((question) => {
        const value = values[`question_${question.id}`];
        return {
          questionId: question.id,
          answerText: question.type === "OPEN_TEXT" ? value : null,
          answerOption: question.type !== "OPEN_TEXT" ? value : null,
        };
      });

      // Enviar datos al servidor
      const response = await fetch("/api/submissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studentId,
          homeworkId: homework.id,
          answers,
          fileUrl: values.fileUrl || null,
        }),
      });

      if (!response.ok) {
        throw new Error("Error al enviar la tarea");
      }

      // Mostrar mensaje de éxito
      toast.success("¡Tarea enviada correctamente!");

      // Redireccionar a la página de la tarea
      router.refresh();
      router.push(`/subjects/${subjectId}/homeworks/${homework.id}`);
    } catch (error) {
      console.error("Error al enviar la tarea:", error);
      toast.error(
        "Ocurrió un error al enviar la tarea. Por favor, intenta de nuevo."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  // Cancelar el envío y ocultar la confirmación
  function cancelSubmission() {
    setShowConfirmation(false);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {/* Modal de confirmación */}
        {showConfirmation && (
          <Card className="mb-6 border-primary">
            <CardHeader className="bg-primary/5">
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="size-5 text-primary" />
                Confirma tu envío
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-sm">
                Estás a punto de enviar tu tarea{" "}
                <strong>{homework.title}</strong>. Una vez enviada, no podrás
                modificar tus respuestas.
              </p>
              <p className="text-sm font-medium mt-4">
                ¿Estás seguro de que deseas continuar?
              </p>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={cancelSubmission}
                disabled={isSubmitting}
              >
                Revisar respuestas
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                )}
                Confirmar envío
              </Button>
            </CardFooter>
          </Card>
        )}

        <CardContent className="space-y-6">
          {/* Preguntas */}
          {homework.questions.map((question) => (
            <div key={question.id} className="space-y-3">
              <div className="flex items-start gap-2">
                <Pencil className="size-4 text-muted-foreground mt-1" />
                <h3 className="font-medium">
                  Pregunta {question.order}: {question.text}
                </h3>
              </div>

              <div className="ml-6">
                {/* Pregunta de opción múltiple */}
                {question.type === "MULTIPLE_CHOICE" && question.options && (
                  <FormField
                    control={form.control}
                    name={`question_${question.id}`}
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="space-y-2"
                          >
                            {question.options &&
                              question?.options.map((option) => (
                                <FormItem
                                  key={option.id}
                                  className="flex items-start space-x-3 space-y-0"
                                >
                                  <FormControl>
                                    <RadioGroupItem value={option.id} />
                                  </FormControl>
                                  <FormLabel className="font-normal mt-0.5">
                                    {option.text}
                                  </FormLabel>
                                </FormItem>
                              ))}
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Pregunta de verdadero/falso */}
                {question.type === "TRUE_FALSE" && (
                  <FormField
                    control={form.control}
                    name={`question_${question.id}`}
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="space-y-2"
                          >
                            <FormItem className="flex items-start space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="true" />
                              </FormControl>
                              <FormLabel className="font-normal mt-0.5">
                                Verdadero
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-start space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="false" />
                              </FormControl>
                              <FormLabel className="font-normal mt-0.5">
                                Falso
                              </FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Pregunta de texto abierto */}
                {question.type === "OPEN_TEXT" && (
                  <FormField
                    control={form.control}
                    name={`question_${question.id}`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea
                            placeholder="Escribe tu respuesta aquí..."
                            className="min-h-32"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Responde de manera clara y concisa.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              <Separator className="my-6" />
            </div>
          ))}

          {/* Upload de archivos */}
          {homework.allowFileUpload && (
            <div className="space-y-4">
              <div className="flex items-start gap-2">
                <CheckCircle className="size-4 text-muted-foreground mt-1" />
                <h3 className="font-medium">Archivo Adjunto (Opcional)</h3>
              </div>

              <div className="ml-6">
                <FormField
                  control={form.control}
                  name="fileUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <FileUploader
                          endpoint="documentUploader"
                          value={field.value}
                          onChange={field.onChange}
                          title="Adjuntar archivo"
                          description="Arrastra y suelta o haz clic para cargar un archivo"
                        />
                      </FormControl>
                      <FormDescription>
                        Puedes adjuntar un archivo adicional para complementar
                        tus respuestas.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          )}
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
          <Button
            type="submit"
            disabled={isSubmitting || !form.formState.isValid}
          >
            {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
            {showConfirmation ? "Confirmar envío" : "Enviar tarea"}
          </Button>
        </CardFooter>
      </form>
    </Form>
  );
}
