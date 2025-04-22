// app/(student)/calendar/page.tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { PrismaClient } from "@prisma/client";
import Link from "next/link";
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
} from "date-fns";
import { es } from "date-fns/locale";
import {
  Calendar as CalendarIcon,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  FileText,
  Search,
  Filter,
  AlertCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const prisma = new PrismaClient();

// Obtener las tareas y eventos del estudiante
async function getStudentCalendarEvents(userId: string) {
  try {
    // Obtener el estudiante
    const student = await prisma.student.findFirst({
      where: { userId },
    });

    if (!student) {
      return null;
    }

    // Obtener las materias del estudiante
    const enrollments = await prisma.enrollment.findMany({
      where: {
        studentId: student.id,
        status: "APPROVED",
      },
      include: {
        subject: true,
      },
    });

    const subjectIds = enrollments.map((e) => e.subject.id);

    if (subjectIds.length === 0) {
      return {
        student,
        homeworks: [],
        subjects: [],
      };
    }

    // Obtener todas las tareas de las materias en las que está inscrito
    const homeworks = await prisma.homework.findMany({
      where: {
        subjectId: { in: subjectIds },
      },
      include: {
        subject: true,
        submissions: {
          where: {
            studentId: student.id,
          },
          include: {
            grade: true,
          },
        },
      },
      orderBy: {
        dueDate: "asc",
      },
    });

    return {
      student,
      homeworks,
      subjects: enrollments.map((e) => e.subject),
    };
  } catch (error) {
    console.error("Error al obtener eventos del calendario:", error);
    return null;
  }
}

export default async function CalendarPage() {
  const session = await auth();

  if (!session || session.user.role !== "STUDENT") {
    redirect("/login");
  }

  const data = await getStudentCalendarEvents(session.user.id);

  if (!data) {
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

  const { homeworks, subjects } = data;

  // Agrupar las tareas por fecha
  const groupedHomeworks: Record<string, typeof homeworks> = {};

  homeworks.forEach((homework) => {
    const dateKey = format(new Date(homework.dueDate), "yyyy-MM-dd");
    if (!groupedHomeworks[dateKey]) {
      groupedHomeworks[dateKey] = [];
    }
    groupedHomeworks[dateKey].push(homework);
  });

  // Get current month days
  const today = new Date();
  const firstDay = startOfMonth(today);
  const lastDay = endOfMonth(today);
  const daysInMonth = eachDayOfInterval({ start: firstDay, end: lastDay });

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-2">Calendario Académico</h1>
      <p className="text-muted-foreground mb-8">
        Visualiza tus tareas y eventos importantes
      </p>

      <div className="bg-card rounded-lg border shadow-sm mb-6">
        <div className="flex flex-col md:flex-row md:items-center gap-3 p-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar eventos..." className="pl-9" />
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Select defaultValue="all">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por materia" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las materias</SelectItem>
                {subjects.map((subject) => (
                  <SelectItem key={subject.id} value={subject.id}>
                    {subject.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select defaultValue="homework">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Tipo de evento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los eventos</SelectItem>
                <SelectItem value="homework">Tareas</SelectItem>
                <SelectItem value="exam">Exámenes</SelectItem>
                <SelectItem value="class">Clases</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
        <div className="md:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle>
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="size-5" />
                    <span>{format(today, "MMMM yyyy", { locale: es })}</span>
                  </div>
                </CardTitle>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="icon">
                    <ArrowLeft className="size-4" />
                  </Button>
                  <Button variant="outline" size="icon">
                    <ArrowRight className="size-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-1 text-center">
                {["Lu", "Ma", "Mi", "Ju", "Vi", "Sa", "Do"].map((day) => (
                  <div
                    key={day}
                    className="py-2 text-sm font-medium text-muted-foreground"
                  >
                    {day}
                  </div>
                ))}

                {/* Empty cells for days before the first day of month */}
                {Array.from({
                  length: firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1,
                }).map((_, i) => (
                  <div key={`empty-${i}`} className="py-2" />
                ))}

                {/* Calendar days */}
                {daysInMonth.map((date) => {
                  const dateKey = format(date, "yyyy-MM-dd");
                  const hasEvents = groupedHomeworks[dateKey]?.length > 0;
                  const isToday = isSameDay(date, today);

                  return (
                    <Popover key={date.toString()}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="ghost"
                          className={cn(
                            "h-10 w-10 p-0 font-normal rounded-full",
                            isToday &&
                              "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                            hasEvents &&
                              !isToday &&
                              "bg-primary/10 hover:bg-primary/20"
                          )}
                        >
                          <span>{format(date, "d")}</span>
                          {hasEvents && !isToday && (
                            <span className="absolute -bottom-0.5 w-1.5 h-1.5 rounded-full bg-primary" />
                          )}
                        </Button>
                      </PopoverTrigger>
                      {hasEvents && (
                        <PopoverContent className="w-80 p-0" align="center">
                          <div className="p-4 pb-2 border-b">
                            <h4 className="font-medium">
                              {format(date, "EEEE d", { locale: es })} de{" "}
                              {format(date, "MMMM", { locale: es })}
                            </h4>
                          </div>
                          <div className="p-4 space-y-3 max-h-80 overflow-auto">
                            {groupedHomeworks[dateKey]?.map((homework) => (
                              <div
                                key={homework.id}
                                className="flex items-start gap-3 pb-3 border-b last:border-0 last:pb-0"
                              >
                                <div
                                  className={cn(
                                    "p-1.5 rounded-md",
                                    homework.submissions.length > 0
                                      ? "bg-green-500/10"
                                      : "bg-primary/10"
                                  )}
                                >
                                  <FileText
                                    className={cn(
                                      "size-4",
                                      homework.submissions.length > 0
                                        ? "text-green-500"
                                        : "text-primary"
                                    )}
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <Link
                                    href={`/subjects/${homework.subject.id}/homeworks/${homework.id}`}
                                    className="font-medium text-sm hover:text-primary hover:underline block truncate"
                                  >
                                    {homework.title}
                                  </Link>
                                  <div className="flex items-center gap-1 mt-1">
                                    <BookOpen className="size-3 text-muted-foreground" />
                                    <span className="text-xs text-muted-foreground">
                                      {homework.subject.name}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1 mt-1">
                                    <CalendarIcon className="size-3 text-muted-foreground" />
                                    <span className="text-xs text-muted-foreground">
                                      {format(
                                        new Date(homework.dueDate),
                                        "h:mm a",
                                        { locale: es }
                                      )}
                                    </span>
                                    <Badge
                                      className="ml-2 text-[10px] h-4"
                                      variant={
                                        homework.submissions.length > 0
                                          ? "default"
                                          : "outline"
                                      }
                                    >
                                      {homework.submissions.length > 0
                                        ? "Entregada"
                                        : "Pendiente"}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </PopoverContent>
                      )}
                    </Popover>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Próximas entregas</CardTitle>
              <CardDescription>Tareas con fecha límite cercana</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {homeworks
                  .filter(
                    (hw) =>
                      new Date(hw.dueDate) > new Date() &&
                      hw.submissions.length === 0
                  )
                  .slice(0, 5)
                  .map((homework) => (
                    <div
                      key={homework.id}
                      className="flex items-start gap-3 pb-4 border-b last:border-0 last:pb-0"
                    >
                      <div className="bg-primary/10 p-2 rounded-md">
                        <FileText className="size-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/subjects/${homework.subject.id}/homeworks/${homework.id}`}
                          className="font-medium text-sm hover:text-primary hover:underline block truncate"
                        >
                          {homework.title}
                        </Link>
                        <div className="flex items-center gap-1 mt-1">
                          <BookOpen className="size-3.5 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground truncate">
                            {homework.subject.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          <CalendarIcon className="size-3.5 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {format(
                              new Date(homework.dueDate),
                              "d 'de' MMMM, h:mm a",
                              { locale: es }
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}

                {homeworks.filter(
                  (hw) =>
                    new Date(hw.dueDate) > new Date() &&
                    hw.submissions.length === 0
                ).length === 0 && (
                  <div className="flex flex-col items-center justify-center py-6 text-center">
                    <CalendarIcon className="size-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      No tienes entregas pendientes próximas
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
