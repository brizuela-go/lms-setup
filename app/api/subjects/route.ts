import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { z } from "zod";
import prisma from "@/prisma";

// Schema para la creación de materias
const createSubjectSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  code: z.string().min(1, "El código es obligatorio"),
  description: z.string().nullable(),
  teacherId: z.string().min(1, "El ID del profesor es obligatorio"),
  startDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Fecha de inicio inválida",
  }),
  endDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Fecha de finalización inválida",
  }),
});

// Schema para la actualización de materias
const updateSubjectSchema = z.object({
  id: z.string().min(1, "El ID de la materia es obligatorio"),
  name: z.string().min(1, "El nombre es obligatorio").optional(),
  code: z.string().min(1, "El código es obligatorio").optional(),
  description: z.string().nullable().optional(),
  teacherId: z.string().min(1, "El ID del profesor es obligatorio").optional(),
  startDate: z
    .string()
    .refine((date) => !isNaN(Date.parse(date)), {
      message: "Fecha de inicio inválida",
    })
    .optional(),
  endDate: z
    .string()
    .refine((date) => !isNaN(Date.parse(date)), {
      message: "Fecha de finalización inválida",
    })
    .optional(),
});

// Crear una nueva materia
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Solo administradores pueden crear materias
    if (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    // Obtener y validar los datos de la solicitud
    const body = await request.json();
    const validationResult = createSubjectSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { name, code, description, teacherId, startDate, endDate } =
      validationResult.data;

    // Verificar si el código ya está en uso
    const existingSubjectCode = await prisma.subject.findUnique({
      where: { code },
    });

    if (existingSubjectCode) {
      return NextResponse.json(
        { error: "El código de materia ya está en uso" },
        { status: 400 }
      );
    }

    // Verificar si el profesor existe
    const teacher = await prisma.teacher.findUnique({
      where: { id: teacherId },
    });

    if (!teacher) {
      return NextResponse.json(
        { error: "Profesor no encontrado" },
        { status: 404 }
      );
    }

    // Crear la materia
    const subject = await prisma.subject.create({
      data: {
        name,
        code,
        description,
        teacherId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      },
    });

    return NextResponse.json({ success: true, subject }, { status: 201 });
  } catch (error) {
    console.error("Error al crear materia:", error);
    return NextResponse.json(
      { error: "Error al crear materia" },
      { status: 500 }
    );
  }
}

// Obtener todas las materias o una materia específica
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const subjectId = searchParams.get("id");

    // Si se proporciona un ID, obtener una materia específica
    if (subjectId) {
      const subject = await prisma.subject.findUnique({
        where: { id: subjectId },
        include: {
          teacher: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true,
                },
              },
            },
          },
          enrollments: {
            include: {
              student: {
                include: {
                  user: true,
                },
              },
            },
          },
          homeworks: {
            include: {
              submissions: {
                include: {
                  student: {
                    include: {
                      user: true,
                    },
                  },
                  grade: true,
                },
              },
            },
          },
        },
      });

      if (!subject) {
        return NextResponse.json(
          { error: "Materia no encontrada" },
          { status: 404 }
        );
      }

      return NextResponse.json({ subject }, { status: 200 });
    }

    // Si no se proporciona un ID, obtener todas las materias según el rol del usuario
    let subjectsQuery: any = {
      include: {
        teacher: {
          include: {
            user: true,
          },
        },
        enrollments: {
          include: {
            student: true,
          },
        },
        homeworks: true,
      },
    };

    // Los estudiantes solo pueden ver las materias en las que están inscritos
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

      const enrollments = await prisma.enrollment.findMany({
        where: {
          studentId: student.id,
          status: "APPROVED",
        },
        select: {
          subject: {
            include: {
              teacher: {
                include: {
                  user: true,
                },
              },
              enrollments: {
                include: {
                  student: true,
                },
              },
              homeworks: true,
            },
          },
        },
      });

      const subjects = enrollments.map((enrollment) => enrollment.subject);
      return NextResponse.json({ subjects }, { status: 200 });
    }

    // Los profesores solo pueden ver las materias que imparten
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

      subjectsQuery.where = {
        teacherId: teacher.id,
      };
    }

    // Obtener materias según la consulta
    const subjects = await prisma.subject.findMany(subjectsQuery);

    return NextResponse.json({ subjects }, { status: 200 });
  } catch (error) {
    console.error("Error al obtener materias:", error);
    return NextResponse.json(
      { error: "Error al obtener materias" },
      { status: 500 }
    );
  }
}

// Actualizar una materia existente
export async function PUT(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Solo administradores pueden actualizar materias
    if (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    // Obtener y validar los datos de la solicitud
    const body = await request.json();
    const validationResult = updateSubjectSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { id, name, code, description, teacherId, startDate, endDate } =
      validationResult.data;

    // Verificar si la materia existe
    const existingSubject = await prisma.subject.findUnique({
      where: { id },
    });

    if (!existingSubject) {
      return NextResponse.json(
        { error: "Materia no encontrada" },
        { status: 404 }
      );
    }

    // Verificar si el código ya está en uso por otra materia
    if (code && code !== existingSubject.code) {
      const subjectWithCode = await prisma.subject.findUnique({
        where: { code },
      });

      if (subjectWithCode && subjectWithCode.id !== id) {
        return NextResponse.json(
          { error: "El código de materia ya está en uso" },
          { status: 400 }
        );
      }
    }

    // Verificar si el profesor existe
    if (teacherId) {
      const teacher = await prisma.teacher.findUnique({
        where: { id: teacherId },
      });

      if (!teacher) {
        return NextResponse.json(
          { error: "Profesor no encontrado" },
          { status: 404 }
        );
      }
    }

    // Preparar los datos para la actualización
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (code !== undefined) updateData.code = code;
    if (description !== undefined) updateData.description = description;
    if (teacherId !== undefined) updateData.teacherId = teacherId;
    if (startDate !== undefined) updateData.startDate = new Date(startDate);
    if (endDate !== undefined) updateData.endDate = new Date(endDate);

    // Actualizar la materia
    const updatedSubject = await prisma.subject.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(
      { success: true, subject: updatedSubject },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error al actualizar materia:", error);
    return NextResponse.json(
      { error: "Error al actualizar materia" },
      { status: 500 }
    );
  }
}

// Eliminar una materia
export async function DELETE(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Solo super administradores pueden eliminar materias
    if (session.user.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const subjectId = searchParams.get("id");

    if (!subjectId) {
      return NextResponse.json(
        { error: "Se requiere el ID de la materia" },
        { status: 400 }
      );
    }

    // Verificar si la materia existe
    const existingSubject = await prisma.subject.findUnique({
      where: { id: subjectId },
    });

    if (!existingSubject) {
      return NextResponse.json(
        { error: "Materia no encontrada" },
        { status: 404 }
      );
    }

    // Eliminar la materia y todos sus datos relacionados en una transacción
    await prisma.$transaction(async (tx) => {
      // Eliminar las calificaciones relacionadas con las tareas de la materia
      const homeworks = await tx.homework.findMany({
        where: { subjectId },
        select: { id: true },
      });

      const homeworkIds = homeworks.map((hw) => hw.id);

      // Eliminar las calificaciones
      await tx.grade.deleteMany({
        where: {
          submission: {
            homeworkId: {
              in: homeworkIds,
            },
          },
        },
      });

      // Eliminar las respuestas de las preguntas
      await tx.answer.deleteMany({
        where: {
          question: {
            homeworkId: {
              in: homeworkIds,
            },
          },
        },
      });

      // Eliminar las entregas
      await tx.submission.deleteMany({
        where: {
          homeworkId: {
            in: homeworkIds,
          },
        },
      });

      // Eliminar las preguntas
      await tx.question.deleteMany({
        where: {
          homeworkId: {
            in: homeworkIds,
          },
        },
      });

      // Eliminar las tareas
      await tx.homework.deleteMany({
        where: { subjectId },
      });

      // Eliminar las inscripciones
      await tx.enrollment.deleteMany({
        where: { subjectId },
      });

      // Eliminar la materia
      await tx.subject.delete({
        where: { id: subjectId },
      });
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error al eliminar materia:", error);
    return NextResponse.json(
      { error: "Error al eliminar materia" },
      { status: 500 }
    );
  }
}
