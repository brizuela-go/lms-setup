"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { BookOpen, Loader2, CalendarRange, School, Clock } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { es } from "date-fns/locale";

// Schema para validar la creación de materias
const formSchema = z
  .object({
    name: z.string().min(1, "El nombre es obligatorio"),
    code: z.string().min(1, "El código es obligatorio"),
    description: z.string().optional(),
    teacherId: z.string().min(1, "Selecciona un profesor"),
    startDate: z.date({
      required_error: "La fecha de inicio es obligatoria",
    }),
    endDate: z
      .date({
        required_error: "La fecha de finalización es obligatoria",
      })
      .refine(
        (date) => date > new Date(),
        "La fecha de finalización debe ser posterior a hoy"
      ),
  })
  .refine((data) => data.endDate > data.startDate, {
    message: "La fecha de finalización debe ser posterior a la fecha de inicio",
    path: ["endDate"],
  });

type FormValues = z.infer<typeof formSchema>;

interface SubjectCreationDialogProps {
  children?: React.ReactNode;
  teachers: {
    id: string;
    userId: string;
    department?: string | null;
    user: {
      name: string;
      email: string;
      image?: string | null;
    };
  }[];
}

export function SubjectCreationDialog({
  children,
  teachers,
}: SubjectCreationDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdSubject, setCreatedSubject] = useState<{
    id: string;
    name: string;
    code: string;
    teacherName: string;
    startDate: Date;
    endDate: Date;
  } | null>(null);

  // Configurar el formulario
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      code: "",
      description: "",
      teacherId: "",
      startDate: new Date(),
      endDate: new Date(new Date().setMonth(new Date().getMonth() + 4)), // 4 meses por defecto
    },
  });

  // Manejar el envío del formulario
  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);

    try {
      // Enviar datos al servidor
      const response = await fetch("/api/subjects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: values.name,
          code: values.code,
          description: values.description || null,
          teacherId: values.teacherId,
          startDate: values.startDate.toISOString(),
          endDate: values.endDate.toISOString(),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al crear la materia");
      }

      const data = await response.json();

      // Encontrar nombre del profesor
      const teacher = teachers.find((t) => t.id === values.teacherId);

      // Guardar materia creada para mostrar detalles
      setCreatedSubject({
        id: data.subject.id,
        name: values.name,
        code: values.code,
        teacherName: teacher?.user.name || "Profesor",
        startDate: values.startDate,
        endDate: values.endDate,
      });

      // Mostrar mensaje de éxito
      toast.success("Materia creada correctamente");

      // Limpiar formulario
      form.reset();

      // Refrescar la página
      router.refresh();
    } catch (error) {
      console.error("Error al crear materia:", error);
      toast.error(
        error instanceof Error ? error.message : "Error al crear materia"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  // Cerrar el diálogo y resetear el estado
  function handleClose() {
    if (!isSubmitting) {
      setOpen(false);
      setTimeout(() => {
        setCreatedSubject(null);
        form.reset();
      }, 300);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button>
            <BookOpen className="mr-2 size-4" />
            Crear Materia
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {createdSubject ? "Materia Creada" : "Crear Nueva Materia"}
          </DialogTitle>
          <DialogDescription>
            {createdSubject
              ? "La materia ha sido creada exitosamente. A continuación se muestran los detalles."
              : "Ingresa los datos de la nueva materia para añadirla a la plataforma."}
          </DialogDescription>
        </DialogHeader>

        {createdSubject ? (
          <div className="space-y-4 py-4">
            <div className="flex flex-col items-center justify-center p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="size-5 text-primary" />
                <Badge>{createdSubject.code}</Badge>
              </div>

              <h3 className="text-xl font-bold text-center mb-1">
                {createdSubject.name}
              </h3>

              <div className="text-sm text-muted-foreground text-center">
                Prof. {createdSubject.teacherName}
              </div>

              <div className="flex items-center gap-4 mt-4 text-sm">
                <div className="flex items-center gap-1">
                  <CalendarRange className="size-4 text-muted-foreground" />
                  <span>
                    {format(createdSubject.startDate, "d MMM", { locale: es })}{" "}
                    -
                    {format(createdSubject.endDate, "d MMM, yyyy", {
                      locale: es,
                    })}
                  </span>
                </div>
              </div>

              <div className="mt-4 w-full text-center">
                <p className="text-xs text-muted-foreground">
                  Los estudiantes pueden solicitar inscripción a esta materia o
                  el profesor puede invitarlos directamente.
                </p>
              </div>
            </div>

            <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
              <Button variant="outline" onClick={handleClose}>
                Cerrar
              </Button>
              <Button
                onClick={() => {
                  setCreatedSubject(null);
                  form.reset();
                }}
              >
                Crear Otra Materia
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <ScrollArea className="max-h-[calc(80vh-200px)]">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6 pb-2"
              >
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ej: Matemáticas Avanzadas"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Código</FormLabel>
                        <FormControl>
                          <Input placeholder="Ej: MAT101" {...field} />
                        </FormControl>
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
                          placeholder="Describe brevemente la materia..."
                          className="min-h-24"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="teacherId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Profesor</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona un profesor" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {teachers.map((teacher) => (
                            <SelectItem key={teacher.id} value={teacher.id}>
                              {teacher.user.name}
                              {teacher.department && ` - ${teacher.department}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        El profesor asignado podrá administrar esta materia
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Fecha de Inicio</FormLabel>
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
                                <CalendarRange className="ml-auto size-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
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
                    name="endDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Fecha de Finalización</FormLabel>
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
                                <CalendarRange className="ml-auto size-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                              disabled={(date) =>
                                date <= form.getValues("startDate") ||
                                date < new Date()
                              }
                              locale={es}
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <DialogFooter className="pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                    disabled={isSubmitting}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && (
                      <Loader2 className="mr-2 size-4 animate-spin" />
                    )}
                    Crear Materia
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
