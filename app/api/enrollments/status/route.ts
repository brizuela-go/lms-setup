// app/api/enrollments/status/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

// Schema para cambio de estado de inscripción
const updateEnrollmentSchema = z.object({
  enrollmentId: z.string().uuid("ID de inscripción inválido"),
  status: z.enum(["APPROVED", "REJECTED"]),
  reason: z.string().optional(),
});

export async function PUT(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Solo profesores y administradores pueden cambiar estados de inscripción
    if (
      session.user.role !== "TEACHER" &&
      session.user.role !== "ADMIN" &&
      session.user.role !== "SUPERADMIN"
    ) {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    // Obtener y validar los datos de la solicitud
    const body = await request.json();
    const validationResult = updateEnrollmentSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { enrollmentId, status, reason } = validationResult.data;

    // Obtener la inscripción
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        subject: {
          include: {
            teacher: true,
          },
        },
        student: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!enrollment) {
      return NextResponse.json(
        { error: "Inscripción no encontrada" },
        { status: 404 }
      );
    }

    // Verificar permisos: solo el profesor de la materia o un admin puede cambiar el estado
    if (session.user.role === "TEACHER") {
      const teacher = await prisma.teacher.findFirst({
        where: { userId: session.user.id },
      });

      if (!teacher || teacher.id !== enrollment.subject.teacherId) {
        return NextResponse.json(
          { error: "No tienes permiso para modificar esta inscripción" },
          { status: 403 }
        );
      }
    }

    // Actualizar el estado de la inscripción
    const updatedEnrollment = await prisma.enrollment.update({
      where: { id: enrollmentId },
      data: {
        status,
      },
    });

    // Crear notificación para el estudiante
    await prisma.notification.create({
      data: {
        title:
          status === "APPROVED"
            ? "Inscripción Aprobada"
            : "Inscripción Rechazada",
        message:
          status === "APPROVED"
            ? `Tu solicitud de inscripción a la materia "${enrollment.subject.name}" ha sido aprobada.`
            : `Tu solicitud de inscripción a la materia "${
                enrollment.subject.name
              }" ha sido rechazada. ${reason ? `Razón: ${reason}` : ""}`,
        userId: enrollment.student.userId,
      },
    });

    return NextResponse.json(
      {
        success: true,
        enrollment: updatedEnrollment,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error al actualizar inscripción:", error);
    return NextResponse.json(
      { error: "Error al procesar la solicitud" },
      { status: 500 }
    );
  }
}
