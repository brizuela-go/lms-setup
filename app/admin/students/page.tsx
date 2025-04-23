import { auth } from "@/auth";
import { redirect } from "next/navigation";
import StudentsClient from "@/components/students/admin";
import prisma from "@/prisma";

// Obtener todos los estudiantes
async function getStudents() {
  try {
    const students = await prisma.student.findMany({
      include: {
        user: true,
        enrollments: {
          include: {
            subject: true,
          },
        },
      },
      orderBy: {
        user: {
          name: "asc",
        },
      },
    });

    return students;
  } catch (error) {
    console.error("Error al obtener estudiantes:", error);
    return [];
  }
}

export default async function AdminStudentsPage() {
  const session = await auth();

  if (
    !session ||
    (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")
  ) {
    redirect("/login");
  }

  const students = await getStudents();

  return <StudentsClient initialStudents={students as any} />;
}
