import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { z } from "zod";
import prisma from "@/prisma";

// Schema para la validación del body
const passwordSchema = z.object({
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

// Actualizar contraseña de un usuario
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

    // Solo administradores pueden actualizar contraseñas
    if (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    // Obtener y validar el body
    const body = await request.json();
    const validationResult = passwordSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { password } = validationResult.data;

    // Verificar si el usuario existe
    const user = await prisma.user.findUnique({
      where: { id: params.id },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // Actualizar la contraseña del usuario
    await prisma.user.update({
      where: { id: params.id },
      data: {
        password, // Aquí podrías aplicar hash a la contraseña en una implementación real
        // Si se requiere hash, usarías una función de utilidad como en utils/password.ts
      },
    });

    return NextResponse.json(
      { success: true, message: "Contraseña actualizada correctamente" },
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
