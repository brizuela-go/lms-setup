import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { PrismaClient } from "@prisma/client";
import Link from "next/link";

import {
  Users,
  Search,
  Mail,
  GraduationCap,
  BookOpen,
  MoreHorizontal,
  UserPlus,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Key,
  ReactElement,
  JSXElementConstructor,
  ReactNode,
  ReactPortal,
} from "react";

const prisma = new PrismaClient();

// Obtener estudiantes por profesor
async function getTeacherStudents(userId: string) {
  try {
    // Obtener profesor
    const teacher = await prisma.teacher.findFirst({
      where: { userId },
    });

    if (!teacher) {
      return { students: [] };
    }

    // Obtener materias del profesor
    const subjects = await prisma.subject.findMany({
      where: { teacherId: teacher.id },
      select: { id: true },
    });

    const subjectIds = subjects.map((s) => s.id);

    if (subjectIds.length === 0) {
      return { students: [] };
    }

    // Obtener estudiantes inscritos en las materias del profesor
    const enrollments = await prisma.enrollment.findMany({
      where: {
        subjectId: { in: subjectIds },
        status: "APPROVED",
      },
      include: {
        subject: true,
        student: {
          include: {
            user: true,
            grades: {
              where: {
                submission: {
                  homework: {
                    subject: {
                      id: { in: subjectIds },
                    },
                  },
                },
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
            },
            submissions: {
              where: {
                homework: {
                  subject: {
                    id: { in: subjectIds },
                  },
                },
              },
              include: {
                homework: {
                  include: {
                    subject: true,
                  },
                },
                grade: true,
              },
            },
          },
        },
      },
    });

    // Agrupar por estudiante
    const studentsMap = new Map();

    enrollments.forEach((enrollment) => {
      const studentId = enrollment.student.id;

      if (!studentsMap.has(studentId)) {
        // Calcular promedio de calificaciones
        const grades = enrollment.student.grades;
        const averageGrade = grades.length
          ? grades.reduce((sum, grade) => sum + grade.score, 0) / grades.length
          : 0;

        // Calcular progreso en tareas
        const submissions = enrollment.student.submissions;
        const totalHomeworks = submissions.length;
        const completedHomeworks = submissions.filter((s) => s.grade).length;
        const progress = totalHomeworks
          ? Math.round((completedHomeworks / totalHomeworks) * 100)
          : 0;

        studentsMap.set(studentId, {
          ...enrollment.student,
          subjects: [enrollment.subject],
          stats: {
            averageGrade,
            totalHomeworks,
            completedHomeworks,
            progress,
          },
        });
      } else {
        const student = studentsMap.get(studentId);
        student.subjects.push(enrollment.subject);
        studentsMap.set(studentId, student);
      }
    });

    return {
      students: Array.from(studentsMap.values()),
      subjectIds,
    };
  } catch (error) {
    console.error("Error al obtener estudiantes:", error);
    return { students: [] };
  }
}

export default async function TeacherStudentsPage() {
  const session = await auth();

  if (!session || session.user.role !== "TEACHER") {
    redirect("/login");
  }

  const { students, subjectIds } = await getTeacherStudents(session.user.id);

  // Obtener materias del profesor para el filtro
  const subjects = await prisma.subject.findMany({
    where: {
      id: { in: subjectIds || [] },
    },
    orderBy: {
      name: "asc",
    },
  });

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-2">Estudiantes</h1>
      <p className="text-muted-foreground mb-8">
        Administra y visualiza a los estudiantes de tus materias
      </p>

      <div className="bg-card rounded-lg border shadow-sm mb-6">
        <div className="flex flex-col md:flex-row md:items-center gap-3 p-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar estudiante..." className="pl-9" />
          </div>

          <div className="flex gap-2">
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

            <Select defaultValue="name">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Nombre (A-Z)</SelectItem>
                <SelectItem value="grade">Calificación</SelectItem>
                <SelectItem value="progress">Progreso</SelectItem>
                <SelectItem value="subjects">Materias</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {students.length === 0 ? (
        <div className="text-center py-12 bg-muted/40 rounded-lg">
          <Users className="mx-auto size-10 text-muted-foreground mb-3" />
          <h3 className="text-lg font-medium mb-1">
            No hay estudiantes inscritos
          </h3>
          <p className="text-muted-foreground max-w-md mx-auto mb-6">
            Aún no hay estudiantes inscritos en tus materias. Pueden solicitar
            inscripción o puedes invitarlos.
          </p>
          <Button asChild>
            <Link href="/teacher/enrollments">
              <UserPlus className="mr-2 size-4" />
              Ver solicitudes de inscripción
            </Link>
          </Button>
        </div>
      ) : (
        <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Estudiante</TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Materias</TableHead>
                <TableHead>Progreso</TableHead>
                <TableHead>Calificación</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student) => (
                <TableRow key={student.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={student.user.image || ""} />
                        <AvatarFallback>
                          {student.user.name
                            .split(" ")
                            .map((n: any[]) => n[0])
                            .join("")
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-medium">{student.user.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {student.user.email}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{student.studentId}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {student.subjects.map(
                        (
                          subject: {
                            id: Key | null | undefined;
                            name:
                              | string
                              | number
                              | bigint
                              | boolean
                              | ReactElement<
                                  unknown,
                                  string | JSXElementConstructor<any>
                                >
                              | Iterable<ReactNode>
                              | ReactPortal
                              | Promise<
                                  | string
                                  | number
                                  | bigint
                                  | boolean
                                  | ReactPortal
                                  | ReactElement<
                                      unknown,
                                      string | JSXElementConstructor<any>
                                    >
                                  | Iterable<ReactNode>
                                  | null
                                  | undefined
                                >
                              | null
                              | undefined;
                          },
                          index: number
                        ) =>
                          index < 2 ? (
                            <Badge
                              key={subject.id}
                              variant="secondary"
                              className="whitespace-nowrap"
                            >
                              {subject.name}
                            </Badge>
                          ) : index === 2 ? (
                            <Badge
                              key="more"
                              variant="outline"
                              className="whitespace-nowrap"
                            >
                              +{student.subjects.length - 2} más
                            </Badge>
                          ) : null
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-full bg-muted rounded-full h-2 max-w-24">
                        <div
                          className="bg-primary h-2 rounded-full"
                          style={{ width: `${student.stats.progress}%` }}
                        />
                      </div>
                      <span className="text-xs tabular-nums">
                        {student.stats.progress}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <span
                        className={`font-medium ${getGradeColor(
                          student.stats.averageGrade
                        )}`}
                      >
                        {student.stats.averageGrade.toFixed(1)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="size-4" />
                          <span className="sr-only">Acciones</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href={`/teacher/students/${student.id}`}>
                            <GraduationCap className="mr-2 size-4" />
                            Ver calificaciones
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <BookOpen className="mr-2 size-4" />
                          Ver tareas entregadas
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`mailto:${student.user.email}`}>
                            <Mail className="mr-2 size-4" />
                            Contactar estudiante
                          </Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="flex justify-between items-center mt-6">
        <Button variant="outline">Anterior</Button>
        <div className="text-sm text-muted-foreground">Página 1 de 1</div>
        <Button variant="outline">Siguiente</Button>
      </div>
    </div>
  );
}

// Función para obtener el color según la calificación
function getGradeColor(grade: number) {
  if (grade >= 90) return "text-green-500";
  if (grade >= 80) return "text-blue-500";
  if (grade >= 70) return "text-yellow-500";
  if (grade >= 60) return "text-orange-500";
  return "text-red-500";
}
