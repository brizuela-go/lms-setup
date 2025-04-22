import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

// Schema de validación para los envíos
const submissionSchema = z.object({
  studentId: z.string().uuid(),
  homeworkId: z.string().uuid(),
  answers: z.array(
    z.object({
      questionId: z.string().uuid(),
      answerText: z.string().nullable(),
      answerOption: z.string().nullable(),
    })
  ),
  fileUrl: z.string().nullable(),
});

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Solo estudiantes pueden enviar tareas
    if (session.user.role !== "STUDENT") {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    // Obtener y validar los datos de la solicitud
    const body = await request.json();
    const validationResult = submissionSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Datos de envío inválidos",
          details: validationResult.error.format(),
        },
        { status: 400 }
      );
    }

    const { studentId, homeworkId, answers, fileUrl } = validationResult.data;

    // Verificar que el usuario sea el estudiante correspondiente
    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student || student.userId !== session.user.id) {
      return NextResponse.json(
        { error: "No autorizado para enviar en nombre de este estudiante" },
        { status: 403 }
      );
    }

    // Verificar que la tarea exista y no haya vencido
    const homework = await prisma.homework.findUnique({
      where: { id: homeworkId },
    });

    if (!homework) {
      return NextResponse.json(
        { error: "Tarea no encontrada" },
        { status: 404 }
      );
    }

    // Verificar si la fecha de entrega ha pasado
    if (new Date(homework.dueDate) < new Date()) {
      return NextResponse.json(
        { error: "La fecha límite de entrega ha pasado" },
        { status: 400 }
      );
    }

    // Verificar si el estudiante ya ha enviado esta tarea
    const existingSubmission = await prisma.submission.findFirst({
      where: {
        homeworkId,
        studentId,
      },
    });

    if (existingSubmission) {
      return NextResponse.json(
        { error: "Ya has enviado esta tarea anteriormente" },
        { status: 400 }
      );
    }

    // Verificar que todas las preguntas existan
    const questions = await prisma.question.findMany({
      where: {
        id: {
          in: answers.map((a) => a.questionId),
        },
        homeworkId,
      },
    });

    if (questions.length !== answers.length) {
      return NextResponse.json(
        { error: "Algunas preguntas no pertenecen a esta tarea" },
        { status: 400 }
      );
    }

    // Crear la entrega en la base de datos
    const submission = await prisma.submission.create({
      data: {
        studentId,
        homeworkId,
        status: "SUBMITTED",
        fileUrl,
        answers: {
          create: answers.map((answer) => ({
            questionId: answer.questionId,
            answerText: answer.answerText,
            answerOption: answer.answerOption,
          })),
        },
      },
      include: {
        answers: true,
      },
    });

    // Generar una notificación para el estudiante
    await prisma.notification.create({
      data: {
        title: "Tarea enviada",
        message: `Has enviado correctamente la tarea "${homework.title}".`,
        userId: session.user.id,
      },
    });

    return NextResponse.json(
      { success: true, data: submission },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error al procesar el envío:", error);
    return NextResponse.json(
      { error: "Error al procesar el envío" },
      { status: 500 }
    );
  }
}

// Obtener todas las entregas de un estudiante específico
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const studentId = searchParams.get("studentId");
    const homeworkId = searchParams.get("homeworkId");

    // Verificar permisos y construir consulta
    let where: any = {};

    if (session.user.role === "STUDENT") {
      // Un estudiante solo puede ver sus propias entregas
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
      // Un profesor puede ver entregas de tareas que ha creado
      const teacher = await prisma.teacher.findFirst({
        where: { userId: session.user.id },
      });

      if (!teacher) {
        return NextResponse.json(
          { error: "Profesor no encontrado" },
          { status: 404 }
        );
      }

      if (homeworkId) {
        // Verificar que la tarea pertenece a este profesor
        const homework = await prisma.homework.findFirst({
          where: {
            id: homeworkId,
            teacherId: teacher.id,
          },
        });

        if (!homework) {
          return NextResponse.json(
            { error: "Tarea no encontrada o no autorizada" },
            { status: 404 }
          );
        }

        where.homeworkId = homeworkId;
      } else {
        // Mostrar solo entregas de tareas del profesor
        where.homework = {
          teacherId: teacher.id,
        };
      }

      // Si se especifica un estudiante, filtrar por él
      if (studentId) {
        where.studentId = studentId;
      }
    } else if (
      session.user.role === "ADMIN" ||
      session.user.role === "SUPERADMIN"
    ) {
      // Administradores pueden ver todas las entregas
      if (studentId) {
        where.studentId = studentId;
      }

      if (homeworkId) {
        where.homeworkId = homeworkId;
      }
    }

    // Obtener las entregas con los filtros aplicados
    const submissions = await prisma.submission.findMany({
      where,
      include: {
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
        homework: {
          include: {
            subject: true,
          },
        },
        answers: {
          include: {
            question: true,
          },
        },
        grade: true,
      },
      orderBy: {
        submittedAt: "desc",
      },
    });

    return NextResponse.json({ submissions }, { status: 200 });
  } catch (error) {
    console.error("Error al obtener entregas:", error);
    return NextResponse.json(
      { error: "Error al obtener entregas" },
      { status: 500 }
    );
  }
}
