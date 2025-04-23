"use client";

import { useState, useEffect } from "react";

import {
  BarChart,
  BarChart3,
  Download,
  FileText,
  PieChart,
  Users,
  BookOpen,
  Calendar,
  GraduationCap,
  Loader2,
  RefreshCw,
  School,
  ArrowUpDown,
  Filter,
  Shield,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface StatsData {
  users: {
    total: number;
    students: number;
    teachers: number;
    admins: number;
  };
  subjects: {
    total: number;
    active: number;
    upcoming: number;
    completed: number;
  };
  activities: {
    totalHomeworks: number;
    totalSubmissions: number;
    completionRate: number;
    gradedRate: number;
  };
  submissions: {
    total: number;
    graded: number;
    pending: number;
  };
}

interface PerformanceData {
  subjectPerformance: Array<{
    id: string;
    name: string;
    code: string;
    totalStudents: number;
    averageGrade: number;
    submissionRate: number;
  }>;
  studentPerformance: Array<{
    id: string;
    userId: string;
    studentId: string;
    name: string;
    completedTasks: number;
    totalTasks: number;
    averageGrade: number;
  }>;
  teacherPerformance: Array<{
    id: string;
    userId: string;
    name: string;
    department: string | null;
    totalStudents: number;
    totalSubjects: number;
    gradingSpeed: number; // Tiempo promedio en días para calificar
  }>;
}

const initialStatsData: StatsData = {
  users: {
    total: 0,
    students: 0,
    teachers: 0,
    admins: 0,
  },
  subjects: {
    total: 0,
    active: 0,
    upcoming: 0,
    completed: 0,
  },
  activities: {
    totalHomeworks: 0,
    totalSubmissions: 0,
    completionRate: 0,
    gradedRate: 0,
  },
  submissions: {
    total: 0,
    graded: 0,
    pending: 0,
  },
};

const initialPerformanceData: PerformanceData = {
  subjectPerformance: [],
  studentPerformance: [],
  teacherPerformance: [],
};

export default function AdminReportsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("all");
  const [statsData, setStatsData] = useState<StatsData>(initialStatsData);
  const [performanceData, setPerformanceData] = useState<PerformanceData>(
    initialPerformanceData
  );
  const [currentTab, setCurrentTab] = useState("overview");

  // Filtros para rendimiento
  const [subjectSortBy, setSubjectSortBy] = useState("name-asc");
  const [studentSortBy, setStudentSortBy] = useState("name-asc");
  const [teacherSortBy, setTeacherSortBy] = useState("name-asc");

  // Simulación de carga de datos
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      // En una implementación real, estos datos vendrían de la API
      setTimeout(() => {
        // Datos de ejemplo para simular respuesta del servidor
        const mockStatsData: StatsData = {
          users: {
            total: 158,
            students: 120,
            teachers: 25,
            admins: 13,
          },
          subjects: {
            total: 32,
            active: 18,
            upcoming: 5,
            completed: 9,
          },
          activities: {
            totalHomeworks: 126,
            totalSubmissions: 980,
            completionRate: 78,
            gradedRate: 85,
          },
          submissions: {
            total: 980,
            graded: 833,
            pending: 147,
          },
        };

        const mockPerformanceData: PerformanceData = {
          subjectPerformance: [
            {
              id: "1",
              name: "Matemáticas Avanzadas",
              code: "MAT101",
              totalStudents: 32,
              averageGrade: 78.5,
              submissionRate: 92,
            },
            {
              id: "2",
              name: "Programación en Python",
              code: "CS201",
              totalStudents: 28,
              averageGrade: 82.7,
              submissionRate: 88,
            },
            {
              id: "3",
              name: "Física Cuántica",
              code: "PHY301",
              totalStudents: 18,
              averageGrade: 75.2,
              submissionRate: 81,
            },
            {
              id: "4",
              name: "Literatura Moderna",
              code: "LIT202",
              totalStudents: 34,
              averageGrade: 84.1,
              submissionRate: 93,
            },
            {
              id: "5",
              name: "Ingeniería de Software",
              code: "CS303",
              totalStudents: 25,
              averageGrade: 79.8,
              submissionRate: 87,
            },
          ],
          studentPerformance: [
            {
              id: "1",
              userId: "u1",
              studentId: "123456",
              name: "Ana María García",
              completedTasks: 28,
              totalTasks: 32,
              averageGrade: 92.5,
            },
            {
              id: "2",
              userId: "u2",
              studentId: "234567",
              name: "Carlos Rodríguez",
              completedTasks: 25,
              totalTasks: 32,
              averageGrade: 85.2,
            },
            {
              id: "3",
              userId: "u3",
              studentId: "345678",
              name: "Sofía Martínez",
              completedTasks: 30,
              totalTasks: 32,
              averageGrade: 88.7,
            },
            {
              id: "4",
              userId: "u4",
              studentId: "456789",
              name: "Javier López",
              completedTasks: 22,
              totalTasks: 32,
              averageGrade: 79.3,
            },
            {
              id: "5",
              userId: "u5",
              studentId: "567890",
              name: "Valentina Torres",
              completedTasks: 27,
              totalTasks: 32,
              averageGrade: 84.6,
            },
          ],
          teacherPerformance: [
            {
              id: "1",
              userId: "t1",
              name: "Dr. Alejandro Fernández",
              department: "Matemáticas",
              totalStudents: 87,
              totalSubjects: 3,
              gradingSpeed: 2.3,
            },
            {
              id: "2",
              userId: "t2",
              name: "Dra. Laura Sánchez",
              department: "Ciencias Computacionales",
              totalStudents: 53,
              totalSubjects: 2,
              gradingSpeed: 1.8,
            },
            {
              id: "3",
              userId: "t3",
              name: "Prof. Miguel Ángel Ramírez",
              department: "Física",
              totalStudents: 41,
              totalSubjects: 2,
              gradingSpeed: 3.5,
            },
            {
              id: "4",
              userId: "t4",
              name: "Dra. Carmen Vega",
              department: "Literatura",
              totalStudents: 68,
              totalSubjects: 3,
              gradingSpeed: 4.2,
            },
            {
              id: "5",
              userId: "t5",
              name: "Prof. Roberto Mendoza",
              department: "Ingeniería",
              totalStudents: 72,
              totalSubjects: 3,
              gradingSpeed: 2.7,
            },
          ],
        };

        setStatsData(mockStatsData);
        setPerformanceData(mockPerformanceData);
        setIsLoading(false);
      }, 1000);
    };

    fetchData();
  }, [timeRange]);

  // Sortear datos de rendimiento según los filtros
  const sortedSubjects = [...performanceData.subjectPerformance].sort(
    (a, b) => {
      switch (subjectSortBy) {
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
        case "students-asc":
          return a.totalStudents - b.totalStudents;
        case "students-desc":
          return b.totalStudents - a.totalStudents;
        case "grade-asc":
          return a.averageGrade - b.averageGrade;
        case "grade-desc":
          return b.averageGrade - a.averageGrade;
        case "submission-asc":
          return a.submissionRate - b.submissionRate;
        case "submission-desc":
          return b.submissionRate - a.submissionRate;
        default:
          return 0;
      }
    }
  );

  const sortedStudents = [...performanceData.studentPerformance].sort(
    (a, b) => {
      switch (studentSortBy) {
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
        case "id-asc":
          return a.studentId.localeCompare(b.studentId);
        case "id-desc":
          return b.studentId.localeCompare(a.studentId);
        case "completion-asc":
          return (
            a.completedTasks / a.totalTasks - b.completedTasks / b.totalTasks
          );
        case "completion-desc":
          return (
            b.completedTasks / b.totalTasks - a.completedTasks / a.totalTasks
          );
        case "grade-asc":
          return a.averageGrade - b.averageGrade;
        case "grade-desc":
          return b.averageGrade - a.averageGrade;
        default:
          return 0;
      }
    }
  );

  const sortedTeachers = [...performanceData.teacherPerformance].sort(
    (a, b) => {
      switch (teacherSortBy) {
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
        case "department-asc":
          return (a.department || "").localeCompare(b.department || "");
        case "department-desc":
          return (b.department || "").localeCompare(a.department || "");
        case "students-asc":
          return a.totalStudents - b.totalStudents;
        case "students-desc":
          return b.totalStudents - a.totalStudents;
        case "subjects-asc":
          return a.totalSubjects - b.totalSubjects;
        case "subjects-desc":
          return b.totalSubjects - a.totalSubjects;
        case "speed-asc":
          return a.gradingSpeed - b.gradingSpeed;
        case "speed-desc":
          return b.gradingSpeed - a.gradingSpeed;
        default:
          return 0;
      }
    }
  );

  // Cargar los datos según el rango de tiempo seleccionado
  const handleRefreshData = () => {
    setIsLoading(true);
    // Simulación de carga de datos
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="container py-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Reportes y Estadísticas</h1>
          <p className="text-muted-foreground">
            Visualiza el desempeño y las métricas del sistema
          </p>
        </div>

        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Rango de tiempo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todo el tiempo</SelectItem>
              <SelectItem value="month">Último mes</SelectItem>
              <SelectItem value="semester">Semestre actual</SelectItem>
              <SelectItem value="year">Último año</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={handleRefreshData}>
            <RefreshCw className="mr-2 size-4" />
            Actualizar
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Download className="mr-2 size-4" />
                Exportar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Opciones de exportación</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <FileText className="mr-2 size-4" />
                Exportar a Excel
              </DropdownMenuItem>
              <DropdownMenuItem>
                <FileText className="mr-2 size-4" />
                Exportar a PDF
              </DropdownMenuItem>
              <DropdownMenuItem>
                <FileText className="mr-2 size-4" />
                Exportar a CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Tabs value={currentTab} onValueChange={setCurrentTab}>
        <TabsList className="mb-8">
          <TabsTrigger value="overview" className="min-w-32">
            <BarChart className="size-4 mr-2" />
            Resumen General
          </TabsTrigger>
          <TabsTrigger value="performance" className="min-w-32">
            <PieChart className="size-4 mr-2" />
            Rendimiento
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          {isLoading ? (
            <div className="flex justify-center py-20">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="size-8 animate-spin text-primary" />
                <p>Cargando datos estadísticos...</p>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatsCard
                  title="Usuarios Totales"
                  value={statsData.users.total}
                  icon={<Users className="size-5 text-blue-500" />}
                  change="+12% este mes"
                />
                <StatsCard
                  title="Materias Activas"
                  value={statsData.subjects.active}
                  subvalue={`de ${statsData.subjects.total} materias`}
                  icon={<BookOpen className="size-5 text-green-500" />}
                />
                <StatsCard
                  title="Tareas Asignadas"
                  value={statsData.activities.totalHomeworks}
                  icon={<FileText className="size-5 text-amber-500" />}
                />
                <StatsCard
                  title="Entregas Pendientes"
                  value={statsData.submissions.pending}
                  icon={<Calendar className="size-5 text-rose-500" />}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card className="col-span-1">
                  <CardHeader>
                    <CardTitle>Distribución de Usuarios</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="bg-blue-500/10 rounded-lg p-4">
                        <GraduationCap className="size-8 text-blue-500 mx-auto mb-2" />
                        <p className="text-2xl font-bold">
                          {statsData.users.students}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Estudiantes
                        </p>
                      </div>

                      <div className="bg-green-500/10 rounded-lg p-4">
                        <School className="size-8 text-green-500 mx-auto mb-2" />
                        <p className="text-2xl font-bold">
                          {statsData.users.teachers}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Profesores
                        </p>
                      </div>

                      <div className="bg-amber-500/10 rounded-lg p-4">
                        <Shield className="size-8 text-amber-500 mx-auto mb-2" />
                        <p className="text-2xl font-bold">
                          {statsData.users.admins}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Administradores
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="col-span-1">
                  <CardHeader>
                    <CardTitle>Materias por Estado</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="bg-green-500/10 rounded-lg p-4">
                        <Calendar className="size-8 text-green-500 mx-auto mb-2" />
                        <p className="text-2xl font-bold">
                          {statsData.subjects.active}
                        </p>
                        <p className="text-sm text-muted-foreground">Activas</p>
                      </div>

                      <div className="bg-blue-500/10 rounded-lg p-4">
                        <Calendar className="size-8 text-blue-500 mx-auto mb-2" />
                        <p className="text-2xl font-bold">
                          {statsData.subjects.upcoming}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Próximas
                        </p>
                      </div>

                      <div className="bg-muted/40 rounded-lg p-4">
                        <Calendar className="size-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-2xl font-bold">
                          {statsData.subjects.completed}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Finalizadas
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="col-span-1">
                  <CardHeader>
                    <CardTitle>Actividad de Tareas</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-5">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm">Tasa de entregas</span>
                          <span className="font-medium">
                            {statsData.activities.completionRate}%
                          </span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500 rounded-full"
                            style={{
                              width: `${statsData.activities.completionRate}%`,
                            }}
                          ></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm">Tasa de calificación</span>
                          <span className="font-medium">
                            {statsData.activities.gradedRate}%
                          </span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{
                              width: `${statsData.activities.gradedRate}%`,
                            }}
                          ></div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="text-center bg-rose-500/10 rounded-lg p-3">
                            <p className="text-xl font-bold">
                              {statsData.submissions.pending}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Pendientes
                            </p>
                          </div>
                        </div>
                        <div className="w-8"></div>
                        <div className="flex-1">
                          <div className="text-center bg-green-500/10 rounded-lg p-3">
                            <p className="text-xl font-bold">
                              {statsData.submissions.graded}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Calificadas
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Actividad Reciente</CardTitle>
                  <CardDescription>
                    Últimas actividades en la plataforma
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-10">
                    <BarChart3 className="size-10 text-muted-foreground mx-auto mb-3" />
                    <h3 className="text-lg font-medium mb-1">
                      Datos de actividad reciente en desarrollo
                    </h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      Esta sección se encuentra actualmente en desarrollo y
                      estará disponible próximamente.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="performance">
          {isLoading ? (
            <div className="flex justify-center py-20">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="size-8 animate-spin text-primary" />
                <p>Cargando datos de rendimiento...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              <Card>
                <CardHeader className="flex-row justify-between">
                  <div>
                    <CardTitle>Rendimiento por Materia</CardTitle>
                    <CardDescription>
                      Estadísticas de rendimiento por materia
                    </CardDescription>
                  </div>
                  <div>
                    <Select
                      value={subjectSortBy}
                      onValueChange={setSubjectSortBy}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Ordenar por" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="name-asc">Nombre (A-Z)</SelectItem>
                        <SelectItem value="name-desc">Nombre (Z-A)</SelectItem>
                        <SelectItem value="students-asc">
                          Estudiantes (Menor)
                        </SelectItem>
                        <SelectItem value="students-desc">
                          Estudiantes (Mayor)
                        </SelectItem>
                        <SelectItem value="grade-asc">
                          Calificación (Menor)
                        </SelectItem>
                        <SelectItem value="grade-desc">
                          Calificación (Mayor)
                        </SelectItem>
                        <SelectItem value="submission-asc">
                          Entregas (Menor)
                        </SelectItem>
                        <SelectItem value="submission-desc">
                          Entregas (Mayor)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-96">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-[200px]">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-1 -ml-3 font-medium"
                              onClick={() =>
                                setSubjectSortBy(
                                  subjectSortBy === "name-asc"
                                    ? "name-desc"
                                    : "name-asc"
                                )
                              }
                            >
                              Nombre
                              <ArrowUpDown className="size-4" />
                            </Button>
                          </TableHead>
                          <TableHead>Código</TableHead>
                          <TableHead>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-1 -ml-3 font-medium"
                              onClick={() =>
                                setSubjectSortBy(
                                  subjectSortBy === "students-asc"
                                    ? "students-desc"
                                    : "students-asc"
                                )
                              }
                            >
                              Estudiantes
                              <ArrowUpDown className="size-4" />
                            </Button>
                          </TableHead>
                          <TableHead>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-1 -ml-3 font-medium"
                              onClick={() =>
                                setSubjectSortBy(
                                  subjectSortBy === "grade-asc"
                                    ? "grade-desc"
                                    : "grade-asc"
                                )
                              }
                            >
                              Calificación Promedio
                              <ArrowUpDown className="size-4" />
                            </Button>
                          </TableHead>
                          <TableHead>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-1 -ml-3 font-medium"
                              onClick={() =>
                                setSubjectSortBy(
                                  subjectSortBy === "submission-asc"
                                    ? "submission-desc"
                                    : "submission-asc"
                                )
                              }
                            >
                              Tasa de Entregas
                              <ArrowUpDown className="size-4" />
                            </Button>
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sortedSubjects.map((subject) => (
                          <TableRow key={subject.id}>
                            <TableCell className="font-medium">
                              {subject.name}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{subject.code}</Badge>
                            </TableCell>
                            <TableCell>{subject.totalStudents}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span
                                  className={`font-medium ${
                                    subject.averageGrade >= 80
                                      ? "text-green-500"
                                      : subject.averageGrade >= 70
                                      ? "text-amber-500"
                                      : "text-rose-500"
                                  }`}
                                >
                                  {subject.averageGrade.toFixed(1)}
                                </span>
                                <div className="h-2 w-24 bg-muted rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${
                                      subject.averageGrade >= 80
                                        ? "bg-green-500"
                                        : subject.averageGrade >= 70
                                        ? "bg-amber-500"
                                        : "bg-rose-500"
                                    }`}
                                    style={{
                                      width: `${subject.averageGrade}%`,
                                    }}
                                  ></div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">
                                  {subject.submissionRate}%
                                </span>
                                <div className="h-2 w-24 bg-muted rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-blue-500 rounded-full"
                                    style={{
                                      width: `${subject.submissionRate}%`,
                                    }}
                                  ></div>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex-row justify-between">
                  <div>
                    <CardTitle>Rendimiento de Estudiantes</CardTitle>
                    <CardDescription>
                      Estudiantes con mejor desempeño
                    </CardDescription>
                  </div>
                  <div>
                    <Select
                      value={studentSortBy}
                      onValueChange={setStudentSortBy}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Ordenar por" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="name-asc">Nombre (A-Z)</SelectItem>
                        <SelectItem value="name-desc">Nombre (Z-A)</SelectItem>
                        <SelectItem value="id-asc">ID (Asc)</SelectItem>
                        <SelectItem value="id-desc">ID (Desc)</SelectItem>
                        <SelectItem value="completion-asc">
                          Completado (Menor)
                        </SelectItem>
                        <SelectItem value="completion-desc">
                          Completado (Mayor)
                        </SelectItem>
                        <SelectItem value="grade-asc">
                          Calificación (Menor)
                        </SelectItem>
                        <SelectItem value="grade-desc">
                          Calificación (Mayor)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-96">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-[200px]">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-1 -ml-3 font-medium"
                              onClick={() =>
                                setStudentSortBy(
                                  studentSortBy === "name-asc"
                                    ? "name-desc"
                                    : "name-asc"
                                )
                              }
                            >
                              Nombre
                              <ArrowUpDown className="size-4" />
                            </Button>
                          </TableHead>
                          <TableHead>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-1 -ml-3 font-medium"
                              onClick={() =>
                                setStudentSortBy(
                                  studentSortBy === "id-asc"
                                    ? "id-desc"
                                    : "id-asc"
                                )
                              }
                            >
                              ID
                              <ArrowUpDown className="size-4" />
                            </Button>
                          </TableHead>
                          <TableHead>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-1 -ml-3 font-medium"
                              onClick={() =>
                                setStudentSortBy(
                                  studentSortBy === "completion-asc"
                                    ? "completion-desc"
                                    : "completion-asc"
                                )
                              }
                            >
                              Tareas Completadas
                              <ArrowUpDown className="size-4" />
                            </Button>
                          </TableHead>
                          <TableHead>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-1 -ml-3 font-medium"
                              onClick={() =>
                                setStudentSortBy(
                                  studentSortBy === "grade-asc"
                                    ? "grade-desc"
                                    : "grade-asc"
                                )
                              }
                            >
                              Calificación Promedio
                              <ArrowUpDown className="size-4" />
                            </Button>
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sortedStudents.map((student) => (
                          <TableRow key={student.id}>
                            <TableCell className="font-medium">
                              {student.name}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {student.studentId}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span>
                                  {student.completedTasks} de{" "}
                                  {student.totalTasks}
                                </span>
                                <div className="h-2 w-24 bg-muted rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-green-500 rounded-full"
                                    style={{
                                      width: `${
                                        (student.completedTasks /
                                          student.totalTasks) *
                                        100
                                      }%`,
                                    }}
                                  ></div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span
                                  className={`font-medium ${
                                    student.averageGrade >= 85
                                      ? "text-green-500"
                                      : student.averageGrade >= 70
                                      ? "text-amber-500"
                                      : "text-rose-500"
                                  }`}
                                >
                                  {student.averageGrade.toFixed(1)}
                                </span>
                                <div className="h-2 w-24 bg-muted rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${
                                      student.averageGrade >= 85
                                        ? "bg-green-500"
                                        : student.averageGrade >= 70
                                        ? "bg-amber-500"
                                        : "bg-rose-500"
                                    }`}
                                    style={{
                                      width: `${student.averageGrade}%`,
                                    }}
                                  ></div>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex-row justify-between">
                  <div>
                    <CardTitle>Actividad de Profesores</CardTitle>
                    <CardDescription>
                      Estadísticas de actividad por profesor
                    </CardDescription>
                  </div>
                  <div>
                    <Select
                      value={teacherSortBy}
                      onValueChange={setTeacherSortBy}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Ordenar por" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="name-asc">Nombre (A-Z)</SelectItem>
                        <SelectItem value="name-desc">Nombre (Z-A)</SelectItem>
                        <SelectItem value="department-asc">
                          Departamento (A-Z)
                        </SelectItem>
                        <SelectItem value="department-desc">
                          Departamento (Z-A)
                        </SelectItem>
                        <SelectItem value="students-asc">
                          Estudiantes (Menor)
                        </SelectItem>
                        <SelectItem value="students-desc">
                          Estudiantes (Mayor)
                        </SelectItem>
                        <SelectItem value="subjects-asc">
                          Materias (Menor)
                        </SelectItem>
                        <SelectItem value="subjects-desc">
                          Materias (Mayor)
                        </SelectItem>
                        <SelectItem value="speed-asc">
                          Vel. Calificación (Rápido)
                        </SelectItem>
                        <SelectItem value="speed-desc">
                          Vel. Calificación (Lento)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-96">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-[200px]">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-1 -ml-3 font-medium"
                              onClick={() =>
                                setTeacherSortBy(
                                  teacherSortBy === "name-asc"
                                    ? "name-desc"
                                    : "name-asc"
                                )
                              }
                            >
                              Nombre
                              <ArrowUpDown className="size-4" />
                            </Button>
                          </TableHead>
                          <TableHead>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-1 -ml-3 font-medium"
                              onClick={() =>
                                setTeacherSortBy(
                                  teacherSortBy === "department-asc"
                                    ? "department-desc"
                                    : "department-asc"
                                )
                              }
                            >
                              Departamento
                              <ArrowUpDown className="size-4" />
                            </Button>
                          </TableHead>
                          <TableHead>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-1 -ml-3 font-medium"
                              onClick={() =>
                                setTeacherSortBy(
                                  teacherSortBy === "subjects-asc"
                                    ? "subjects-desc"
                                    : "subjects-asc"
                                )
                              }
                            >
                              Materias
                              <ArrowUpDown className="size-4" />
                            </Button>
                          </TableHead>
                          <TableHead>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-1 -ml-3 font-medium"
                              onClick={() =>
                                setTeacherSortBy(
                                  teacherSortBy === "students-asc"
                                    ? "students-desc"
                                    : "students-asc"
                                )
                              }
                            >
                              Estudiantes
                              <ArrowUpDown className="size-4" />
                            </Button>
                          </TableHead>
                          <TableHead>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-1 -ml-3 font-medium"
                              onClick={() =>
                                setTeacherSortBy(
                                  teacherSortBy === "speed-asc"
                                    ? "speed-desc"
                                    : "speed-asc"
                                )
                              }
                            >
                              Vel. Calificación (días)
                              <ArrowUpDown className="size-4" />
                            </Button>
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sortedTeachers.map((teacher) => (
                          <TableRow key={teacher.id}>
                            <TableCell className="font-medium">
                              {teacher.name}
                            </TableCell>
                            <TableCell>
                              {teacher.department || "Sin departamento"}
                            </TableCell>
                            <TableCell>{teacher.totalSubjects}</TableCell>
                            <TableCell>{teacher.totalStudents}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span
                                  className={`font-medium ${
                                    teacher.gradingSpeed <= 2
                                      ? "text-green-500"
                                      : teacher.gradingSpeed <= 4
                                      ? "text-amber-500"
                                      : "text-rose-500"
                                  }`}
                                >
                                  {teacher.gradingSpeed.toFixed(1)}
                                </span>
                                <Badge
                                  variant={
                                    teacher.gradingSpeed <= 2
                                      ? "default"
                                      : teacher.gradingSpeed <= 4
                                      ? "secondary"
                                      : "outline"
                                  }
                                >
                                  {teacher.gradingSpeed <= 2
                                    ? "Rápido"
                                    : teacher.gradingSpeed <= 4
                                    ? "Normal"
                                    : "Lento"}
                                </Badge>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Componente de tarjeta estadística
function StatsCard({
  title,
  value,
  subvalue,
  icon,
  change,
}: {
  title: string;
  value: number;
  subvalue?: string;
  icon: React.ReactNode;
  change?: string;
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
          <span className="text-2xl font-bold">{value.toLocaleString()}</span>
          {subvalue && (
            <span className="text-xs text-muted-foreground ml-1">
              {subvalue}
            </span>
          )}
        </div>
        {change && (
          <div className="flex items-center mt-1">
            <span className="text-xs text-green-500">{change}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
