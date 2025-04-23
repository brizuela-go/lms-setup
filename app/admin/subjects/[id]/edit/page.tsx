"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  ChevronLeft,
  Save,
  Loader2,
  CalendarRange,
  School,
  BookOpen,
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
} from "@/components/ui/breadcrumb";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Teacher {
  id: string;
  userId: string;
  department: string | null;
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
}

interface Subject {
  id: string;
  name: string;
  code: string;
  description: string | null;
  startDate: string;
  endDate: string;
  teacherId: string;
  teacher: {
    id: string;
    department: string | null;
    user: {
      id: string;
      name: string;
      email: string;
      image: string | null;
    };
  };
}

// Schema para validar la edición de materias
const formSchema = z
  .object({
    name: z.string().min(1, "El nombre es obligatorio"),
    code: z.string().min(1, "El código es obligatorio"),
    description: z.string().nullable(),
    teacherId: z.string().min(1, "Selecciona un profesor"),
    startDate: z.date({
      required_error: "La fecha de inicio es obligatoria",
    }),
    endDate: z.date({
      required_error: "La fecha de finalización es obligatoria",
    }),
  })
  .refine((data) => data.endDate > data.startDate, {
    message: "La fecha de finalización debe ser posterior a la fecha de inicio",
    path: ["endDate"],
  });

type FormValues = z.infer<typeof formSchema>;

export default function SubjectEditPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [subject, setSubject] = useState<Subject | null>(null);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Configurar el formulario
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      code: "",
      description: "",
      teacherId: "",
      startDate: new Date(),
      endDate: new Date(new Date().setMonth(new Date().getMonth() + 4)),
    },
  });

  // Cargar datos de la materia y profesores
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        // Cargar materia
        const subjectResponse = await fetch(`/api/subjects?id=${params.id}`);
        if (!subjectResponse.ok)
          throw new Error("Error al cargar datos de la materia");

        const subjectData = await subjectResponse.json();
        setSubject(subjectData.subject);

        // Cargar profesores
        const teachersResponse = await fetch("/api/teachers");
        if (!teachersResponse.ok) throw new Error("Error al cargar profesores");

        const teachersData = await teachersResponse.json();
        setTeachers(teachersData.teachers);

        // Establecer valores por defecto del formulario
        form.reset({
          name: subjectData.subject.name,
          code: subjectData.subject.code,
          description: subjectData.subject.description,
          teacherId: subjectData.subject.teacherId,
          startDate: new Date(subjectData.subject.startDate),
          endDate: new Date(subjectData.subject.endDate),
        });
      } catch (error) {
        toast.error("Error al cargar datos");
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [params.id, form]);

  // Manejar envío del formulario
  async function onSubmit(values: FormValues) {
    setIsSaving(true);

    try {
      const response = await fetch("/api/subjects", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: params.id,
          name: values.name,
          code: values.code,
          description: values.description,
          teacherId: values.teacherId,
          startDate: values.startDate.toISOString(),
          endDate: values.endDate.toISOString(),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al actualizar materia");
      }

      toast.success("Materia actualizada correctamente");
      router.refresh();
      router.push(`/admin/subjects/${params.id}`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Error al actualizar materia"
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="container py-10 flex justify-center items-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p>Cargando información de la materia...</p>
        </div>
      </div>
    );
  }

  if (!subject) {
    return (
      <div className="container py-10">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Materia no encontrada</h2>
          <p className="text-muted-foreground mb-4">
            No se ha podido encontrar la materia solicitada.
          </p>
          <Button asChild>
            <Link href="/admin/subjects">Volver a la lista</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href={`/admin/subjects/${subject.id}`}>
              <ChevronLeft className="size-5" />
            </Link>
          </Button>

          <div>
            <h1 className="text-3xl font-bold mb-1">Editar Materia</h1>
            <p className="text-muted-foreground">
              Modifica la información de la materia
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Información de la Materia</CardTitle>
              <CardDescription>
                Actualiza los datos principales de la materia
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                >
                  <div className="grid gap-6 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Nombre de la materia"
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
                            placeholder="Descripción de la materia..."
                            className="min-h-24 resize-y"
                            {...field}
                            value={field.value || ""}
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
                                {teacher.department &&
                                  ` - ${teacher.department}`}
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

                  <div className="grid gap-6 sm:grid-cols-2">
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
                            <PopoverContent
                              className="w-auto p-0"
                              align="start"
                            >
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
                            <PopoverContent
                              className="w-auto p-0"
                              align="start"
                            >
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                initialFocus
                                disabled={(date) =>
                                  date <= form.getValues("startDate")
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

                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" type="button" asChild>
                      <Link href={`/admin/subjects/${subject.id}`}>
                        Cancelar
                      </Link>
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSaving || !form.formState.isDirty}
                    >
                      {isSaving && (
                        <Loader2 className="mr-2 size-4 animate-spin" />
                      )}
                      Guardar Cambios
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Información Actual</CardTitle>
              <CardDescription>Datos actuales de la materia</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Materia</p>
                <div className="flex items-center gap-2">
                  <BookOpen className="size-5 text-primary" />
                  <div>
                    <p className="font-medium">{subject.name}</p>
                    <Badge variant="outline">{subject.code}</Badge>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Profesor Actual
                </p>
                <div className="flex items-center gap-2">
                  <Avatar className="size-8">
                    <AvatarImage src={subject.teacher.user.image || ""} />
                    <AvatarFallback>
                      {subject.teacher.user.name &&
                        subject.teacher.user.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">
                      {subject.teacher.user.name}
                    </p>
                    {subject.teacher.department && (
                      <p className="text-xs text-muted-foreground">
                        {subject.teacher.department}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Período Actual
                </p>
                <div className="flex items-center gap-2">
                  <CalendarRange className="size-4 text-muted-foreground" />
                  <span>
                    {format(new Date(subject.startDate), "d MMM, yyyy", {
                      locale: es,
                    })}
                    {" - "}
                    {format(new Date(subject.endDate), "d MMM, yyyy", {
                      locale: es,
                    })}
                  </span>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <p className="text-xs text-muted-foreground">
                <strong>Nota:</strong> Al cambiar el profesor, todas las tareas
                creadas seguirán asociadas a la materia, pero el nuevo profesor
                será responsable de gestionarlas.
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
