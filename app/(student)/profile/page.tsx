// app/(student)/profile/page.tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { PrismaClient } from "@prisma/client";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Mail,
  Calendar,
  GraduationCap,
  BookOpen,
  FileText,
  Lock,
  UserCircle,
  Camera,
  AlertCircle,
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  ProfileForm,
  ProfilePasswordForm,
} from "@/components/profile/profile-forms";

const prisma = new PrismaClient();

// Obtener datos del perfil del estudiante
async function getStudentProfile(userId: string) {
  try {
    // Obtener estudiante con todas sus relaciones relevantes
    const student = await prisma.student.findFirst({
      where: { userId },
      include: {
        user: true,
        enrollments: {
          where: {
            status: "APPROVED",
          },
          include: {
            subject: {
              include: {
                teacher: {
                  include: {
                    user: true,
                  },
                },
              },
            },
          },
        },
        grades: {
          orderBy: {
            gradedAt: "desc",
          },
          include: {
            submission: {
              include: {
                homework: {
                  include: {
                    subject: true,
                  },
                },
              },
            },
          },
          take: 5,
        },
        submissions: {
          where: {
            grade: null,
          },
          include: {
            homework: {
              include: {
                subject: true,
              },
            },
          },
          orderBy: {
            submittedAt: "desc",
          },
          take: 5,
        },
      },
    });

    if (!student) {
      return null;
    }

    return student;
  } catch (error) {
    console.error("Error al obtener perfil de estudiante:", error);
    return null;
  }
}

export default async function ProfilePage() {
  const session = await auth();

  if (!session || session.user.role !== "STUDENT") {
    redirect("/login");
  }

  const studentProfile = await getStudentProfile(session.user.id);

  if (!studentProfile) {
    return (
      <div className="container py-10">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <AlertCircle className="size-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">
            No se encontraron datos de estudiante
          </h2>
          <p className="text-muted-foreground max-w-md">
            No pudimos encontrar tu información de estudiante. Si crees que esto
            es un error, por favor contacta a soporte.
          </p>
        </div>
      </div>
    );
  }

  // Calcular estadísticas
  const enrolledSubjectsCount = studentProfile.enrollments.length;

  const totalGrades = studentProfile.grades.length;
  const averageGrade =
    totalGrades > 0
      ? studentProfile.grades.reduce((acc, grade) => acc + grade.score, 0) /
        totalGrades
      : 0;

  // Iniciales del estudiante para el avatar
  const initials =
    studentProfile.user.name
      ?.split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "ST";

  // Fecha de registro formateada
  const joinDate = format(
    new Date(studentProfile.joinedAt),
    "d 'de' MMMM, yyyy",
    { locale: es }
  );

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-2">Mi Perfil</h1>
      <p className="text-muted-foreground mb-8">
        Administra tu información personal y visualiza tu actividad
      </p>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-1">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-4">
                  <Avatar className="size-24">
                    <AvatarImage src={studentProfile.user.image || ""} />
                    <AvatarFallback className="text-xl">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <h2 className="text-xl font-bold mb-1">
                  {studentProfile.user.name}
                </h2>
                <p className="text-muted-foreground text-sm">Estudiante</p>

                <Badge variant="outline" className="mt-2">
                  ID: {studentProfile.studentId}
                </Badge>

                <Separator className="my-4" />

                <div className="grid grid-cols-2 gap-4 w-full text-center">
                  <div>
                    <p className="text-2xl font-bold">
                      {enrolledSubjectsCount}
                    </p>
                    <p className="text-xs text-muted-foreground">Materias</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {averageGrade.toFixed(1)}
                    </p>
                    <p className="text-xs text-muted-foreground">Promedio</p>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="w-full space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Mail className="size-4 text-muted-foreground" />
                    {studentProfile.user.email}
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="size-4 text-muted-foreground" />
                    <span>Registrado el {joinDate}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Tabs defaultValue="data">
            <TabsList className="mb-4">
              <TabsTrigger value="data" className="flex items-center gap-2">
                <UserCircle className="size-4" />
                <span>Datos Personales</span>
              </TabsTrigger>
              <TabsTrigger value="password" className="flex items-center gap-2">
                <Lock className="size-4" />
                <span>Seguridad</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="data">
              <Card>
                <CardHeader>
                  <CardTitle>Información Personal</CardTitle>
                  <CardDescription>
                    Actualiza tus datos de contacto y perfil
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ProfileForm
                    userId={studentProfile.user.id}
                    defaultValues={{
                      name: studentProfile.user.name as string,
                      email: studentProfile.user.email,
                    }}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="password">
              <Card>
                <CardHeader>
                  <CardTitle>Cambiar Contraseña</CardTitle>
                  <CardDescription>
                    Actualiza tu contraseña para mantener tu cuenta segura
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ProfilePasswordForm userId={studentProfile.user.id} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Actividad Reciente</CardTitle>
              <CardDescription>
                Últimas calificaciones y entregas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <GraduationCap className="size-4" />
                    Calificaciones Recientes
                  </h3>

                  {studentProfile.grades.length === 0 ? (
                    <div className="text-sm text-muted-foreground">
                      No hay calificaciones recientes.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {studentProfile.grades.map((grade) => (
                        <div
                          key={grade.id}
                          className="flex items-start gap-3 pb-3 border-b last:border-0 last:pb-0"
                        >
                          <div
                            className={`p-1.5 rounded-md ${getScoreColor(
                              grade.score
                            )}`}
                          >
                            <span className="text-sm font-semibold">
                              {grade.score}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">
                              {grade.submission.homework.title}
                            </p>
                            <div className="flex items-center gap-1 mt-1">
                              <BookOpen className="size-3.5 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground truncate">
                                {grade.submission.homework.subject.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 mt-1">
                              <Calendar className="size-3.5 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">
                                {format(
                                  new Date(grade.gradedAt),
                                  "d 'de' MMMM, yyyy",
                                  { locale: es }
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Separator />

                <div>
                  <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <FileText className="size-4" />
                    Entregas Pendientes de Calificar
                  </h3>

                  {studentProfile.submissions.length === 0 ? (
                    <div className="text-sm text-muted-foreground">
                      No hay entregas pendientes de calificar.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {studentProfile.submissions.map((submission) => (
                        <div
                          key={submission.id}
                          className="flex items-start gap-3 pb-3 border-b last:border-0 last:pb-0"
                        >
                          <div className="bg-orange-500/10 p-1.5 rounded-md">
                            <FileText className="size-4 text-orange-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">
                              {submission.homework.title}
                            </p>
                            <div className="flex items-center gap-1 mt-1">
                              <BookOpen className="size-3.5 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground truncate">
                                {submission.homework.subject.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 mt-1">
                              <Calendar className="size-3.5 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">
                                Enviado el{" "}
                                {format(
                                  new Date(submission.submittedAt),
                                  "d 'de' MMMM",
                                  { locale: es }
                                )}
                              </span>
                            </div>
                          </div>
                          <Badge variant="secondary">Pendiente</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Función para obtener el color en base a la calificación
function getScoreColor(score: number): string {
  if (score >= 90) return "bg-green-500/10 text-green-500";
  if (score >= 80) return "bg-blue-500/10 text-blue-500";
  if (score >= 70) return "bg-yellow-500/10 text-yellow-500";
  if (score >= 60) return "bg-orange-500/10 text-orange-500";
  return "bg-red-500/10 text-red-500";
}
