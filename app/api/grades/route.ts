import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

// Schema para la creación de calificaciones
const createGradeSchema = z.object({
  submissionId: z.string().uuid("ID de entrega inválido"),
  teacherId: z.string().uuid("ID de profesor inválido"),
  studentId: z.string().uuid("ID de estudiante inválido"),
  score: z
    .number()
    .min(0, "La calificación no puede ser negativa")
    .max(100, "La calificación no puede ser mayor a 100"),
  feedback: z.string().nullable(),
});

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Solo profesores pueden calificar tareas
    if (session.user.role !== "TEACHER" && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    // Obtener y validar los datos de la solicitud
    const body = await request.json();
    const validationResult = createGradeSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { submissionId, teacherId, studentId, score, feedback } =
      validationResult.data;

    // Verificar que el profesor existe
    const teacher = await prisma.teacher.findUnique({
      where: { id: teacherId },
    });

    if (!teacher) {
      return NextResponse.json(
        { error: "Profesor no encontrado" },
        { status: 404 }
      );
    }

    // Verificar que el usuario es el profesor o un admin
    if (session.user.role === "TEACHER" && teacher.userId !== session.user.id) {
      return NextResponse.json(
        { error: "No estás autorizado para calificar como este profesor" },
        { status: 403 }
      );
    }

    // Verificar que la entrega existe
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        homework: {
          include: {
            subject: true,
          },
        },
        grade: true,
      },
    });

    if (!submission) {
      return NextResponse.json(
        { error: "Entrega no encontrada" },
        { status: 404 }
      );
    }

    // Verificar que la materia pertenece al profesor
    if (submission.homework.subject.teacherId !== teacherId) {
      return NextResponse.json(
        {
          error:
            "La entrega no pertenece a una materia impartida por este profesor",
        },
        { status: 403 }
      );
    }

    // Verificar que el estudiante corresponde a la entrega
    if (submission.studentId !== studentId) {
      return NextResponse.json(
        { error: "La entrega no pertenece a este estudiante" },
        { status: 400 }
      );
    }

    let grade;

    // Si ya existe una calificación, actualizar
    if (submission.grade) {
      grade = await prisma.grade.update({
        where: { id: submission.grade.id },
        data: {
          score,
          feedback,
          gradedAt: new Date(),
        },
      });
    } else {
      // Si no existe, crear una nueva
      grade = await prisma.grade.create({
        data: {
          submissionId,
          teacherId,
          studentId,
          score,
          feedback,
        },
      });

      // Crear notificación para el estudiante
      const student = await prisma.student.findUnique({
        where: { id: studentId },
        include: {
          user: true,
        },
      });

      if (student) {
        await prisma.notification.create({
          data: {
            title: "Tarea calificada",
            message: `Tu tarea "${submission.homework.title}" ha sido calificada con ${score} puntos.`,
            userId: student.userId,
          },
        });
      }
    }

    return NextResponse.json({ success: true, grade }, { status: 200 });
  } catch (error) {
    console.error("Error al calificar tarea:", error);
    return NextResponse.json(
      { error: "Error al calificar tarea" },
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
    const submissionId = searchParams.get("submissionId");
    const homeworkId = searchParams.get("homeworkId");
    const subjectId = searchParams.get("subjectId");

    // Construir consulta base
    let where: any = {};

    if (submissionId) {
      where.submissionId = submissionId;
    } else if (studentId) {
      where.studentId = studentId;
    }

    // Filtros adicionales por tarea o materia
    if (homeworkId) {
      where.submission = {
        homeworkId,
      };
    } else if (subjectId) {
      where.submission = {
        homework: {
          subjectId,
        },
      };
    }

    // Restringir acceso según el rol
    if (session.user.role === "STUDENT") {
      // Un estudiante solo puede ver sus propias calificaciones
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
    } else if (session.user.role === "TEACHER") {
      // Un profesor solo puede ver calificaciones que ha asignado
      const teacher = await prisma.teacher.findFirst({
        where: { userId: session.user.id },
      });

      if (!teacher) {
        return NextResponse.json(
          { error: "Profesor no encontrado" },
          { status: 404 }
        );
      }

      where.teacherId = teacher.id;
    }
    // Admin puede ver todas

    // Obtener calificaciones
    const grades = await prisma.grade.findMany({
      where,
      include: {
        submission: {
          include: {
            homework: {
              include: {
                subject: true,
              },
            },
          },
        },
        student: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        teacher: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        gradedAt: "desc",
      },
    });

    return NextResponse.json({ grades }, { status: 200 });
  } catch (error) {
    console.error("Error al obtener calificaciones:", error);
    return NextResponse.json(
      { error: "Error al obtener calificaciones" },
      { status: 500 }
    );
  }
}
