import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { PrismaClient } from "@prisma/client";
import { CreateHomeworkForm } from "@/components/homeworks/create-homework-form";

const prisma = new PrismaClient();

// Obtener asignaturas del profesor
async function getTeacherSubjects(userId: string) {
  try {
    // Obtener profesor
    const teacher = await prisma.teacher.findFirst({
      where: { userId },
    });

    if (!teacher) {
      return { subjects: [], teacherId: null };
    }

    // Obtener asignaturas del profesor
    const subjects = await prisma.subject.findMany({
      where: { teacherId: teacher.id },
      orderBy: { name: "asc" },
    });

    return { subjects, teacherId: teacher.id };
  } catch (error) {
    console.error("Error al obtener asignaturas:", error);
    return { subjects: [], teacherId: null };
  }
}

export default async function CreateHomeworkPage() {
  const session = await auth();

  if (!session || session.user.role !== "TEACHER") {
    redirect("/login");
  }

  const { subjects, teacherId } = await getTeacherSubjects(session.user.id);

  if (!teacherId) {
    redirect("/dashboard");
  }

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-2">Crear Nueva Tarea</h1>
      <p className="text-muted-foreground mb-8">
        Define los detalles y las preguntas para la nueva tarea
      </p>

      <CreateHomeworkForm subjects={subjects} teacherId={teacherId} />
    </div>
  );
}
