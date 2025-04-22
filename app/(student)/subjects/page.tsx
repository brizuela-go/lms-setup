import { Suspense } from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { PrismaClient } from "@prisma/client";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import {
  BookOpen,
  Users,
  Calendar,
  ChevronRight,
  Search,
  PlusCircle,
  MoreHorizontal,
  Loader2,
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
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const prisma = new PrismaClient();

// Función para obtener materias del estudiante
async function getStudentSubjects(userId: string) {
  try {
    // Obtener estudiante
    const student = await prisma.student.findFirst({
      where: { userId },
    });

    if (!student) {
      return { enrolledSubjects: [], availableSubjects: [] };
    }

    // Obtener materias inscritas
    const enrollments = await prisma.enrollment.findMany({
      where: {
        studentId: student.id,
        status: { in: ["APPROVED", "PENDING"] },
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
    });

    // Obtener materias disponibles pero no inscritas
    const allSubjects = await prisma.subject.findMany({
      include: {
        teacher: {
          include: {
            user: true,
          },
        },
        enrollments: {
          where: {
            studentId: student.id,
          },
        },
      },
    });

    const availableSubjects = allSubjects.filter(
      (subject) => !subject.enrollments.length
    );

    // Para cada materia, calcular estadísticas
    const enrolledSubjectsWithStats = await Promise.all(
      enrollments.map(async (enrollment) => {
        // Contar tareas totales
        const totalHomeworks = await prisma.homework.count({
          where: { subjectId: enrollment.subject.id },
        });

        // Contar tareas completadas
        const completedHomeworks = await prisma.submission.count({
          where: {
            studentId: student.id,
            homework: { subjectId: enrollment.subject.id },
          },
        });

        // Calcular promedio de calificaciones
        const grades = await prisma.grade.findMany({
          where: {
            studentId: student.id,
            submission: {
              homework: { subjectId: enrollment.subject.id },
            },
          },
          select: { score: true },
        });

        const averageGrade = grades.length
          ? grades.reduce((acc, grade) => acc + grade.score, 0) / grades.length
          : 0;

        // Calcular progreso
        const progress = totalHomeworks
          ? Math.round((completedHomeworks / totalHomeworks) * 100)
          : 0;

        return {
          ...enrollment.subject,
          status: enrollment.status,
          enrollmentId: enrollment.id,
          stats: {
            totalHomeworks,
            completedHomeworks,
            averageGrade,
            progress,
          },
        };
      })
    );

    return {
      enrolledSubjects: enrolledSubjectsWithStats,
      availableSubjects,
    };
  } catch (error) {
    console.error("Error al obtener materias:", error);
    return { enrolledSubjects: [], availableSubjects: [] };
  }
}

export default async function SubjectsPage() {
  const session = await auth();

  if (!session || session.user.role !== "STUDENT") {
    redirect("/login");
  }

  const { enrolledSubjects, availableSubjects } = await getStudentSubjects(
    session.user.id
  );

  return (
    <div className="container py-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Mis Materias</h1>
          <p className="text-muted-foreground">
            Administra tus materias y visualiza tu progreso
          </p>
        </div>

        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar materias..."
              className="pl-9 w-[200px] md:w-[260px]"
            />
          </div>
          <Select defaultValue="all">
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Filtrar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="active">En curso</SelectItem>
              <SelectItem value="completed">Completadas</SelectItem>
              <SelectItem value="pending">Pendientes</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="enrolled">
        <TabsList className="mb-6">
          <TabsTrigger value="enrolled" className="gap-2">
            <BookOpen className="size-4" />
            <span>Mis Materias</span>
            <span className="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              {enrolledSubjects.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="available" className="gap-2">
            <PlusCircle className="size-4" />
            <span>Materias Disponibles</span>
            <span className="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              {availableSubjects.length}
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="enrolled">
          {enrolledSubjects.length === 0 ? (
            <EmptySubjectsMessage />
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {enrolledSubjects.map((subject) => (
                <SubjectCard
                  key={subject.id}
                  subject={subject}
                  isEnrolled={true}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="available">
          {availableSubjects.length === 0 ? (
            <div className="text-center py-12 bg-muted/40 rounded-lg">
              <BookOpen className="mx-auto size-10 text-muted-foreground mb-3" />
              <h3 className="text-lg font-medium mb-1">
                No hay materias disponibles
              </h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Actualmente no hay materias adicionales disponibles para
                inscripción.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {availableSubjects.map((subject) => (
                <SubjectCard
                  key={subject.id}
                  subject={subject}
                  isEnrolled={false}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Componente de tarjeta de materia
function SubjectCard({
  subject,
  isEnrolled = false,
}: {
  subject: any;
  isEnrolled: boolean;
}) {
  const isApproved = subject.status === "APPROVED";
  const isPending = subject.status === "PENDING";

  return (
    <Card className="overflow-hidden flex flex-col h-full">
      <div
        className={`h-2 ${
          isEnrolled && isApproved
            ? "bg-primary"
            : isEnrolled && isPending
            ? "bg-yellow-500"
            : "bg-muted"
        }`}
      />
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <CardTitle className="text-lg">{subject.name}</CardTitle>
            <CardDescription className="line-clamp-1">
              {subject.code}
            </CardDescription>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="size-4" />
                <span className="sr-only">Opciones</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/subjects/${subject.id}`}>Ver detalles</Link>
              </DropdownMenuItem>
              {isEnrolled ? (
                <>
                  <DropdownMenuItem asChild>
                    <Link href={`/subjects/${subject.id}/homeworks`}>
                      Ver tareas
                    </Link>
                  </DropdownMenuItem>
                  {isPending && (
                    <DropdownMenuItem className="text-destructive">
                      Cancelar solicitud
                    </DropdownMenuItem>
                  )}
                </>
              ) : (
                <DropdownMenuItem>Solicitar inscripción</DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="flex-1">
        <div className="grid gap-3">
          <div className="flex items-center gap-2">
            <Users className="size-4 text-muted-foreground" />
            <span className="text-sm">
              Prof. {subject.teacher.user.name.split(" ")[0]}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="size-4 text-muted-foreground" />
            <span className="text-sm">
              {format(new Date(subject.startDate), "d MMM", { locale: es })} -
              {format(new Date(subject.endDate), "d MMM, yyyy", { locale: es })}
            </span>
          </div>

          {isEnrolled && isApproved && subject.stats && (
            <div className="mt-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm">Progreso</span>
                <span className="text-sm font-medium">
                  {subject.stats.progress}%
                </span>
              </div>
              <Progress value={subject.stats.progress} className="h-1.5" />

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="text-center p-2 rounded-md bg-primary/10">
                  <p className="text-xs text-muted-foreground">Tareas</p>
                  <p className="text-sm font-medium">
                    {subject.stats.completedHomeworks}/
                    {subject.stats.totalHomeworks}
                  </p>
                </div>
                <div className="text-center p-2 rounded-md bg-primary/10">
                  <p className="text-xs text-muted-foreground">Promedio</p>
                  <p className="text-sm font-medium">
                    {subject.stats.averageGrade.toFixed(1)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {isEnrolled && isPending && (
            <div className="flex items-center mt-2 p-2 rounded-md bg-yellow-500/10 text-yellow-500">
              <Loader2 className="size-4 mr-2 animate-spin" />
              <span className="text-xs font-medium">
                Inscripción pendiente de aprobación
              </span>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="pt-2">
        <Button
          variant={isEnrolled ? "default" : "secondary"}
          className="w-full"
          asChild
        >
          <Link href={isEnrolled ? `/subjects/${subject.id}` : "#"}>
            {isEnrolled ? (
              <>
                <span>Ver materia</span>
                <ChevronRight className="ml-1 size-4" />
              </>
            ) : (
              <span>Solicitar inscripción</span>
            )}
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

// Mensaje cuando no hay materias inscritas
function EmptySubjectsMessage() {
  return (
    <div className="text-center py-12 bg-muted/40 rounded-lg">
      <BookOpen className="mx-auto size-10 text-muted-foreground mb-3" />
      <h3 className="text-lg font-medium mb-1">
        No estás inscrito en ninguna materia
      </h3>
      <p className="text-muted-foreground max-w-md mx-auto mb-6">
        Explora las materias disponibles y solicita inscripción en las que te
        interesen.
      </p>
      <Button asChild>
        <Link
          href="#"
          onClick={(e) => {
            e.preventDefault();
            document
              .querySelector('[value="available"]')
              ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
          }}
        >
          <PlusCircle className="mr-2 size-4" />
          Ver materias disponibles
        </Link>
      </Button>
    </div>
  );
}

// Componente de carga para Suspense
export function SubjectsSkeleton() {
  return (
    <div className="container py-10">
      <div className="flex flex-col md:flex-row justify-between gap-4 mb-8">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-[260px]" />
          <Skeleton className="h-10 w-[130px]" />
        </div>
      </div>

      <Skeleton className="h-10 w-64 mb-6" />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array(6)
          .fill(0)
          .map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <div className="h-2 bg-primary/20" />
              <CardHeader className="pb-2">
                <div className="flex justify-between">
                  <div>
                    <Skeleton className="h-5 w-36 mb-1" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-8 w-8 rounded-md" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-2 w-full mt-2" />
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <Skeleton className="h-12 rounded-md" />
                    <Skeleton className="h-12 rounded-md" />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Skeleton className="h-9 w-full" />
              </CardFooter>
            </Card>
          ))}
      </div>
    </div>
  );
}
