"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { School, Loader2, KeyRound, Building2 } from "lucide-react";

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
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

// Schema para validar la creación de profesores
const formSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  email: z.string().email("Correo electrónico inválido"),
  department: z.string().optional(),
  bio: z.string().optional(),
  generatePassword: z.boolean().default(true),
  password: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface TeacherCreationDialogProps {
  children?: React.ReactNode;
  onSuccess?: () => void;
}

export function TeacherCreationDialog({
  children,
  onSuccess,
}: TeacherCreationDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdTeacher, setCreatedTeacher] = useState<{
    name: string;
    email: string;
    department?: string;
    password?: string;
  } | null>(null);

  // Configurar el formulario
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema as any),
    defaultValues: {
      name: "",
      email: "",
      department: "",
      bio: "",
      generatePassword: true,
      password: "",
    },
  });

  // Ver si se debe generar contraseña
  const generatePassword = form.watch("generatePassword");

  // Generar una contraseña aleatoria
  function generateRandomPassword() {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let password = "";
    for (let i = 0; i < 10; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  // Manejar el envío del formulario
  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);

    try {
      // Generar contraseña si es necesario
      const password = values.generatePassword
        ? generateRandomPassword()
        : values.password;

      // Enviar datos al servidor
      const response = await fetch("/api/teachers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: values.name,
          email: values.email,
          department: values.department || null,
          bio: values.bio || null,
          password,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al crear profesor");
      }

      const data = await response.json();

      // Guardar profesor creado para mostrar detalles
      setCreatedTeacher({
        name: values.name,
        email: values.email,
        department: values.department,
        password: values.generatePassword ? password : undefined,
      });

      // Mostrar mensaje de éxito
      toast.success("Profesor creado correctamente");

      // Limpiar formulario
      form.reset();

      // Refrescar la página
      router.refresh();

      // Ejecutar callback de éxito si se proporcionó
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error al crear profesor:", error);
      toast.error(
        error instanceof Error ? error.message : "Error al crear profesor"
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
        setCreatedTeacher(null);
        form.reset();
      }, 300);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button>
            <School className="mr-2 size-4" />
            Crear Profesor
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {createdTeacher ? "Profesor Creado" : "Crear Nuevo Profesor"}
          </DialogTitle>
          <DialogDescription>
            {createdTeacher
              ? "El profesor ha sido creado exitosamente. A continuación se muestran los detalles."
              : "Ingresa los datos del nuevo profesor para registrarlo en la plataforma."}
          </DialogDescription>
        </DialogHeader>

        {createdTeacher ? (
          <div className="space-y-4 py-4">
            <div className="flex flex-col items-center justify-center p-4 border rounded-lg">
              <div className="p-2 bg-primary/10 rounded-full mb-2">
                <School className="size-6 text-primary" />
              </div>

              <div className="mt-2 text-center">
                <h3 className="text-xl font-semibold">{createdTeacher.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {createdTeacher.email}
                </p>
                {createdTeacher.department && (
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <Building2 className="size-3.5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {createdTeacher.department}
                    </span>
                  </div>
                )}
              </div>

              {createdTeacher.password && (
                <div className="mt-4 p-3 bg-muted/50 rounded-md w-full">
                  <div className="flex items-center gap-2 mb-1">
                    <KeyRound className="size-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      Contraseña generada
                    </span>
                  </div>
                  <div className="flex items-center gap-2 justify-between">
                    <code className="text-sm bg-muted p-1 rounded">
                      {createdTeacher.password}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(
                          createdTeacher.password as string
                        );
                        toast.success("Contraseña copiada al portapapeles");
                      }}
                    >
                      Copiar
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Guarda esta contraseña en un lugar seguro. No se volverá a
                    mostrar.
                  </p>
                </div>
              )}

              <p className="text-xs text-muted-foreground mt-4 text-center">
                El profesor ya puede iniciar sesión con el correo electrónico y
                {createdTeacher.password
                  ? " la contraseña generada."
                  : " su contraseña."}
              </p>
            </div>

            <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
              <Button variant="outline" onClick={handleClose}>
                Cerrar
              </Button>
              <Button
                onClick={() => {
                  setCreatedTeacher(null);
                  form.reset();
                }}
              >
                Crear Otro Profesor
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
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre Completo</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Juan Pérez García" {...field} />
                      </FormControl>
                      <FormDescription>
                        Ingresa el nombre completo del profesor
                      </FormDescription>
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
                          placeholder="profesor@ejemplo.com"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        El correo institucional o personal del profesor
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="department"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Departamento (Opcional)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ej: Matemáticas"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormDescription>
                          Departamento o área académica
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="generatePassword"
                    render={({ field }) => (
                      <FormItem className="flex flex-col justify-between h-full">
                        <FormLabel>Opciones de Cuenta</FormLabel>
                        <div className="flex items-center gap-2">
                          <FormControl>
                            <input
                              type="checkbox"
                              className="size-4"
                              checked={field.value}
                              onChange={(e) => field.onChange(e.target.checked)}
                            />
                          </FormControl>
                          <div className="space-y-0.5">
                            <span className="text-sm font-medium">
                              Generar contraseña automáticamente
                            </span>
                            <p className="text-xs text-muted-foreground">
                              Al activar, se generará una contraseña segura
                            </p>
                          </div>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Biografía (Opcional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Información profesional, experiencia académica, etc."
                          className="min-h-24 resize-y"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Separator />

                {!generatePassword && (
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contraseña (Opcional)</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Contraseña"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Si se deja en blanco, se generará una contraseña
                          automáticamente
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

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
                    Crear Profesor
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
