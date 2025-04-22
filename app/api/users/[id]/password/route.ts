// app/api/users/[id]/password/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { verifyPassword, saltAndHashPassword } from "@/utils/password";

const prisma = new PrismaClient();

const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1, "La contraseña actual es obligatoria"),
  newPassword: z
    .string()
    .min(6, "La nueva contraseña debe tener al menos 6 caracteres"),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticación
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userId = params.id;

    // Verificar que el usuario está actualizando su propia contraseña o es un admin
    if (
      session.user.id !== userId &&
      session.user.role !== "ADMIN" &&
      session.user.role !== "SUPERADMIN"
    ) {
      return NextResponse.json(
        { error: "No tienes permiso para cambiar esta contraseña" },
        { status: 403 }
      );
    }

    // Obtener y validar los datos de la solicitud
    const body = await request.json();
    const validationResult = updatePasswordSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { currentPassword, newPassword } = validationResult.data;

    // Obtener usuario
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // Verificar la contraseña actual
    // Primero verificamos si el usuario tiene salt/hash (seguridad moderna)
    if (user.salt && user.hash) {
      const isPasswordValid = verifyPassword(
        currentPassword,
        user.salt,
        user.hash
      );

      if (!isPasswordValid) {
        return NextResponse.json(
          { error: "La contraseña actual es incorrecta" },
          { status: 400 }
        );
      }

      // Generar nuevo salt y hash
      const { salt, hash } = saltAndHashPassword(newPassword);

      // Actualizar contraseña
      await prisma.user.update({
        where: { id: userId },
        data: {
          salt,
          hash,
        },
      });
    } else {
      // Verificar contraseña directa (menos seguro, compatible con versiones antiguas)
      if (user.password !== currentPassword) {
        return NextResponse.json(
          { error: "La contraseña actual es incorrecta" },
          { status: 400 }
        );
      }

      // Generar nuevo salt y hash para migrar al método más seguro
      const { salt, hash } = saltAndHashPassword(newPassword);

      // Actualizar contraseña
      await prisma.user.update({
        where: { id: userId },
        data: {
          password: null, // Eliminar contraseña directa
          salt,
          hash,
        },
      });
    }

    return NextResponse.json(
      { message: "Contraseña actualizada correctamente" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error al actualizar contraseña:", error);
    return NextResponse.json(
      { error: "Error al actualizar contraseña" },
      { status: 500 }
    );
  }
}
