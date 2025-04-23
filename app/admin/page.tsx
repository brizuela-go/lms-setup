// app/admin/page.tsx

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { PrismaClient } from "@prisma/client";
import Link from "next/link";
import {
  Users,
  BookOpen,
  School,
  GraduationCap,
  FileText,
  BarChart3,
  PlusCircle,
  TrendingUp,
  Activity,
  Landmark,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const prisma = new PrismaClient();

// Obtener estadísticas generales del sistema
async function getSystemStats() {
  try {
    // Contar usuarios por rol
    const studentCount = await prisma.student.count();
    const teacherCount = await prisma.teacher.count();
    const adminCount = await prisma.user.count({
      where: {
        role: {
          in: ["ADMIN", "SUPERADMIN"],
        },
      },
    });

    // Contar materias activas
    const subjectCount = await prisma.subject.count();
    const activeSubjectCount = await prisma.subject.count({
      where: {
        startDate: { lte: new Date() },
        endDate: { gte: new Date() },
      },
    });

    // Contar tareas y envíos
    const homeworkCount = await prisma.homework.count();
    const submissionCount = await prisma.submission.count();
    const pendingGradesCount = await prisma.submission.count({
      where: {
        grade: null,
      },
    });

    // Últimos estudiantes registrados
    const recentStudents = await prisma.student.findMany({
      take: 5,
      orderBy: {
        joinedAt: "desc",
      },
      include: {
        user: true,
      },
    });

    // Últimas calificaciones
    const recentGrades = await prisma.grade.findMany({
      take: 5,
      orderBy: {
        gradedAt: "desc",
      },
      include: {
        student: {
          include: {
            user: true,
          },
        },
        teacher: {
          include: {
            user: true,
          },
        },
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
    });

    return {
      counts: {
        students: studentCount,
        teachers: teacherCount,
        admins: adminCount,
        subjects: subjectCount,
        activeSubjects: activeSubjectCount,
        homeworks: homeworkCount,
        submissions: submissionCount,
        pendingGrades: pendingGradesCount,
      },
      recentStudents,
      recentGrades,
    };
  } catch (error) {
    console.error("Error al obtener estadísticas:", error);
    return {
      counts: {
        students: 0,
        teachers: 0,
        admins: 0,
        subjects: 0,
        activeSubjects: 0,
        homeworks: 0,
        submissions: 0,
        pendingGrades: 0,
      },
      recentStudents: [],
      recentGrades: [],
    };
  }
}

export default async function AdminDashboard() {
  const session = await auth();

  if (
    !session ||
    (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")
  ) {
    redirect("/login");
  }

  const stats = await getSystemStats();

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-2">Dashboard de Administración</h1>
      <p className="text-muted-foreground mb-8">
        Bienvenid@ al panel de control administrativo de SaberPro
      </p>

      <div className="grid gap-6 grid-cols-2 lg:grid-cols-3">
        <StatsCard
          title="Estudiantes"
          value={stats.counts.students}
          icon={<Users className="size-5 text-blue-500" />}
          trend="+12% este mes"
          href="/admin/students"
        />

        <StatsCard
          title="Profesores"
          value={stats.counts.teachers}
          icon={<School className="size-5 text-green-500" />}
          trend="2 nuevos esta semana"
          href="/admin/teachers"
        />

        <StatsCard
          title="Materias Activas"
          value={stats.counts.activeSubjects}
          icon={<BookOpen className="size-5 text-orange-500" />}
          trend="1 nueva este año"
          secondaryValue={`/${stats.counts.subjects} total`}
          href="/admin/subjects"
        />
      </div>

      <div className="grid gap-6 mt-6 grid-cols-1 lg:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Distribución de Usuarios</CardTitle>
            <CardDescription>
              Total de usuarios en la plataforma por rol
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-blue-500/10 rounded-lg p-4">
                <Users className="size-8 text-blue-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">{stats.counts.students}</p>
                <p className="text-sm text-muted-foreground">Estudiantes</p>
              </div>

              <div className="bg-green-500/10 rounded-lg p-4">
                <School className="size-8 text-green-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">{stats.counts.teachers}</p>
                <p className="text-sm text-muted-foreground">Profesores</p>
              </div>

              <div className="bg-purple-500/10 rounded-lg p-4">
                <Landmark className="size-8 text-purple-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">{stats.counts.admins}</p>
                <p className="text-sm text-muted-foreground">Administradores</p>
              </div>
            </div>

            <div className="mt-6 flex justify-center">
              <Button variant={"secondary"} asChild>
                <Link href="/admin/users">
                  <Users className="mr-2 size-4" />
                  Ver todos los usuarios
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Actividad del Sistema</CardTitle>
            <CardDescription>
              Métricas de participación y rendimiento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Activity className="size-4 text-muted-foreground mr-2" />
                    <span className="text-sm">Tasa de finalización</span>
                  </div>
                  <span className="font-medium">
                    {stats.counts.submissions > 0 && stats.counts.homeworks > 0
                      ? Math.round(
                          (stats.counts.submissions /
                            (stats.counts.students * stats.counts.homeworks)) *
                            100
                        )
                      : 0}
                    %
                  </span>
                </div>

                <div className="h-2 bg-muted rounded-full">
                  <div
                    className="h-2 bg-green-500 rounded-full"
                    style={{
                      width: `${
                        stats.counts.submissions > 0 &&
                        stats.counts.homeworks > 0
                          ? Math.round(
                              (stats.counts.submissions /
                                (stats.counts.students *
                                  stats.counts.homeworks)) *
                                100
                            )
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <GraduationCap className="size-4 text-muted-foreground mr-2" />
                    <span className="text-sm">Tareas calificadas</span>
                  </div>
                  <span className="font-medium">
                    {stats.counts.submissions > 0
                      ? Math.round(
                          ((stats.counts.submissions -
                            stats.counts.pendingGrades) /
                            stats.counts.submissions) *
                            100
                        )
                      : 0}
                    %
                  </span>
                </div>

                <div className="h-2 bg-muted rounded-full">
                  <div
                    className="h-2 bg-blue-500 rounded-full"
                    style={{
                      width: `${
                        stats.counts.submissions > 0
                          ? Math.round(
                              ((stats.counts.submissions -
                                stats.counts.pendingGrades) /
                                stats.counts.submissions) *
                                100
                            )
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-sm font-medium mb-3">Actividad reciente</h3>

              {stats.recentGrades.length > 0 ? (
                <div className="space-y-3">
                  {stats.recentGrades.slice(0, 3).map((grade) => (
                    <div
                      key={grade.id}
                      className="flex items-center gap-2 text-sm"
                    >
                      <div className="bg-primary/10 p-1.5 rounded-full">
                        <GraduationCap className="size-3.5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate">
                          <span className="font-medium">
                            {grade.teacher.user.name}
                          </span>{" "}
                          calificó a{" "}
                          <span className="font-medium">
                            {grade.student.user.name}
                          </span>
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {grade.submission.homework.title} (
                          {grade.submission.homework.subject.name})
                        </p>
                      </div>
                      <span className="font-medium">{grade.score}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  No hay actividad reciente
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 mt-6 grid-cols-1">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>Acciones Rápidas</CardTitle>
                <CardDescription>
                  Gestiona los principales recursos del sistema
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 ">
              <AdminActionCard
                title="Crear Estudiante"
                description="Registra un nuevo estudiante en el sistema"
                icon={<Users className="size-5" />}
                buttonIcon={<PlusCircle className="size-4 mr-2" />}
                buttonText="Nuevo Estudiante"
                href="/admin/students"
              />

              <AdminActionCard
                title="Crear Profesor"
                description="Añade un nuevo profesor al sistema"
                icon={<School className="size-5" />}
                buttonIcon={<PlusCircle className="size-4 mr-2" />}
                buttonText="Nuevo Profesor"
                href="/admin/teachers"
              />

              <AdminActionCard
                title="Crear Materia"
                description="Añade una nueva materia al sistema"
                icon={<BookOpen className="size-5" />}
                buttonIcon={<PlusCircle className="size-4 mr-2" />}
                buttonText="Nueva Materia"
                href="/admin/subjects"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <Tabs defaultValue="students">
          <TabsList className="mb-6">
            <TabsTrigger value="students" className="min-w-32">
              <Users className="size-4 mr-2" />
              Estudiantes Recientes
            </TabsTrigger>
            <TabsTrigger value="subjects" className="min-w-32">
              <BookOpen className="size-4 mr-2" />
              Materias Activas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="students">
            <Card>
              <CardHeader>
                <CardTitle>Estudiantes Registrados Recientemente</CardTitle>
                <CardDescription>
                  Los últimos estudiantes que se han unido a la plataforma
                </CardDescription>
              </CardHeader>
              <CardContent>
                {stats.recentStudents.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    {stats.recentStudents.map((student) => (
                      <div
                        key={student.id}
                        className="flex items-center gap-3 p-3 border rounded-md"
                      >
                        <div className="bg-blue-500/10 p-2 rounded-full">
                          <Users className="size-5 text-blue-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {student.user.name}
                          </p>
                          <p className="text-sm text-muted-foreground truncate">
                            {student.user.email}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs bg-muted px-1.5 py-0.5 rounded">
                              ID: {student.studentId}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {student.isActivated ? "Activado" : "Pendiente"}
                            </span>
                          </div>
                        </div>
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/admin/students/${student.id}`}>
                            Ver
                          </Link>
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <AlertCircle className="size-10 text-muted-foreground mx-auto mb-3" />
                    <h3 className="text-lg font-medium mb-1">
                      No hay estudiantes recientes
                    </h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      Aún no se han registrado estudiantes en el sistema.
                    </p>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button asChild variant="secondary" className="w-full">
                  <Link href="/admin/students">Ver todos los estudiantes</Link>
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="subjects">
            <Card>
              <CardHeader>
                <CardTitle>Materias Activas</CardTitle>
                <CardDescription>
                  Materias que se están impartiendo actualmente
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-10">
                  <AlertCircle className="size-10 text-muted-foreground mx-auto mb-3" />
                  <h3 className="text-lg font-medium mb-1">
                    Funcionalidad en desarrollo
                  </h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Esta sección está actualmente en desarrollo. Pronto podrás
                    ver las materias activas aquí.
                  </p>
                </div>
              </CardContent>
              <CardFooter>
                <Button asChild variant="secondary" className="w-full">
                  <Link href="/admin/subjects">Ver todas las materias</Link>
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Componente de tarjeta de estadísticas
function StatsCard({
  title,
  value,
  icon,
  trend,
  secondaryValue,
  href,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  trend?: string;
  secondaryValue?: string;
  href: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          {icon}
          <span>{title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center">
          <span className="text-2xl font-bold">{value}</span>
          {secondaryValue && (
            <span className="text-xs text-muted-foreground ml-1">
              {secondaryValue}
            </span>
          )}
        </div>
        {trend && (
          <div className="flex items-center mt-1">
            <TrendingUp className="size-3.5 text-green-500 mr-1" />
            <span className="text-xs text-green-500">{trend}</span>
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-0">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start"
          asChild
        >
          <Link href={href}>Ver detalles</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

// Componente de tarjeta de acción administrativa
function AdminActionCard({
  title,
  description,
  icon,
  buttonText,
  buttonIcon,
  href,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  buttonText: string;
  buttonIcon: React.ReactNode;
  href: string;
}) {
  return (
    <div className="border rounded-lg p-4 space-y-4">
      <div className="flex items-center gap-3">
        <div className="bg-primary/10 p-2 rounded-full">{icon}</div>
        <div>
          <h3 className="font-medium">{title}</h3>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>

      <Button asChild variant="secondary" className="w-full">
        <Link href={href}>
          {buttonIcon}
          {buttonText}
        </Link>
      </Button>
    </div>
  );
}
