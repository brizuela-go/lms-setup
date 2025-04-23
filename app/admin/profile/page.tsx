"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  CircleUser,
  Mail,
  User,
  KeyRound,
  Save,
  Loader2,
  Eye,
  EyeOff,
  Shield,
  Upload,
  Camera,
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: string;
  admin: {
    id: string;
    isSuperAdmin: boolean;
  };
  createdAt: string;
}

// Schema para la edición del perfil
const profileSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  email: z.string().email("Correo electrónico inválido"),
});

// Schema para el cambio de contraseña
const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "La contraseña actual es obligatoria"),
    newPassword: z
      .string()
      .min(6, "La nueva contraseña debe tener al menos 6 caracteres"),
    confirmPassword: z
      .string()
      .min(6, "La confirmación de contraseña es obligatoria"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

// Usuario de prueba (en una implementación real esto vendría de la API)
const mockUser: AdminUser = {
  id: "admin123",
  name: "Admin Usuario",
  email: "admin@saberpro.edu",
  image: null,
  role: "SUPERADMIN",
  admin: {
    id: "adm123",
    isSuperAdmin: true,
  },
  createdAt: "2025-01-01T00:00:00.000Z",
};

export default function AdminProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  // Configurar formulario para edición del perfil
  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      email: "",
    },
  });

  // Configurar formulario para cambio de contraseña
  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Cargar datos del usuario
  useEffect(() => {
    // En una implementación real, se cargarían desde la API
    setTimeout(() => {
      setUser(mockUser);
      profileForm.reset({
        name: mockUser.name,
        email: mockUser.email,
      });
      setLoading(false);
    }, 1000);
  }, [profileForm]);

  // Manejar envío del formulario de perfil
  const onProfileSubmit = async (values: z.infer<typeof profileSchema>) => {
    setSavingProfile(true);

    try {
      // En una implementación real, se haría una petición a la API
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Actualizar el estado local
      if (user) {
        setUser({
          ...user,
          name: values.name,
          email: values.email,
        });
      }

      toast.success("Perfil actualizado correctamente");
    } catch (error) {
      toast.error("Error al actualizar el perfil");
      console.error(error);
    } finally {
      setSavingProfile(false);
    }
  };

  // Manejar envío del formulario de contraseña
  const onPasswordSubmit = async (values: z.infer<typeof passwordSchema>) => {
    setSavingPassword(true);

    try {
      // En una implementación real, se haría una petición a la API
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success("Contraseña actualizada correctamente");
      passwordForm.reset();
    } catch (error) {
      toast.error("Error al actualizar la contraseña");
      console.error(error);
    } finally {
      setSavingPassword(false);
    }
  };

  // Generar contraseña aleatoria
  const generateRandomPassword = () => {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let password = "";
    for (let i = 0; i < 10; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  // Manejar reseteo de contraseña
  const handleResetPassword = async () => {
    try {
      const password = generateRandomPassword();
      setNewPassword(password);

      // En una implementación real, se haría una petición a la API
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success("Contraseña reseteada correctamente");
    } catch (error) {
      toast.error("Error al resetear la contraseña");
      console.error(error);
      setResetPasswordDialogOpen(false);
    }
  };

  // Generar iniciales para avatar
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  // Si está cargando, mostrar un indicador
  if (loading) {
    return (
      <div className="container py-10 flex justify-center items-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p>Cargando información del perfil...</p>
        </div>
      </div>
    );
  }

  // Si no se encuentra el usuario
  if (!user) {
    return (
      <div className="container py-10">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Usuario no encontrado</h2>
          <p className="text-muted-foreground mb-4">
            No se ha podido cargar la información del perfil.
          </p>
          <Button asChild>
            <a href="/admin">Volver al dashboard</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-2">Mi Perfil</h1>
      <p className="text-muted-foreground mb-8">
        Administra tu información personal y de seguridad
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <div className="relative group">
                  <Avatar className="size-32 mb-4">
                    <AvatarImage src={user.image || ""} />
                    <AvatarFallback className="text-3xl">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition cursor-pointer">
                    <Camera className="size-6 text-white" />
                  </div>
                </div>
                <h2 className="text-xl font-semibold">{user.name}</h2>
                <p className="text-muted-foreground">{user.email}</p>
                <div className="mt-3">
                  {user.admin?.isSuperAdmin ? (
                    <Badge className="mt-1">SuperAdmin</Badge>
                  ) : (
                    <Badge variant="secondary" className="mt-1">
                      Administrador
                    </Badge>
                  )}
                </div>
              </div>

              <Separator className="my-4" />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail className="size-4 text-muted-foreground" />
                    <span className="text-sm">Email</span>
                  </div>
                  <span className="text-sm font-medium">{user.email}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="size-4 text-muted-foreground" />
                    <span className="text-sm">Rol</span>
                  </div>
                  <span className="text-sm font-medium">
                    {user.admin?.isSuperAdmin ? "SuperAdmin" : "Administrador"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3">
          <Tabs defaultValue="profile">
            <TabsList className="mb-6">
              <TabsTrigger value="profile">
                <User className="size-4 mr-2" />
                Información Personal
              </TabsTrigger>
              <TabsTrigger value="security">
                <KeyRound className="size-4 mr-2" />
                Seguridad
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>Información Personal</CardTitle>
                  <CardDescription>
                    Actualiza tu información personal
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...profileForm}>
                    <form
                      onSubmit={profileForm.handleSubmit(onProfileSubmit)}
                      className="space-y-6"
                    >
                      <FormField
                        control={profileForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nombre Completo</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormDescription>
                              Tu nombre completo como aparecerá en la plataforma
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={profileForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Correo Electrónico</FormLabel>
                            <FormControl>
                              <Input {...field} type="email" />
                            </FormControl>
                            <FormDescription>
                              Tu correo electrónico principal
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex justify-end">
                        <Button
                          type="submit"
                          disabled={
                            savingProfile || !profileForm.formState.isDirty
                          }
                        >
                          {savingProfile && (
                            <Loader2 className="mr-2 size-4 animate-spin" />
                          )}
                          <Save className="mr-2 size-4" />
                          Guardar Cambios
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security">
              <Card>
                <CardHeader>
                  <CardTitle>Cambiar Contraseña</CardTitle>
                  <CardDescription>
                    Actualiza tu contraseña para mayor seguridad
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...passwordForm}>
                    <form
                      onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
                      className="space-y-6"
                    >
                      <FormField
                        control={passwordForm.control}
                        name="currentPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Contraseña Actual</FormLabel>
                            <div className="relative">
                              <FormControl>
                                <Input
                                  {...field}
                                  type={showPassword ? "text" : "password"}
                                  autoComplete="current-password"
                                />
                              </FormControl>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-0 top-0 h-full px-3"
                                onClick={() => setShowPassword(!showPassword)}
                              >
                                {showPassword ? (
                                  <EyeOff className="size-4 text-muted-foreground" />
                                ) : (
                                  <Eye className="size-4 text-muted-foreground" />
                                )}
                              </Button>
                            </div>
                            <FormDescription>
                              Ingresa tu contraseña actual
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <FormField
                          control={passwordForm.control}
                          name="newPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nueva Contraseña</FormLabel>
                              <div className="relative">
                                <FormControl>
                                  <Input
                                    {...field}
                                    type={showNewPassword ? "text" : "password"}
                                    autoComplete="new-password"
                                  />
                                </FormControl>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="absolute right-0 top-0 h-full px-3"
                                  onClick={() =>
                                    setShowNewPassword(!showNewPassword)
                                  }
                                >
                                  {showNewPassword ? (
                                    <EyeOff className="size-4 text-muted-foreground" />
                                  ) : (
                                    <Eye className="size-4 text-muted-foreground" />
                                  )}
                                </Button>
                              </div>
                              <FormDescription>
                                Mínimo 6 caracteres
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={passwordForm.control}
                          name="confirmPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Confirmar Contraseña</FormLabel>
                              <div className="relative">
                                <FormControl>
                                  <Input
                                    {...field}
                                    type={
                                      showConfirmPassword ? "text" : "password"
                                    }
                                    autoComplete="new-password"
                                  />
                                </FormControl>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="absolute right-0 top-0 h-full px-3"
                                  onClick={() =>
                                    setShowConfirmPassword(!showConfirmPassword)
                                  }
                                >
                                  {showConfirmPassword ? (
                                    <EyeOff className="size-4 text-muted-foreground" />
                                  ) : (
                                    <Eye className="size-4 text-muted-foreground" />
                                  )}
                                </Button>
                              </div>
                              <FormDescription>
                                Vuelve a ingresar tu nueva contraseña
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="flex justify-end">
                        <Button
                          type="button"
                          variant="outline"
                          className="mr-2"
                          onClick={() => {
                            setResetPasswordDialogOpen(true);
                            setNewPassword("");
                          }}
                        >
                          <KeyRound className="mr-2 size-4" />
                          Resetear Contraseña
                        </Button>
                        <Button type="submit" disabled={savingPassword}>
                          {savingPassword && (
                            <Loader2 className="mr-2 size-4 animate-spin" />
                          )}
                          <Save className="mr-2 size-4" />
                          Actualizar Contraseña
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Diálogo para resetear contraseña */}
      <AlertDialog
        open={resetPasswordDialogOpen}
        onOpenChange={setResetPasswordDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Resetear contraseña</AlertDialogTitle>
            <AlertDialogDescription>
              Se generará una nueva contraseña. Tu contraseña actual dejará de
              funcionar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {newPassword ? (
            <div className="bg-muted/50 rounded-md p-4 my-2">
              <div className="flex items-center justify-between">
                <div className="font-medium mb-1">Nueva contraseña:</div>
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
                Guarda esta contraseña en un lugar seguro. No se volverá a
                mostrar.
              </p>
            </div>
          ) : (
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleResetPassword}>
                Resetear Contraseña
              </AlertDialogAction>
            </AlertDialogFooter>
          )}
          {newPassword && (
            <Button
              className="w-full mt-2"
              onClick={() => {
                setResetPasswordDialogOpen(false);
                setNewPassword("");
              }}
            >
              Cerrar
            </Button>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
