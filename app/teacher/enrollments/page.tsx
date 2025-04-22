// app/teacher/enrollments/page.tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { PrismaClient } from "@prisma/client";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  ClipboardList,
  Search,
  Filter,
  BookOpen,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  UserPlus,
  RefreshCw,
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
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ApproveEnrollmentForm,
  RejectEnrollmentForm,
} from "@/components/enrollments/enrollment-actions";

const prisma = new PrismaClient();

// Obtener todas las solicitudes de inscripción pendientes
async function getEnrollmentRequests(userId: string) {
  try {
    // Obtener el profesor
    const teacher = await prisma.teacher.findFirst({
      where: { userId },
    });

    if (!teacher) {
      return { pendingEnrollments: [], approvedEnrollments: [], teacher: null };
    }

    // Obtener materias del profesor
    const subjects = await prisma.subject.findMany({
      where: { teacherId: teacher.id },
      select: { id: true },
    });

    const subjectIds = subjects.map((s) => s.id);

    if (subjectIds.length === 0) {
      return { pendingEnrollments: [], approvedEnrollments: [], teacher };
    }

    // Obtener solicitudes pendientes
    const pendingEnrollments = await prisma.enrollment.findMany({
      where: {
        subjectId: { in: subjectIds },
        status: "PENDING",
      },
      include: {
        student: {
          include: {
            user: true,
          },
        },
        subject: true,
      },
      orderBy: {
        enrolledAt: "desc",
      },
    });

    // Obtener inscripciones aprobadas recientes
    const approvedEnrollments = await prisma.enrollment.findMany({
      where: {
        subjectId: { in: subjectIds },
        status: "APPROVED",
      },
      include: {
        student: {
          include: {
            user: true,
          },
        },
        subject: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: 10,
    });

    return { pendingEnrollments, approvedEnrollments, teacher };
  } catch (error) {
    console.error("Error al obtener solicitudes de inscripción:", error);
    return { pendingEnrollments: [], approvedEnrollments: [], teacher: null };
  }
}

export default async function EnrollmentsPage() {
  const session = await auth();

  if (!session || session.user.role !== "TEACHER") {
    redirect("/login");
  }

  const { pendingEnrollments, approvedEnrollments, teacher } =
    await getEnrollmentRequests(session.user.id);

  if (!teacher) {
    return (
      <div className="container py-10">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <AlertCircle className="size-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">
            No se encontraron datos de profesor
          </h2>
          <p className="text-muted-foreground max-w-md">
            No pudimos encontrar tu información de profesor. Si crees que esto
            es un error, por favor contacta a soporte.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-2">Solicitudes de Inscripción</h1>
      <p className="text-muted-foreground mb-8">
        Gestiona las solicitudes de estudiantes para inscribirse a tus materias
      </p>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3 mb-8">
        <Card className="col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-xl flex items-center gap-2">
              <Clock className="size-5 text-orange-500" />
              <span>Pendientes</span>
              <Badge variant="secondary" className="ml-auto">
                {pendingEnrollments.length}
              </Badge>
            </CardTitle>
            <CardDescription>
              Solicitudes esperando tu aprobación
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {pendingEnrollments.length}
            </div>
            <p className="text-sm text-muted-foreground">
              {pendingEnrollments.length === 0
                ? "No hay solicitudes pendientes"
                : pendingEnrollments.length === 1
                ? "1 estudiante esperando aprobación"
                : `${pendingEnrollments.length} estudiantes esperando aprobación`}
            </p>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-xl flex items-center gap-2">
              <CheckCircle2 className="size-5 text-green-500" />
              <span>Aprobadas</span>
            </CardTitle>
            <CardDescription>Inscripciones recientes aprobadas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {approvedEnrollments.length}
            </div>
            <p className="text-sm text-muted-foreground">
              Estudiantes recientemente inscritos
            </p>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-xl flex items-center gap-2">
              <UserPlus className="size-5 text-primary" />
              <span>Invitar</span>
            </CardTitle>
            <CardDescription>Invita directamente a estudiantes</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">
              <UserPlus className="mr-2 size-4" />
              Invitar Estudiantes
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="bg-card rounded-lg border shadow-sm mb-6">
        <div className="flex flex-col md:flex-row md:items-center gap-3 p-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o ID de estudiante..."
              className="pl-9"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Select defaultValue="all">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por materia" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las materias</SelectItem>
                {/* Add subjects here */}
              </SelectContent>
            </Select>

            <Select defaultValue="pending">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pendientes</SelectItem>
                <SelectItem value="approved">Aprobadas</SelectItem>
                <SelectItem value="rejected">Rechazadas</SelectItem>
                <SelectItem value="all">Todas</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="icon">
              <RefreshCw className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Solicitudes Pendientes</CardTitle>
          <CardDescription>
            Aprueba o rechaza a los estudiantes que desean unirse a tus materias
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {pendingEnrollments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ClipboardList className="size-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">
                No hay solicitudes pendientes
              </h3>
              <p className="text-muted-foreground max-w-md">
                Todas las solicitudes de inscripción han sido procesadas.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Estudiante</TableHead>
                  <TableHead>Materia</TableHead>
                  <TableHead>Fecha de Solicitud</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingEnrollments.map((enrollment) => (
                  <TableRow key={enrollment.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage
                            src={enrollment.student.user.image || ""}
                          />
                          <AvatarFallback>
                            {enrollment.student.user.name &&
                              enrollment.student.user.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {enrollment.student.user.name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            ID: {enrollment.student.studentId}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <BookOpen className="size-4 text-muted-foreground" />
                        <span>{enrollment.subject.name}</span>
                        <Badge variant="outline" className="ml-1">
                          {enrollment.subject.code}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(
                        new Date(enrollment.enrolledAt),
                        "d 'de' MMMM, yyyy",
                        { locale: es }
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <RejectEnrollmentForm enrollmentId={enrollment.id}>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive hover:bg-destructive/10"
                          >
                            <XCircle className="size-4 mr-1" />
                            Rechazar
                          </Button>
                        </RejectEnrollmentForm>
                        <ApproveEnrollmentForm enrollmentId={enrollment.id}>
                          <Button size="sm">
                            <CheckCircle2 className="size-4 mr-1" />
                            Aprobar
                          </Button>
                        </ApproveEnrollmentForm>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {approvedEnrollments.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Inscripciones Recientes</CardTitle>
            <CardDescription>
              Estudiantes recientemente aceptados en tus materias
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Estudiante</TableHead>
                  <TableHead>Materia</TableHead>
                  <TableHead>Fecha de Aprobación</TableHead>
                  <TableHead className="text-right">Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {approvedEnrollments.map((enrollment) => (
                  <TableRow key={enrollment.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage
                            src={enrollment.student.user.image || ""}
                          />
                          <AvatarFallback>
                            {enrollment.student.user.name &&
                              enrollment.student.user.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <Link
                            href={`/teacher/students/${enrollment.student.id}`}
                            className="font-medium hover:text-primary hover:underline"
                          >
                            {enrollment.student.user.name}
                          </Link>
                          <span className="text-xs text-muted-foreground">
                            ID: {enrollment.student.studentId}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <BookOpen className="size-4 text-muted-foreground" />
                        <Link
                          href={`/teacher/subjects/${enrollment.subject.id}`}
                          className="hover:text-primary hover:underline"
                        >
                          {enrollment.subject.name}
                        </Link>
                        <Badge variant="outline" className="ml-1">
                          {enrollment.subject.code}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(
                        new Date(enrollment.updatedAt),
                        "d 'de' MMMM, yyyy",
                        { locale: es }
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="default">Aprobada</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
