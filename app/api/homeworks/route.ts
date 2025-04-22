import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

// Schema para validar las preguntas
const questionSchema = z.object({
  order: z.number().int().positive(),
  text: z.string().min(1, "El texto de la pregunta es obligatorio"),
  type: z.enum(["MULTIPLE_CHOICE", "TRUE_FALSE", "OPEN_TEXT"]),
  points: z.number().int().positive(),
  options: z
    .array(
      z.object({
        text: z.string().min(1, "El texto de la opción es obligatorio"),
      })
    )
    .nullable(),
  correctAnswer: z.string().nullable(),
});

// Schema para validar la creación de tareas
const homeworkSchema = z.object({
  title: z.string().min(1, "El título es obligatorio"),
  description: z.string().nullable(),
  subjectId: z.string().uuid("ID de materia inválido"),
  teacherId: z.string().uuid("ID de profesor inválido"),
  dueDate: z.string().datetime(),
  allowFileUpload: z.boolean(),
  totalPoints: z.number().int().positive(),
  questions: z.array(questionSchema).min(1, "Debe haber al menos una pregunta"),
});

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Solo profesores y administradores pueden crear tareas
    if (
      session.user.role !== "TEACHER" &&
      session.user.role !== "ADMIN" &&
      session.user.role !== "SUPERADMIN"
    ) {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    // Obtener y validar los datos de la solicitud
    const body = await request.json();
    const validationResult = homeworkSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Datos de tarea inválidos",
          details: validationResult.error.format(),
        },
        { status: 400 }
      );
    }

    const {
      title,
      description,
      subjectId,
      teacherId,
      dueDate,
      allowFileUpload,
      totalPoints,
      questions,
    } = validationResult.data;

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

    // Verificar que el usuario sea el profesor o un administrador
    if (session.user.role === "TEACHER" && teacher.userId !== session.user.id) {
      return NextResponse.json(
        { error: "No autorizado para crear tareas como este profesor" },
        { status: 403 }
      );
    }

    // Verificar que la materia existe
    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
    });

    if (!subject) {
      return NextResponse.json(
        { error: "Materia no encontrada" },
        { status: 404 }
      );
    }

    // Verificar que la materia pertenece al profesor
    if (subject.teacherId !== teacherId) {
      return NextResponse.json(
        { error: "La materia no pertenece a este profesor" },
        { status: 400 }
      );
    }

    // Crear la tarea
    const homework = await prisma.homework.create({
      data: {
        title,
        description,
        subjectId,
        teacherId,
        dueDate,
        allowFileUpload,
        totalPoints,
      },
    });

    // Crear las preguntas
    const createdQuestions = await Promise.all(
      questions.map(async (question) => {
        return prisma.question.create({
          data: {
            homeworkId: homework.id,
            order: question.order,
            text: question.text,
            type: question.type,
            points: question.points,
            options: question.options ? JSON.stringify(question.options) : null,
            correctAnswer: question.correctAnswer,
          },
        });
      })
    );

    // Crear notificaciones para los estudiantes inscritos en la materia
    const enrollments = await prisma.enrollment.findMany({
      where: {
        subjectId,
        status: "APPROVED",
      },
      include: {
        student: {
          include: {
            user: true,
          },
        },
      },
    });

    await Promise.all(
      enrollments.map(async (enrollment) => {
        return prisma.notification.create({
          data: {
            title: "Nueva tarea asignada",
            message: `Se ha asignado una nueva tarea "${title}" en la materia "${subject.name}".`,
            userId: enrollment.student.userId,
          },
        });
      })
    );

    return NextResponse.json(
      {
        success: true,
        homework: {
          ...homework,
          questions: createdQuestions,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error al crear tarea:", error);
    return NextResponse.json(
      { error: "Error al crear tarea" },
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
    const subjectId = searchParams.get("subjectId");
    const homeworkId = searchParams.get("homeworkId");

    // Construir consulta base según el rol
    let query: any = {};

    if (homeworkId) {
      query.id = homeworkId;
    }

    if (subjectId) {
      query.subjectId = subjectId;
    }

    if (session.user.role === "STUDENT") {
      // Los estudiantes solo pueden ver tareas de materias en las que están inscritos
      const student = await prisma.student.findFirst({
        where: { userId: session.user.id },
      });

      if (!student) {
        return NextResponse.json(
          { error: "Estudiante no encontrado" },
          { status: 404 }
        );
      }

      // Obtener IDs de materias en las que está inscrito el estudiante
      const enrollments = await prisma.enrollment.findMany({
        where: {
          studentId: student.id,
          status: "APPROVED",
        },
        select: {
          subjectId: true,
        },
      });

      const subjectIds = enrollments.map((e) => e.subjectId);

      if (subjectId && !subjectIds.includes(subjectId)) {
        return NextResponse.json(
          { error: "No estás inscrito en esta materia" },
          { status: 403 }
        );
      }

      if (subjectIds.length === 0) {
        return NextResponse.json({ homeworks: [] }, { status: 200 });
      }

      query.subjectId = subjectId || { in: subjectIds };
    } else if (session.user.role === "TEACHER") {
      // Los profesores solo pueden ver tareas de materias que imparten
      const teacher = await prisma.teacher.findFirst({
        where: { userId: session.user.id },
      });

      if (!teacher) {
        return NextResponse.json(
          { error: "Profesor no encontrado" },
          { status: 404 }
        );
      }

      query.teacherId = teacher.id;
    }
    // Admin y SuperAdmin pueden ver todas las tareas

    // Obtener las tareas
    const homeworks = await prisma.homework.findMany({
      where: query,
      include: {
        subject: true,
        questions: {
          orderBy: {
            order: "asc",
          },
        },
        submissions: {
          include: {
            student: {
              select: {
                id: true,
                studentId: true,
                user: {
                  select: {
                    name: true,
                    email: true,
                  },
                },
              },
            },
            grade: true,
          },
        },
      },
      orderBy: {
        dueDate: "desc",
      },
    });

    // Para estudiantes, no mostrar las respuestas correctas de tareas pendientes
    if (session.user.role === "STUDENT") {
      homeworks.forEach((homework) => {
        // Si la fecha de entrega no ha pasado y no hay envío, ocultar respuestas correctas
        const hasSubmitted = homework.submissions.some(
          (s) => s.student.userId === session.user.id
        );

        if (!hasSubmitted && new Date(homework.dueDate) > new Date()) {
          homework.questions.forEach((question) => {
            question.correctAnswer = null;
          });
        }
      });
    }

    return NextResponse.json({ homeworks }, { status: 200 });
  } catch (error) {
    console.error("Error al obtener tareas:", error);
    return NextResponse.json(
      { error: "Error al obtener tareas" },
      { status: 500 }
    );
  }
}
