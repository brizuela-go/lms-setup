import { auth } from "@/auth";
import { redirect } from "next/navigation";
import prisma from "@/prisma";
import TeachersClient from "@/components/teachers/admin";

// Obtener todos los profesores
async function getTeachers() {
  try {
    const teachers = await prisma.teacher.findMany({
      include: {
        user: true,
        subjects: {
          include: {
            enrollments: {
              where: {
                status: "APPROVED",
              },
            },
          },
        },
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

export default async function AdminTeachersPage() {
  const session = await auth();

  if (
    !session ||
    (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")
  ) {
    redirect("/login");
  }

  const teachers = await getTeachers();

  return <TeachersClient initialTeachers={teachers as any} />;
}
