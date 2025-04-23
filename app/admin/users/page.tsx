import { auth } from "@/auth";
import { redirect } from "next/navigation";
import prisma from "@/prisma";
import UsersClient from "@/components/users/admin";

// Obtener todos los usuarios
async function getUsers() {
  try {
    const users = await prisma.user.findMany({
      include: {
        student: true,
        teacher: true,
        admin: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return users;
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    return [];
  }
}

export default async function AdminUsersPage() {
  const session = await auth();

  if (
    !session ||
    (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")
  ) {
    redirect("/login");
  }

  const users = await getUsers();

  return <UsersClient initialUsers={users as any} />;
}
