"use client";

import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Loader2, AtSign, KeyRound, User } from "lucide-react";

// Validation schemas
const emailSchema = z.object({
  email: z
    .string()
    .min(1, { message: "El correo es obligatorio" })
    .email({ message: "Formato de correo inválido" }),
  password: z
    .string()
    .min(1, { message: "La contraseña es obligatoria" })
    .min(6, { message: "La contraseña debe tener al menos 6 caracteres" }),
});

const studentIdSchema = z.object({
  studentId: z
    .string()
    .min(1, { message: "El ID de estudiante es obligatorio" })
    .length(6, { message: "El ID debe tener 6 dígitos" }),
  password: z
    .string()
    .min(1, { message: "La contraseña es obligatoria" })
    .min(6, { message: "La contraseña debe tener al menos 6 caracteres" }),
});

type EmailFormValues = z.infer<typeof emailSchema>;
type StudentIdFormValues = z.infer<typeof studentIdSchema>;

interface LoginFormProps extends React.ComponentProps<"form"> {
  className?: string;
}

export function LoginForm({ className, ...props }: LoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [loginTab, setLoginTab] = useState<"email" | "studentId">("email");
  const [hasAccount, setHasAccount] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Get error message from URL if it exists
  useEffect(() => {
    const error = searchParams.get("error");
    if (error) {
      if (error === "undefined") {
        setErrorMessage(
          "Error de autenticación. Por favor, verifica tus credenciales."
        );
      } else {
        setErrorMessage(decodeURIComponent(error));
      }
    }
  }, [searchParams]);

  // Email login form
  const emailForm = useForm<EmailFormValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Student ID login form
  const studentIdForm = useForm<StudentIdFormValues>({
    resolver: zodResolver(studentIdSchema),
    defaultValues: {
      studentId: "",
      password: "",
    },
  });

  // Handle email login
  async function onEmailSubmit(values: EmailFormValues) {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      console.log("Attempting email login with:", values.email);

      const result = await signIn("credentials-email", {
        email: values.email,
        password: values.password,
        redirect: false,
      });

      console.log("Login result:", result);

      if (result?.error) {
        setErrorMessage(
          result.error === "CredentialsSignin"
            ? "Credenciales inválidas"
            : result.error
        );
        return;
      }

      if (result?.ok) {
        toast.success("¡Inicio de sesión exitoso!");
        router.push("/");
        router.refresh();
      } else {
        setErrorMessage("Error desconocido al iniciar sesión");
      }
    } catch (error) {
      console.error("Login error:", error);
      setErrorMessage("Ocurrió un error inesperado");
    } finally {
      setIsLoading(false);
    }
  }

  // Handle student ID login
  async function onStudentIdSubmit(values: StudentIdFormValues) {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      console.log("Attempting student login with ID:", values.studentId);
      console.log(
        "Using provider:",
        hasAccount ? "credentials-student" : "student-activation"
      );

      const providerId = hasAccount
        ? "credentials-student"
        : "student-activation";

      const result = await signIn(providerId, {
        studentId: values.studentId,
        password: values.password,
        confirmPassword: values.password, // Only used for activation
        redirect: false,
      });

      console.log("Student login result:", result);

      if (result?.error) {
        if (result.error.includes("activado")) {
          setErrorMessage(
            "Esta cuenta no está activada. Por favor, crea una contraseña."
          );
          setHasAccount(false);
          return;
        }

        setErrorMessage(result.error);
        return;
      }

      if (result?.ok) {
        toast.success(
          hasAccount
            ? "¡Inicio de sesión exitoso!"
            : "¡Cuenta activada correctamente!"
        );
        router.push("/");
        router.refresh();
      } else {
        setErrorMessage("Error desconocido al iniciar sesión");
      }
    } catch (error) {
      console.error("Student login error:", error);
      setErrorMessage("Ocurrió un error inesperado");
    } finally {
      setIsLoading(false);
    }
  }

  // Check if student ID exists
  async function checkStudentId(studentId: string) {
    if (studentId.length !== 6) return;

    try {
      console.log("Checking student ID:", studentId);

      const response = await fetch(`/api/students/check?id=${studentId}`);
      const data = await response.json();

      console.log("Student check result:", data);

      if (data.exists && !data.activated) {
        setHasAccount(false);
        toast.info("Primera vez? Crea tu contraseña para activar tu cuenta");
      } else if (data.exists && data.activated) {
        setHasAccount(true);
      } else {
        toast.error("ID de estudiante no encontrado");
      }
    } catch (error) {
      console.error("Error checking student:", error);
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)}>
      {/* Display error message */}
      {errorMessage && (
        <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
          {errorMessage}
        </div>
      )}

      <Tabs
        defaultValue="email"
        value={loginTab}
        onValueChange={(value) => setLoginTab(value as "email" | "studentId")}
      >
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="email">
            <AtSign className="size-4 mr-2" />
            Correo
          </TabsTrigger>
          <TabsTrigger value="studentId">
            <User className="size-4 mr-2" />
            ID Estudiante
          </TabsTrigger>
        </TabsList>

        {/* Email login form */}
        <TabsContent value="email">
          <form
            onSubmit={emailForm.handleSubmit(onEmailSubmit)}
            className="grid gap-4"
          >
            <div className="grid gap-2">
              <Label htmlFor="email">Correo</Label>
              <div className="relative">
                <AtSign className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="correo@ejemplo.com"
                  className="pl-10"
                  {...emailForm.register("email")}
                  disabled={isLoading}
                />
              </div>
              {emailForm.formState.errors.email && (
                <p className="text-destructive text-sm">
                  {emailForm.formState.errors.email.message}
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  className="pl-10"
                  {...emailForm.register("password")}
                  disabled={isLoading}
                />
              </div>
              {emailForm.formState.errors.password && (
                <p className="text-destructive text-sm">
                  {emailForm.formState.errors.password.message}
                </p>
              )}
            </div>

            <Button type="submit" disabled={isLoading} className="mt-2">
              {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
              Iniciar Sesión
            </Button>
          </form>
        </TabsContent>

        {/* Student ID login form */}
        <TabsContent value="studentId">
          <form
            onSubmit={studentIdForm.handleSubmit(onStudentIdSubmit)}
            className="grid gap-4"
          >
            <div className="grid gap-2">
              <Label htmlFor="studentId">ID de Estudiante</Label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                <Input
                  id="studentId"
                  type="text"
                  placeholder="123456"
                  maxLength={6}
                  className="pl-10"
                  {...studentIdForm.register("studentId")}
                  disabled={isLoading}
                  onBlur={(e) => checkStudentId(e.target.value)}
                />
              </div>
              {studentIdForm.formState.errors.studentId && (
                <p className="text-destructive text-sm">
                  {studentIdForm.formState.errors.studentId.message}
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="studentPassword">
                {hasAccount ? "Contraseña" : "Crear Contraseña"}
              </Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                <Input
                  id="studentPassword"
                  type="password"
                  className="pl-10"
                  {...studentIdForm.register("password")}
                  disabled={isLoading}
                />
              </div>
              {studentIdForm.formState.errors.password && (
                <p className="text-destructive text-sm">
                  {studentIdForm.formState.errors.password.message}
                </p>
              )}
            </div>

            <Button type="submit" disabled={isLoading} className="mt-2">
              {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
              {hasAccount ? "Iniciar Sesión" : "Activar Cuenta"}
            </Button>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  );
}
