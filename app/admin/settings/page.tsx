"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import {
  Settings,
  Save,
  RefreshCw,
  Loader2,
  Bell,
  BookOpen,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
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
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Schema para las configuraciones generales
const generalSchema = z.object({
  platformName: z.string().min(1, "El nombre es obligatorio"),
  platformUrl: z.string().url("URL inválida"),
  supportEmail: z.string().email("Email inválido"),
  contactPhone: z.string().optional(),
  institutionName: z
    .string()
    .min(1, "El nombre de la institución es obligatorio"),
  institutionLogo: z.string().optional(),
  footerText: z.string().optional(),
  defaultLanguage: z.string(),
  timezone: z.string(),
});

// Schema para las configuraciones de notificaciones
const notificationsSchema = z.object({
  enableEmailNotifications: z.boolean(),
  notifyNewUsers: z.boolean(),
  notifyNewSubmissions: z.boolean(),
  notifyNewHomeworks: z.boolean(),
  notifyGrades: z.boolean(),
  emailDigest: z.boolean(),
  digestFrequency: z.string(),
});

// Schema para las configuraciones académicas
const academicSchema = z.object({
  defaultGradingScale: z.string(),
  passingGrade: z.number().min(0).max(100),
  allowLateSubmissions: z.boolean(),
  latePenalty: z.number().min(0).max(100),
  maxDaysLate: z.number().min(0),
  semesterStartMonth: z.number().min(1).max(12),
  semesterEndMonth: z.number().min(1).max(12),
});

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState("general");
  const [isSaving, setIsSaving] = useState(false);

  // Formulario para configuraciones generales
  const generalForm = useForm<z.infer<typeof generalSchema>>({
    resolver: zodResolver(generalSchema),
    defaultValues: {
      platformName: "SaberPro",
      platformUrl: "https://saberpro.edu",
      supportEmail: "soporte@saberpro.edu",
      contactPhone: "+52 55 1234 5678",
      institutionName: "Universidad Tecnológica",
      footerText: "© 2025 SaberPro. Todos los derechos reservados.",
      defaultLanguage: "es-MX",
      timezone: "America/Mexico_City",
    },
  });

  // Formulario para configuraciones de notificaciones
  const notificationsForm = useForm<z.infer<typeof notificationsSchema>>({
    resolver: zodResolver(notificationsSchema),
    defaultValues: {
      enableEmailNotifications: true,
      notifyNewUsers: true,
      notifyNewSubmissions: true,
      notifyNewHomeworks: true,
      notifyGrades: true,
      emailDigest: false,
      digestFrequency: "weekly",
    },
  });

  // Formulario para configuraciones académicas
  const academicForm = useForm<z.infer<typeof academicSchema>>({
    resolver: zodResolver(academicSchema),
    defaultValues: {
      defaultGradingScale: "0-100",
      passingGrade: 70,
      allowLateSubmissions: true,
      latePenalty: 10,
      maxDaysLate: 5,
      semesterStartMonth: 2,
      semesterEndMonth: 6,
    },
  });

  // Manejar envío de formulario general
  const onGeneralSubmit = (values: z.infer<typeof generalSchema>) => {
    setIsSaving(true);

    // Simulación de guardado
    setTimeout(() => {
      console.log("Configuraciones generales:", values);
      toast.success("Configuraciones generales guardadas correctamente");
      setIsSaving(false);
    }, 1000);
  };

  // Manejar envío de formulario de notificaciones
  const onNotificationsSubmit = (
    values: z.infer<typeof notificationsSchema>
  ) => {
    setIsSaving(true);

    // Simulación de guardado
    setTimeout(() => {
      console.log("Configuraciones de notificaciones:", values);
      toast.success(
        "Configuraciones de notificaciones guardadas correctamente"
      );
      setIsSaving(false);
    }, 1000);
  };

  // Manejar envío de formulario académico
  const onAcademicSubmit = (values: z.infer<typeof academicSchema>) => {
    setIsSaving(true);

    // Simulación de guardado
    setTimeout(() => {
      console.log("Configuraciones académicas:", values);
      toast.success("Configuraciones académicas guardadas correctamente");
      setIsSaving(false);
    }, 1000);
  };

  return (
    <div className="container py-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Configuración</h1>
          <p className="text-muted-foreground">
            Administra las configuraciones globales de la plataforma
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => {
              generalForm.reset();
              notificationsForm.reset();
              academicForm.reset();
              toast.info("Configuraciones reiniciadas");
            }}
          >
            <RefreshCw className="mr-2 size-4" />
            Reiniciar
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-8">
          <TabsTrigger value="general" className="min-w-32">
            <Settings className="size-4 mr-2" />
            General
          </TabsTrigger>
          <TabsTrigger value="notifications" className="min-w-32">
            <Bell className="size-4 mr-2" />
            Notificaciones
          </TabsTrigger>
          <TabsTrigger value="academic" className="min-w-32">
            <BookOpen className="size-4 mr-2" />
            Académico
          </TabsTrigger>
        </TabsList>

        {/* Configuraciones Generales */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Configuración General</CardTitle>
              <CardDescription>
                Ajusta la configuración general de la plataforma
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...generalForm}>
                <form
                  onSubmit={generalForm.handleSubmit(onGeneralSubmit)}
                  className="space-y-6"
                >
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">
                      Información de la Plataforma
                    </h3>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <FormField
                        control={generalForm.control}
                        name="platformName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nombre de la Plataforma</FormLabel>
                            <FormControl>
                              <Input placeholder="SaberPro" {...field} />
                            </FormControl>
                            <FormDescription>
                              El nombre que aparecerá en toda la plataforma
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={generalForm.control}
                        name="platformUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>URL de la Plataforma</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="https://saberpro.edu"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              La URL base de la plataforma
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <FormField
                        control={generalForm.control}
                        name="supportEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Correo de Soporte</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="soporte@saberpro.edu"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Email para recibir consultas de soporte
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={generalForm.control}
                        name="contactPhone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Teléfono de Contacto (Opcional)
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="+52 55 1234 5678"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Número de teléfono para contacto
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">
                      Información Institucional
                    </h3>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <FormField
                        control={generalForm.control}
                        name="institutionName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nombre de la Institución</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Universidad Tecnológica"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              El nombre de la institución educativa
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={generalForm.control}
                        name="institutionLogo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Logo de la Institución (URL)</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="https://ejemplo.com/logo.png"
                                {...field}
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormDescription>
                              URL de la imagen del logo institucional
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={generalForm.control}
                      name="footerText"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Texto del Pie de Página</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="© 2025 SaberPro. Todos los derechos reservados."
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormDescription>
                            El texto que aparecerá en el pie de página
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Localización</h3>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <FormField
                        control={generalForm.control}
                        name="defaultLanguage"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Idioma Predeterminado</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecciona un idioma" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="es-MX">
                                  Español (México)
                                </SelectItem>
                                <SelectItem value="es-ES">
                                  Español (España)
                                </SelectItem>
                                <SelectItem value="en-US">
                                  Inglés (EE.UU.)
                                </SelectItem>
                                <SelectItem value="en-GB">
                                  Inglés (Reino Unido)
                                </SelectItem>
                                <SelectItem value="pt-BR">
                                  Portugués (Brasil)
                                </SelectItem>
                                <SelectItem value="fr-FR">Francés</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              El idioma predeterminado de la plataforma
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={generalForm.control}
                        name="timezone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Zona Horaria</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecciona una zona horaria" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="America/Mexico_City">
                                  Ciudad de México (GMT-6)
                                </SelectItem>
                                <SelectItem value="America/Bogota">
                                  Bogotá (GMT-5)
                                </SelectItem>
                                <SelectItem value="America/Santiago">
                                  Santiago (GMT-4)
                                </SelectItem>
                                <SelectItem value="America/Sao_Paulo">
                                  São Paulo (GMT-3)
                                </SelectItem>
                                <SelectItem value="Europe/Madrid">
                                  Madrid (GMT+1)
                                </SelectItem>
                                <SelectItem value="UTC">UTC</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              La zona horaria para todas las fechas del sistema
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" disabled={isSaving}>
                      {isSaving && (
                        <Loader2 className="mr-2 size-4 animate-spin" />
                      )}
                      <Save className="mr-2 size-4" />
                      Guardar Configuración
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configuraciones de Notificaciones */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Notificaciones</CardTitle>
              <CardDescription>
                Configura cómo y cuándo se envían notificaciones
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...notificationsForm}>
                <form
                  onSubmit={notificationsForm.handleSubmit(
                    onNotificationsSubmit
                  )}
                  className="space-y-6"
                >
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">
                      Notificaciones por Email
                    </h3>

                    <FormField
                      control={notificationsForm.control}
                      name="enableEmailNotifications"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              Habilitar Notificaciones por Email
                            </FormLabel>
                            <FormDescription>
                              Enviar notificaciones a través de correo
                              electrónico
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <FormField
                        control={notificationsForm.control}
                        name="notifyNewUsers"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">
                                Nuevos Usuarios
                              </FormLabel>
                              <FormDescription>
                                Notificar cuando se registren nuevos usuarios
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                disabled={
                                  !notificationsForm.watch(
                                    "enableEmailNotifications"
                                  )
                                }
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={notificationsForm.control}
                        name="notifyNewSubmissions"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">
                                Nuevas Entregas
                              </FormLabel>
                              <FormDescription>
                                Notificar cuando se realicen nuevas entregas
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                disabled={
                                  !notificationsForm.watch(
                                    "enableEmailNotifications"
                                  )
                                }
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={notificationsForm.control}
                        name="notifyNewHomeworks"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">
                                Nuevas Tareas
                              </FormLabel>
                              <FormDescription>
                                Notificar cuando se creen nuevas tareas
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                disabled={
                                  !notificationsForm.watch(
                                    "enableEmailNotifications"
                                  )
                                }
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={notificationsForm.control}
                        name="notifyGrades"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">
                                Nuevas Calificaciones
                              </FormLabel>
                              <FormDescription>
                                Notificar cuando se registren nuevas
                                calificaciones
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                disabled={
                                  !notificationsForm.watch(
                                    "enableEmailNotifications"
                                  )
                                }
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">
                      Resumen de Actividad
                    </h3>

                    <FormField
                      control={notificationsForm.control}
                      name="emailDigest"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              Habilitar Resumen por Email
                            </FormLabel>
                            <FormDescription>
                              Enviar un resumen periódico de actividad por
                              correo electrónico
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={
                                !notificationsForm.watch(
                                  "enableEmailNotifications"
                                )
                              }
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={notificationsForm.control}
                      name="digestFrequency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Frecuencia del Resumen</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            disabled={
                              !notificationsForm.watch("emailDigest") ||
                              !notificationsForm.watch(
                                "enableEmailNotifications"
                              )
                            }
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecciona la frecuencia" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="daily">Diariamente</SelectItem>
                              <SelectItem value="weekly">
                                Semanalmente
                              </SelectItem>
                              <SelectItem value="biweekly">
                                Cada dos semanas
                              </SelectItem>
                              <SelectItem value="monthly">
                                Mensualmente
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Con qué frecuencia se enviará el resumen
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" disabled={isSaving}>
                      {isSaving && (
                        <Loader2 className="mr-2 size-4 animate-spin" />
                      )}
                      <Save className="mr-2 size-4" />
                      Guardar Configuración
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configuraciones Académicas */}
        <TabsContent value="academic">
          <Card>
            <CardHeader>
              <CardTitle>Configuración Académica</CardTitle>
              <CardDescription>
                Configura aspectos relacionados con calificaciones y períodos
                académicos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...academicForm}>
                <form
                  onSubmit={academicForm.handleSubmit(onAcademicSubmit)}
                  className="space-y-6"
                >
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">
                      Sistema de Calificaciones
                    </h3>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <FormField
                        control={academicForm.control}
                        name="defaultGradingScale"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Escala de Calificación</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecciona una escala" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="0-100">0-100</SelectItem>
                                <SelectItem value="0-10">0-10</SelectItem>
                                <SelectItem value="letter">
                                  A, B, C, D, F
                                </SelectItem>
                                <SelectItem value="percentage">
                                  Porcentaje
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              La escala de calificación predeterminada
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={academicForm.control}
                        name="passingGrade"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Calificación Aprobatoria</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(parseFloat(e.target.value))
                                }
                                value={field.value}
                              />
                            </FormControl>
                            <FormDescription>
                              La calificación mínima para aprobar (0-100)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Entregas Tardías</h3>

                    <FormField
                      control={academicForm.control}
                      name="allowLateSubmissions"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              Permitir Entregas Tardías
                            </FormLabel>
                            <FormDescription>
                              Permitir la entrega de tareas después de la fecha
                              límite
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <FormField
                        control={academicForm.control}
                        name="latePenalty"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Penalización por Retraso (%)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                disabled={
                                  !academicForm.watch("allowLateSubmissions")
                                }
                                {...field}
                                onChange={(e) =>
                                  field.onChange(parseFloat(e.target.value))
                                }
                                value={field.value}
                              />
                            </FormControl>
                            <FormDescription>
                              Porcentaje de penalización por entregas tardías
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={academicForm.control}
                        name="maxDaysLate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Días Máximos de Retraso</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                disabled={
                                  !academicForm.watch("allowLateSubmissions")
                                }
                                {...field}
                                onChange={(e) =>
                                  field.onChange(parseInt(e.target.value))
                                }
                                value={field.value}
                              />
                            </FormControl>
                            <FormDescription>
                              Número máximo de días permitidos para entregas
                              tardías
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Período Académico</h3>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <FormField
                        control={academicForm.control}
                        name="semesterStartMonth"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Mes de Inicio del Semestre</FormLabel>
                            <Select
                              onValueChange={(e) => field.onChange(parseInt(e))}
                              value={field.value.toString()}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecciona un mes" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="1">Enero</SelectItem>
                                <SelectItem value="2">Febrero</SelectItem>
                                <SelectItem value="3">Marzo</SelectItem>
                                <SelectItem value="4">Abril</SelectItem>
                                <SelectItem value="5">Mayo</SelectItem>
                                <SelectItem value="6">Junio</SelectItem>
                                <SelectItem value="7">Julio</SelectItem>
                                <SelectItem value="8">Agosto</SelectItem>
                                <SelectItem value="9">Septiembre</SelectItem>
                                <SelectItem value="10">Octubre</SelectItem>
                                <SelectItem value="11">Noviembre</SelectItem>
                                <SelectItem value="12">Diciembre</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Mes en que inicia normalmente el semestre
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={academicForm.control}
                        name="semesterEndMonth"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Mes de Finalización del Semestre
                            </FormLabel>
                            <Select
                              onValueChange={(e) => field.onChange(parseInt(e))}
                              value={field.value.toString()}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecciona un mes" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="1">Enero</SelectItem>
                                <SelectItem value="2">Febrero</SelectItem>
                                <SelectItem value="3">Marzo</SelectItem>
                                <SelectItem value="4">Abril</SelectItem>
                                <SelectItem value="5">Mayo</SelectItem>
                                <SelectItem value="6">Junio</SelectItem>
                                <SelectItem value="7">Julio</SelectItem>
                                <SelectItem value="8">Agosto</SelectItem>
                                <SelectItem value="9">Septiembre</SelectItem>
                                <SelectItem value="10">Octubre</SelectItem>
                                <SelectItem value="11">Noviembre</SelectItem>
                                <SelectItem value="12">Diciembre</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Mes en que finaliza normalmente el semestre
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" disabled={isSaving}>
                      {isSaving && (
                        <Loader2 className="mr-2 size-4 animate-spin" />
                      )}
                      <Save className="mr-2 size-4" />
                      Guardar Configuración
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
