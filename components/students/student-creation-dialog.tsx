"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { UserPlus, Loader2, KeyRound } from "lucide-react";

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
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

// Schema para validar la creación de estudiantes
const formSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  email: z.string().email("Correo electrónico inválido"),
  generatePassword: z.boolean().default(false),
  password: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface StudentCreationDialogProps {
  children?: React.ReactNode;
}

export function StudentCreationDialog({
  children,
}: StudentCreationDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdStudent, setCreatedStudent] = useState<{
    name: string;
    email: string;
    studentId: string;
    password?: string;
  } | null>(null);

  // Configurar el formulario
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      generatePassword: false,
      password: "",
    },
  });

  // Ver si se debe generar contraseña
  const generatePassword = form.watch("generatePassword");

  // Generar un ID de estudiante de 6 dígitos
  function generateStudentId() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Generar una contraseña aleatoria
  function generateRandomPassword() {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let password = "";
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  // Manejar el envío del formulario
  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);

    try {
      // Generar ID de estudiante
      const studentId = generateStudentId();

      // Generar contraseña si es necesario
      const password = values.generatePassword
        ? generateRandomPassword()
        : values.password;

      // Enviar datos al servidor
      const response = await fetch("/api/students", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: values.name,
          email: values.email,
          studentId,
          password,
          isActivated: values.generatePassword,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al crear estudiante");
      }

      const data = await response.json();

      // Guardar estudiante creado para mostrar detalles
      setCreatedStudent({
        name: values.name,
        email: values.email,
        studentId,
        password: values.generatePassword ? password : undefined,
      });

      // Mostrar mensaje de éxito
      toast.success("Estudiante creado correctamente");

      // Limpiar formulario
      form.reset();

      // Refrescar la página
      router.refresh();
    } catch (error) {
      console.error("Error al crear estudiante:", error);
      toast.error(
        error instanceof Error ? error.message : "Error al crear estudiante"
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
        setCreatedStudent(null);
        form.reset();
      }, 300);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button>
            <UserPlus className="mr-2 size-4" />
            Crear Estudiante
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {createdStudent ? "Estudiante Creado" : "Crear Nuevo Estudiante"}
          </DialogTitle>
          <DialogDescription>
            {createdStudent
              ? "El estudiante ha sido creado exitosamente. A continuación se muestran los detalles."
              : "Ingresa los datos del nuevo estudiante para registrarlo en la plataforma."}
          </DialogDescription>
        </DialogHeader>

        {createdStudent ? (
          <div className="space-y-4 py-4">
            <div className="flex flex-col items-center justify-center p-4 border rounded-lg">
              <Badge className="mb-2">ID de Estudiante</Badge>
              <div className="text-2xl font-bold">
                {createdStudent.studentId}
              </div>

              <div className="mt-4 text-center">
                <h3 className="font-medium">{createdStudent.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {createdStudent.email}
                </p>
              </div>

              {createdStudent.password && (
                <div className="mt-4 p-3 bg-muted/50 rounded-md w-full">
                  <div className="flex items-center gap-2 mb-1">
                    <KeyRound className="size-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      Contraseña generada
                    </span>
                  </div>
                  <div className="flex items-center gap-2 justify-between">
                    <code className="text-sm bg-muted p-1 rounded">
                      {createdStudent.password}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(
                          createdStudent.password as string
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
                El estudiante{" "}
                {createdStudent.password
                  ? "ya puede iniciar sesión con estos datos"
                  : "necesitará activar su cuenta utilizando el ID de estudiante proporcionado"}
                .
              </p>
            </div>

            <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
              <Button variant="outline" onClick={handleClose}>
                Cerrar
              </Button>
              <Button
                onClick={() => {
                  setCreatedStudent(null);
                  form.reset();
                }}
              >
                Crear Otro Estudiante
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
                        Ingresa el nombre completo del estudiante
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
                          placeholder="estudiante@ejemplo.com"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        El correo institucional o personal del estudiante
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Separator />

                <div className="space-y-3">
                  <h3 className="text-sm font-medium">Opciones de Cuenta</h3>

                  <FormField
                    control={form.control}
                    name="generatePassword"
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-2">
                        <FormControl>
                          <input
                            type="checkbox"
                            className="size-4"
                            checked={field.value}
                            onChange={(e) => field.onChange(e.target.checked)}
                          />
                        </FormControl>
                        <div className="space-y-0.5">
                          <FormLabel className="cursor-pointer">
                            Generar contraseña automáticamente
                          </FormLabel>
                          <FormDescription>
                            Si se activa, el estudiante podrá iniciar sesión de
                            inmediato
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

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
                            Si se deja en blanco, el estudiante deberá crear su
                            propia contraseña
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
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
                    Crear Estudiante
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
