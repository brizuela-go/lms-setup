// app/api/enrollments/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

// Schema para la creación de inscripciones
const createEnrollmentSchema = z.object({
  studentId: z.string().uuid("ID de estudiante inválido"),
  subjectId: z.string().uuid("ID de materia inválido"),
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]).default("PENDING"),
});

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Obtener y validar los datos de la solicitud
    const body = await request.json();
    const validationResult = createEnrollmentSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { studentId, subjectId, status } = validationResult.data;

    // Verificar si el estudiante existe
    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      return NextResponse.json(
        { error: "Estudiante no encontrado" },
        { status: 404 }
      );
    }

    // Verificar si la materia existe
    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
      include: {
        teacher: true,
      },
    });

    if (!subject) {
      return NextResponse.json(
        { error: "Materia no encontrada" },
        { status: 404 }
      );
    }

    // Verificar permisos según el rol
    if (session.user.role === "STUDENT") {
      // Verificar que el estudiante es el mismo que intenta inscribirse
      if (student.userId !== session.user.id) {
        return NextResponse.json(
          { error: "No puedes inscribir a otro estudiante" },
          { status: 403 }
        );
      }

      // Para estudiantes, siempre se crea como PENDING
      body.status = "PENDING";
    } else if (session.user.role === "TEACHER") {
      // Verificar que el profesor es el dueño de la materia
      const teacher = await prisma.teacher.findFirst({
        where: { userId: session.user.id },
      });

      if (!teacher || teacher.id !== subject.teacherId) {
        return NextResponse.json(
          {
            error:
              "No tienes permiso para inscribir estudiantes en esta materia",
          },
          { status: 403 }
        );
      }

      // El profesor puede aprobar directamente
    }
    // Admin puede hacer lo que quiera

    // Verificar si ya existe una inscripción
    const existingEnrollment = await prisma.enrollment.findFirst({
      where: {
        studentId,
        subjectId,
      },
    });

    if (existingEnrollment) {
      return NextResponse.json(
        {
          error:
            "El estudiante ya está inscrito o tiene una solicitud pendiente para esta materia",
        },
        { status: 400 }
      );
    }

    // Crear la inscripción
    const enrollment = await prisma.enrollment.create({
      data: {
        studentId,
        subjectId,
        status,
      },
    });

    // Si es un estudiante creando la solicitud, notificar al profesor
    if (session.user.role === "STUDENT") {
      await prisma.notification.create({
        data: {
          title: "Nueva solicitud de inscripción",
          message: `El estudiante ${student.studentId} ha solicitado unirse a tu materia "${subject.name}".`,
          userId: subject.teacher.userId,
        },
      });
    }

    // Si un profesor o admin inscribe directamente a un estudiante, notificar al estudiante
    if (session.user.role !== "STUDENT" && status === "APPROVED") {
      const studentUser = await prisma.user.findUnique({
        where: { id: student.userId },
      });

      if (studentUser) {
        await prisma.notification.create({
          data: {
            title: "Inscripción a materia",
            message: `Has sido inscrito en la materia "${subject.name}".`,
            userId: studentUser.id,
          },
        });
      }
    }

    return NextResponse.json({ success: true, enrollment }, { status: 201 });
  } catch (error) {
    console.error("Error al crear inscripción:", error);
    return NextResponse.json(
      { error: "Error al procesar la solicitud" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const studentId = searchParams.get("studentId");
    const subjectId = searchParams.get("subjectId");
    const status = searchParams.get("status");

    // Construir condiciones de búsqueda
    const where: any = {};

    if (studentId) {
      where.studentId = studentId;
    }

    if (subjectId) {
      where.subjectId = subjectId;
    }

    if (status && ["PENDING", "APPROVED", "REJECTED"].includes(status)) {
      where.status = status;
    }

    // Para estudiantes, solo mostrar sus propias inscripciones
    if (session.user.role === "STUDENT") {
      const student = await prisma.student.findFirst({
        where: { userId: session.user.id },
      });

      if (!student) {
        return NextResponse.json(
          { error: "Estudiante no encontrado" },
          { status: 404 }
        );
      }

      where.studentId = student.id;
    }

    // Para profesores, solo mostrar inscripciones a sus materias
    if (session.user.role === "TEACHER") {
      const teacher = await prisma.teacher.findFirst({
        where: { userId: session.user.id },
      });

      if (!teacher) {
        return NextResponse.json(
          { error: "Profesor no encontrado" },
          { status: 404 }
        );
      }

      where.subject = {
        teacherId: teacher.id,
      };
    }

    // Obtener inscripciones con filtros aplicados
    const enrollments = await prisma.enrollment.findMany({
      where,
      include: {
        student: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
        subject: {
          include: {
            teacher: {
              include: {
                user: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        enrolledAt: "desc",
      },
    });

    return NextResponse.json({ enrollments }, { status: 200 });
  } catch (error) {
    console.error("Error al obtener inscripciones:", error);
    return NextResponse.json(
      { error: "Error al procesar la solicitud" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const enrollmentId = searchParams.get("id");

    if (!enrollmentId) {
      return NextResponse.json(
        { error: "ID de inscripción no proporcionado" },
        { status: 400 }
      );
    }

    // Obtener la inscripción
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        subject: {
          include: {
            teacher: true,
          },
        },
        student: true,
      },
    });

    if (!enrollment) {
      return NextResponse.json(
        { error: "Inscripción no encontrada" },
        { status: 404 }
      );
    }

    // Verificar permisos
    if (session.user.role === "STUDENT") {
      // Verificar que el estudiante es el dueño de la inscripción
      const student = await prisma.student.findFirst({
        where: { userId: session.user.id },
      });

      if (!student || student.id !== enrollment.studentId) {
        return NextResponse.json(
          { error: "No tienes permiso para eliminar esta inscripción" },
          { status: 403 }
        );
      }

      // Estudiantes solo pueden eliminar inscripciones pendientes
      if (enrollment.status !== "PENDING") {
        return NextResponse.json(
          { error: "Solo puedes cancelar solicitudes pendientes" },
          { status: 400 }
        );
      }
    } else if (session.user.role === "TEACHER") {
      // Verificar que el profesor es el dueño de la materia
      const teacher = await prisma.teacher.findFirst({
        where: { userId: session.user.id },
      });

      if (!teacher || teacher.id !== enrollment.subject.teacherId) {
        return NextResponse.json(
          { error: "No tienes permiso para eliminar esta inscripción" },
          { status: 403 }
        );
      }
    }
    // Admin puede hacer lo que quiera

    // Eliminar la inscripción
    await prisma.enrollment.delete({
      where: { id: enrollmentId },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error al eliminar inscripción:", error);
    return NextResponse.json(
      { error: "Error al procesar la solicitud" },
      { status: 500 }
    );
  }
}
