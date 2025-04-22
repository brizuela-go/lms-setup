"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";
import {
  Loader2,
  Plus,
  Trash2,
  GripVertical,
  CheckCircle2,
  XCircle,
  FileText,
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
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { es } from "date-fns/locale";

// Definir formulario para la creación de tareas
const formSchema = z.object({
  title: z
    .string()
    .min(1, "El título es obligatorio")
    .max(200, "El título es demasiado largo"),
  description: z.string().optional(),
  subjectId: z.string().min(1, "Selecciona una materia"),
  dueDate: z.date({
    required_error: "Selecciona una fecha de entrega",
  }),
  dueTime: z.string().min(1, "Selecciona una hora de entrega"),
  allowFileUpload: z.boolean().default(false),
  questions: z
    .array(
      z.object({
        text: z.string().min(1, "El texto de la pregunta es obligatorio"),
        type: z.enum(["MULTIPLE_CHOICE", "TRUE_FALSE", "OPEN_TEXT"], {
          required_error: "Selecciona un tipo de pregunta",
        }),
        points: z.coerce
          .number()
          .min(1, "Asigna al menos 1 punto")
          .max(100, "El máximo es 100 puntos"),
        options: z
          .array(
            z.object({
              text: z.string().min(1, "El texto de la opción es obligatorio"),
            })
          )
          .optional(),
        correctAnswer: z.string().optional(),
      })
    )
    .min(1, "Agrega al menos una pregunta"),
});

// Tipo de datos para el formulario
type FormValues = z.infer<typeof formSchema>;

interface CreateHomeworkFormProps {
  subjects: {
    id: string;
    name: string;
    code: string;
  }[];
  teacherId: string;
}

export function CreateHomeworkForm({
  subjects,
  teacherId,
}: CreateHomeworkFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Configurar el formulario
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      subjectId: "",
      dueDate: undefined,
      dueTime: "23:59",
      allowFileUpload: false,
      questions: [
        {
          text: "",
          type: "MULTIPLE_CHOICE",
          points: 10,
          options: [{ text: "" }, { text: "" }],
          correctAnswer: "",
        },
      ],
    },
  });

  // Configurar el array de preguntas
  const {
    fields: questionFields,
    append: appendQuestion,
    remove: removeQuestion,
    move: moveQuestion,
  } = useFieldArray({
    control: form.control,
    name: "questions",
  });

  // Manejar el envío del formulario
  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);

    try {
      // Combinar fecha y hora
      const dueDate = new Date(values.dueDate);
      const [hours, minutes] = values.dueTime.split(":").map(Number);
      dueDate.setHours(hours, minutes);

      // Preparar datos para el envío
      const homeworkData = {
        title: values.title,
        description: values.description || null,
        subjectId: values.subjectId,
        teacherId,
        dueDate: dueDate.toISOString(),
        allowFileUpload: values.allowFileUpload,
        totalPoints: values.questions.reduce((sum, q) => sum + q.points, 0),
        questions: values.questions.map((question, index) => ({
          order: index + 1,
          text: question.text,
          type: question.type,
          points: question.points,
          options:
            question.type === "MULTIPLE_CHOICE" ? question.options : null,
          correctAnswer:
            question.type !== "OPEN_TEXT" ? question.correctAnswer : null,
        })),
      };

      // Enviar datos al servidor
      const response = await fetch("/api/homeworks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(homeworkData),
      });

      if (!response.ok) {
        throw new Error("Error al crear la tarea");
      }

      const data = await response.json();

      // Mostrar mensaje de éxito
      toast.success("¡Tarea creada correctamente!");

      // Redireccionar a la página de la tarea
      router.push(
        `/teacher/subjects/${values.subjectId}/homeworks/${data.homework.id}`
      );
      router.refresh();
    } catch (error) {
      console.error("Error al crear la tarea:", error);
      toast.error(
        "Ocurrió un error al crear la tarea. Por favor, intenta de nuevo."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  // Manejar la adición de opciones para preguntas de opción múltiple
  const addOption = (questionIndex: number) => {
    const currentOptions =
      form.getValues(`questions.${questionIndex}.options`) || [];
    form.setValue(`questions.${questionIndex}.options`, [
      ...currentOptions,
      { text: "" },
    ]);
  };

  // Manejar la eliminación de opciones
  const removeOption = (questionIndex: number, optionIndex: number) => {
    const currentOptions =
      form.getValues(`questions.${questionIndex}.options`) || [];
    const updatedOptions = currentOptions.filter((_, i) => i !== optionIndex);
    form.setValue(`questions.${questionIndex}.options`, updatedOptions);
  };

  // Configurar el array de opciones para cada pregunta
  const getOptionsFieldArray = (questionIndex: number) => {
    return useFieldArray({
      control: form.control,
      name: `questions.${questionIndex}.options`,
    });
  };

  // Controlar visibilidad de campos según el tipo de pregunta
  const watchQuestionTypes = form.watch("questions");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Información de la Tarea</CardTitle>
            <CardDescription>
              Ingresa los detalles generales de la tarea
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ej: Ecuaciones diferenciales - Tarea 1"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="subjectId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Materia</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona una materia" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {subjects.map((subject) => (
                          <SelectItem key={subject.id} value={subject.id}>
                            {subject.name} ({subject.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe la tarea y proporciona instrucciones adicionales..."
                      className="min-h-24"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Fecha de entrega</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={`w-full pl-3 text-left font-normal ${
                              !field.value && "text-muted-foreground"
                            }`}
                          >
                            {field.value ? (
                              format(field.value, "PPP", { locale: es })
                            ) : (
                              <span>Selecciona una fecha</span>
                            )}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                          disabled={(date) => date < new Date()}
                          locale={es}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dueTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hora de entrega</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="allowFileUpload"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Permitir adjuntar archivos</FormLabel>
                    <FormDescription>
                      Los estudiantes podrán subir un archivo adicional con su
                      tarea
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Preguntas</CardTitle>
            <CardDescription>
              Agrega las preguntas que formarán parte de la tarea
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {questionFields.map((question, questionIndex) => {
              const questionType = watchQuestionTypes[questionIndex]?.type;
              const optionsArray = getOptionsFieldArray(questionIndex);

              return (
                <div
                  key={question.id}
                  className="relative rounded-lg border p-4 pt-6"
                >
                  <Badge
                    variant="outline"
                    className="absolute -top-2.5 left-3 border-none"
                  >
                    Pregunta {questionIndex + 1}
                  </Badge>

                  <div className="flex items-center gap-2 absolute -top-2.5 right-3">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2"
                      onClick={() => {
                        if (questionIndex > 0) {
                          moveQuestion(questionIndex, questionIndex - 1);
                        }
                      }}
                      disabled={questionIndex === 0}
                    >
                      <GripVertical className="size-4" />
                      <span className="sr-only">Mover arriba</span>
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-destructive hover:text-destructive"
                      onClick={() => removeQuestion(questionIndex)}
                      disabled={questionFields.length === 1}
                    >
                      <Trash2 className="size-4" />
                      <span className="sr-only">Eliminar pregunta</span>
                    </Button>
                  </div>

                  <div className="grid gap-4">
                    <div className="grid gap-4 md:grid-cols-[2fr,1fr,1fr]">
                      <FormField
                        control={form.control}
                        name={`questions.${questionIndex}.text`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Texto de la pregunta</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Ej: ¿Cuál es la definición de una ecuación diferencial?"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`questions.${questionIndex}.type`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tipo</FormLabel>
                            <Select
                              onValueChange={(value) => {
                                field.onChange(value);

                                // Resetear opciones si se cambia el tipo
                                if (value === "MULTIPLE_CHOICE") {
                                  form.setValue(
                                    `questions.${questionIndex}.options`,
                                    [{ text: "" }, { text: "" }]
                                  );
                                  form.setValue(
                                    `questions.${questionIndex}.correctAnswer`,
                                    ""
                                  );
                                } else if (value === "TRUE_FALSE") {
                                  form.setValue(
                                    `questions.${questionIndex}.options`,
                                    []
                                  );
                                  form.setValue(
                                    `questions.${questionIndex}.correctAnswer`,
                                    ""
                                  );
                                } else {
                                  form.setValue(
                                    `questions.${questionIndex}.options`,
                                    []
                                  );
                                  form.setValue(
                                    `questions.${questionIndex}.correctAnswer`,
                                    ""
                                  );
                                }
                              }}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Tipo de pregunta" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="MULTIPLE_CHOICE">
                                  Opción múltiple
                                </SelectItem>
                                <SelectItem value="TRUE_FALSE">
                                  Verdadero/Falso
                                </SelectItem>
                                <SelectItem value="OPEN_TEXT">
                                  Texto abierto
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`questions.${questionIndex}.points`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Puntos</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min={1}
                                max={100}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Opciones para opción múltiple */}
                    {questionType === "MULTIPLE_CHOICE" && (
                      <div className="space-y-4 pl-4 border-l-2 border-muted">
                        <div className="flex justify-between items-center">
                          <h4 className="text-sm font-medium">Opciones</h4>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => addOption(questionIndex)}
                          >
                            <Plus className="size-4 mr-1" />
                            Agregar opción
                          </Button>
                        </div>

                        {optionsArray.fields.map((option, optionIndex) => (
                          <div
                            key={option.id}
                            className="flex items-start gap-3"
                          >
                            <FormField
                              control={form.control}
                              name={`questions.${questionIndex}.correctAnswer`}
                              render={({ field }) => (
                                <FormItem className="flex items-center space-x-1 space-y-0 mt-2">
                                  <FormControl>
                                    <input
                                      type="radio"
                                      className="size-4"
                                      checked={
                                        field.value === optionIndex.toString()
                                      }
                                      onChange={() =>
                                        field.onChange(optionIndex.toString())
                                      }
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`questions.${questionIndex}.options.${optionIndex}.text`}
                              render={({ field }) => (
                                <FormItem className="flex-1">
                                  <FormControl>
                                    <Input
                                      placeholder={`Opción ${optionIndex + 1}`}
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="mt-1 text-destructive hover:text-destructive"
                              onClick={() =>
                                removeOption(questionIndex, optionIndex)
                              }
                              disabled={optionsArray.fields.length <= 2}
                            >
                              <Trash2 className="size-4" />
                              <span className="sr-only">Eliminar opción</span>
                            </Button>
                          </div>
                        ))}

                        {form.formState.errors.questions?.[questionIndex]
                          ?.correctAnswer && (
                          <p className="text-sm font-medium text-destructive">
                            Selecciona la respuesta correcta
                          </p>
                        )}
                      </div>
                    )}

                    {/* Opciones para verdadero/falso */}
                    {questionType === "TRUE_FALSE" && (
                      <div className="space-y-4 pl-4 border-l-2 border-muted">
                        <h4 className="text-sm font-medium">
                          Respuesta correcta
                        </h4>

                        <FormField
                          control={form.control}
                          name={`questions.${questionIndex}.correctAnswer`}
                          render={({ field }) => (
                            <FormItem className="space-y-1">
                              <FormControl>
                                <div className="flex gap-4">
                                  <div className="flex items-center space-x-2">
                                    <input
                                      type="radio"
                                      id={`true-${questionIndex}`}
                                      className="size-4"
                                      checked={field.value === "true"}
                                      onChange={() => field.onChange("true")}
                                    />
                                    <label
                                      htmlFor={`true-${questionIndex}`}
                                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-1"
                                    >
                                      <CheckCircle2 className="size-4 text-green-500" />
                                      Verdadero
                                    </label>
                                  </div>

                                  <div className="flex items-center space-x-2">
                                    <input
                                      type="radio"
                                      id={`false-${questionIndex}`}
                                      className="size-4"
                                      checked={field.value === "false"}
                                      onChange={() => field.onChange("false")}
                                    />
                                    <label
                                      htmlFor={`false-${questionIndex}`}
                                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-1"
                                    >
                                      <XCircle className="size-4 text-red-500" />
                                      Falso
                                    </label>
                                  </div>
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}

                    {/* Para texto abierto no necesitamos opciones adicionales */}
                    {questionType === "OPEN_TEXT" && (
                      <div className="space-y-2 pl-4 border-l-2 border-muted">
                        <h4 className="text-sm font-medium">
                          Respuesta abierta
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          El estudiante podrá escribir texto libremente para
                          responder esta pregunta. Tendrás que calificar esta
                          respuesta manualmente.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            <Button
              type="button"
              variant="outline"
              onClick={() =>
                appendQuestion({
                  text: "",
                  type: "MULTIPLE_CHOICE",
                  points: 10,
                  options: [{ text: "" }, { text: "" }],
                  correctAnswer: "",
                })
              }
            >
              <Plus className="mr-2 size-4" />
              Agregar Pregunta
            </Button>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
              Crear Tarea
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
