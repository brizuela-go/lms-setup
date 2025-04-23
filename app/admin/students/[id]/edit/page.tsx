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
  Loader2,
  KeyRound,
  Mail,
  User,
  BadgeCheck,
  BadgeX,
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
} from "@/components/ui/breadcrumb";

interface Student {
  id: string;
  userId: string;
  studentId: string;
  isActivated: boolean;
  joinedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
}

// Schema para validar la edición de estudiantes
const formSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  email: z.string().email("Correo electrónico inválido"),
  studentId: z.string().length(6, "El ID de estudiante debe tener 6 dígitos"),
  isActivated: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

export default function StudentEditPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [student, setStudent] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  // Configurar el formulario
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      studentId: "",
      isActivated: false,
    },
  });

  // Cargar datos del estudiante
  useEffect(() => {
    async function loadStudent() {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/students?id=${params.id}`);
        if (!response.ok)
          throw new Error("Error al cargar datos del estudiante");

        const data = await response.json();
        setStudent(data.student);

        // Establecer valores por defecto del formulario
        form.reset({
          name: data.student.user.name,
          email: data.student.user.email,
          studentId: data.student.studentId,
          isActivated: data.student.isActivated,
        });
      } catch (error) {
        toast.error("Error al cargar datos del estudiante");
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }

    loadStudent();
  }, [params.id, form]);

  // Generar iniciales para el avatar
  const initials = student?.user.name
    ? student.user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "ST";

  // Manejar envío del formulario
  async function onSubmit(values: FormValues) {
    setIsSaving(true);

    try {
      const response = await fetch("/api/students", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: params.id,
          name: values.name,
          email: values.email,
          studentId: values.studentId,
          isActivated: values.isActivated,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al actualizar estudiante");
      }

      toast.success("Estudiante actualizado correctamente");
      router.refresh();
      router.push(`/admin/students/${params.id}`);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Error al actualizar estudiante"
      );
    } finally {
      setIsSaving(false);
    }
  }

  // Generar contraseña aleatoria
  function generateRandomPassword() {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let password = "";
    for (let i = 0; i < 10; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  // Manejar reseteo de contraseña
  async function handleResetPassword() {
    try {
      const password = generateRandomPassword();
      setNewPassword(password);

      const response = await fetch(`/api/users/${student?.userId}/password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al resetear contraseña");
      }

      toast.success("Contraseña reseteada correctamente");

      // Actualizar estado del estudiante si no estaba activado
      if (!student?.isActivated) {
        const activateResponse = await fetch("/api/students", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: params.id,
            isActivated: true,
          }),
        });

        if (activateResponse.ok) {
          setStudent((prev) => (prev ? { ...prev, isActivated: true } : null));
          form.setValue("isActivated", true);
        }
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Error al resetear contraseña"
      );
      setResetPasswordOpen(false);
    }
  }

  if (isLoading) {
    return (
      <div className="container py-10 flex justify-center items-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p>Cargando información del estudiante...</p>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="container py-10">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">
            Estudiante no encontrado
          </h2>
          <p className="text-muted-foreground mb-4">
            No se ha podido encontrar el estudiante solicitado.
          </p>
          <Button asChild>
            <Link href="/admin/students">Volver a la lista</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <div className="mb-6">
        <Breadcrumb>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={"/admin"}>Dashboard</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={"/admin/students"}>Estudiantes</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={`/admin/students/${student.id}`}>
                #{student.id} - {student.user.name}
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <BreadcrumbLink>Editar</BreadcrumbLink>
          </BreadcrumbItem>
        </Breadcrumb>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href={`/admin/students/${student.id}`}>
              <ChevronLeft className="size-5" />
            </Link>
          </Button>

          <div>
            <h1 className="text-3xl font-bold mb-1">Editar Estudiante</h1>
            <p className="text-muted-foreground">
              Modifica la información del estudiante
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Información del Estudiante</CardTitle>
              <CardDescription>
                Actualiza los datos personales del estudiante
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
                          <FormLabel>Nombre Completo</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Nombre del estudiante"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Correo Electrónico</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="Email"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="studentId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ID de Estudiante</FormLabel>
                          <FormControl>
                            <Input placeholder="ID de 6 dígitos" {...field} />
                          </FormControl>
                          <FormDescription>
                            Identificador único de 6 dígitos
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="isActivated"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center justify-between mb-4">
                            <FormLabel>Estado de la Cuenta</FormLabel>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </div>

                          <div className="border rounded-md p-3">
                            {field.value ? (
                              <div className="flex items-center gap-2 text-sm">
                                <BadgeCheck className="size-4 text-green-500" />
                                <span className="font-medium">
                                  Cuenta Activada
                                </span>
                                <span className="text-muted-foreground ml-1">
                                  El estudiante puede iniciar sesión
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 text-sm">
                                <BadgeX className="size-4 text-amber-500" />
                                <span className="font-medium">
                                  Cuenta Pendiente
                                </span>
                                <span className="text-muted-foreground ml-1">
                                  El estudiante necesita activar su cuenta
                                </span>
                              </div>
                            )}
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" type="button" asChild>
                      <Link href={`/admin/students/${student.id}`}>
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
              <CardTitle>Perfil</CardTitle>
              <CardDescription>Detalles de la cuenta</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <Avatar className="size-24 mb-4">
                <AvatarImage src={student.user.image || ""} />
                <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
              </Avatar>
              <h3 className="text-xl font-semibold">{student.user.name}</h3>
              <div className="flex items-center gap-1 text-sm text-muted-foreground mb-6">
                <Mail className="size-4" />
                <span>{student.user.email}</span>
              </div>

              <div className="w-full space-y-4">
                <div className="border rounded-md p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <User className="size-4 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        ID de Estudiante
                      </span>
                    </div>
                    <Badge variant="outline">{student.studentId}</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
            <Separator />
            <CardFooter className="flex flex-col gap-2 pt-6">
              <AlertDialog
                open={resetPasswordOpen}
                onOpenChange={setResetPasswordOpen}
              >
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="w-full">
                    <KeyRound className="mr-2 size-4" />
                    Resetear Contraseña
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Resetear contraseña?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Se generará una nueva contraseña para el estudiante. La
                      contraseña actual dejará de funcionar.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  {newPassword ? (
                    <div className="bg-muted/50 rounded-md p-4 my-2">
                      <div className="flex items-center justify-between">
                        <div className="font-medium mb-1">
                          Nueva contraseña:
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(newPassword);
                            toast.success("Contraseña copiada al portapapeles");
                          }}
                        >
                          Copiar
                        </Button>
                      </div>
                      <code className="bg-muted p-2 block rounded w-full overflow-x-auto">
                        {newPassword}
                      </code>
                      <p className="text-sm text-muted-foreground mt-2">
                        Guarda esta contraseña en un lugar seguro. No se volverá
                        a mostrar.
                      </p>
                    </div>
                  ) : (
                    <>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleResetPassword}>
                          Resetear Contraseña
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </>
                  )}
                  {newPassword && (
                    <Button
                      className="w-full mt-2"
                      onClick={() => setResetPasswordOpen(false)}
                    >
                      Cerrar
                    </Button>
                  )}
                </AlertDialogContent>
              </AlertDialog>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
