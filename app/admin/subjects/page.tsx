import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { PrismaClient } from "@prisma/client";
import SubjectsClient from "@/components/subjects/admin";

const prisma = new PrismaClient();

// Obtener todas las materias
async function getSubjects() {
  try {
    const subjects = await prisma.subject.findMany({
      include: {
        teacher: {
          include: {
            user: true,
          },
        },
        enrollments: {
          where: {
            status: "APPROVED",
          },
          include: {
            student: true,
          },
        },
        homeworks: true,
      },
      orderBy: {
        startDate: "desc",
      },
    });

    return subjects;
  } catch (error) {
    console.error("Error al obtener materias:", error);
    return [];
  }
}

// Obtener todos los profesores para el formulario de creación
async function getTeachers() {
  try {
    const teachers = await prisma.teacher.findMany({
      include: {
        user: true,
      },
      orderBy: {
        user: {
          name: "asc",
        },
      },
    });

    return teachers;
  } catch (error) {
    console.error("Error al obtener profesores:", error);
    return [];
  }
}

export default async function AdminSubjectsPage() {
  const session = await auth();

  if (
    !session ||
    (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")
  ) {
    redirect("/login");
  }

  const subjects = await getSubjects();
  const teachers = await getTeachers();

  return (
    <SubjectsClient
      initialSubjects={subjects as any}
      teachers={teachers as any}
    />
  );
}
