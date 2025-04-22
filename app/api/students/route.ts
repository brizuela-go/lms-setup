import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

// Schema para la creación de estudiantes
const createStudentSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  email: z.string().email("Correo electrónico inválido"),
  studentId: z.string().length(6, "El ID de estudiante debe tener 6 dígitos"),
  password: z.string().optional(),
  isActivated: z.boolean().default(false),
});

// Crear un nuevo estudiante
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Solo administradores pueden crear estudiantes
    if (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    // Obtener y validar los datos de la solicitud
    const body = await request.json();
    const validationResult = createStudentSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { name, email, studentId, password, isActivated } =
      validationResult.data;

    // Verificar si el email ya está en uso
    const existingUserEmail = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUserEmail) {
      return NextResponse.json(
        { error: "El correo electrónico ya está en uso" },
        { status: 400 }
      );
    }

    // Verificar si el ID de estudiante ya está en uso
    const existingStudentId = await prisma.student.findUnique({
      where: { studentId },
    });

    if (existingStudentId) {
      return NextResponse.json(
        { error: "El ID de estudiante ya está en uso" },
        { status: 400 }
      );
    }

    // Crear el usuario y el estudiante en una transacción
    const result = await prisma.$transaction(async (tx) => {
      // Crear el usuario
      const user = await tx.user.create({
        data: {
          name,
          email,
          password: password || "", // Si no se proporciona, se usará una cadena vacía temporalmente
          role: "STUDENT",
        },
      });

      // Crear el estudiante
      const student = await tx.student.create({
        data: {
          userId: user.id,
          studentId,
          isActivated,
        },
      });

      return { user, student };
    });

    return NextResponse.json(
      { success: true, user: result.user, student: result.student },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error al crear estudiante:", error);
    return NextResponse.json(
      { error: "Error al crear estudiante" },
      { status: 500 }
    );
  }
}

// Obtener todos los estudiantes o un estudiante específico
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const studentId = searchParams.get("id");

    // Si se proporciona un ID, obtener un estudiante específico
    if (studentId) {
      // Verificar permisos según el rol
      if (session.user.role === "STUDENT" && session.user.id !== studentId) {
        return NextResponse.json(
          { error: "No tienes permiso para ver este estudiante" },
          { status: 403 }
        );
      }

      const student = await prisma.student.findUnique({
        where: { id: studentId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
          enrollments: {
            include: {
              subject: true,
            },
          },
          submissions: {
            include: {
              homework: {
                include: {
                  subject: true,
                },
              },
              grade: true,
            },
          },
          grades: {
            include: {
              teacher: {
                include: {
                  user: true,
                },
              },
              submission: {
                include: {
                  homework: {
                    include: {
                      subject: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!student) {
        return NextResponse.json(
          { error: "Estudiante no encontrado" },
          { status: 404 }
        );
      }

      return NextResponse.json({ student }, { status: 200 });
    }

    // Si no se proporciona un ID, obtener todos los estudiantes (solo para admin y profesores)
    if (session.user.role === "STUDENT") {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    // Consulta base
    let includeOptions: any = {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    };

    // Para profesores, filtrar por sus materias
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

      // Obtener IDs de materias que imparte el profesor
      const subjects = await prisma.subject.findMany({
        where: { teacherId: teacher.id },
        select: { id: true },
      });

      const subjectIds = subjects.map((s) => s.id);

      // Obtener estudiantes inscritos en las materias del profesor
      const enrollments = await prisma.enrollment.findMany({
        where: {
          subjectId: { in: subjectIds },
          status: "APPROVED",
        },
        include: {
          student: {
            include: includeOptions,
          },
        },
      });

      // Extraer estudiantes únicos
      const studentsMap = new Map();

      enrollments.forEach((enrollment) => {
        studentsMap.set(enrollment.student.id, enrollment.student);
      });

      const students = Array.from(studentsMap.values());

      return NextResponse.json({ students }, { status: 200 });
    }

    // Para administradores, obtener todos los estudiantes
    const students = await prisma.student.findMany({
      include: includeOptions,
      orderBy: {
        user: {
          name: "asc",
        },
      },
    });

    return NextResponse.json({ students }, { status: 200 });
  } catch (error) {
    console.error("Error al obtener estudiantes:", error);
    return NextResponse.json(
      { error: "Error al obtener estudiantes" },
      { status: 500 }
    );
  }
}

// Actualizar un estudiante existente
export async function PUT(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Solo administradores pueden actualizar estudiantes
    if (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    // Obtener y validar los datos de la solicitud
    const body = await request.json();

    if (!body.id) {
      return NextResponse.json(
        { error: "Se requiere el ID del estudiante" },
        { status: 400 }
      );
    }

    // Verificar si el estudiante existe
    const existingStudent = await prisma.student.findUnique({
      where: { id: body.id },
      include: {
        user: true,
      },
    });

    if (!existingStudent) {
      return NextResponse.json(
        { error: "Estudiante no encontrado" },
        { status: 404 }
      );
    }

    // Actualizar el estudiante y el usuario en una transacción
    const result = await prisma.$transaction(async (tx) => {
      // Actualizar el usuario
      const user = await tx.user.update({
        where: { id: existingStudent.userId },
        data: {
          name: body.name || existingStudent.user.name,
          email: body.email || existingStudent.user.email,
          ...(body.password ? { password: body.password } : {}),
        },
      });

      // Actualizar el estudiante
      const student = await tx.student.update({
        where: { id: body.id },
        data: {
          ...(body.studentId ? { studentId: body.studentId } : {}),
          ...(body.isActivated !== undefined
            ? { isActivated: body.isActivated }
            : {}),
        },
      });

      return { user, student };
    });

    return NextResponse.json(
      { success: true, user: result.user, student: result.student },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error al actualizar estudiante:", error);
    return NextResponse.json(
      { error: "Error al actualizar estudiante" },
      { status: 500 }
    );
  }
}

// Eliminar un estudiante
export async function DELETE(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Solo super administradores pueden eliminar estudiantes
    if (session.user.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const studentId = searchParams.get("id");

    if (!studentId) {
      return NextResponse.json(
        { error: "Se requiere el ID del estudiante" },
        { status: 400 }
      );
    }

    // Verificar si el estudiante existe
    const existingStudent = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!existingStudent) {
      return NextResponse.json(
        { error: "Estudiante no encontrado" },
        { status: 404 }
      );
    }

    // Eliminar el estudiante y el usuario en una transacción
    await prisma.$transaction(async (tx) => {
      // Eliminar todas las inscripciones
      await tx.enrollment.deleteMany({
        where: { studentId },
      });

      // Eliminar todas las calificaciones
      await tx.grade.deleteMany({
        where: { studentId },
      });

      // Eliminar todas las entregas
      await tx.submission.deleteMany({
        where: { studentId },
      });

      // Eliminar el estudiante
      await tx.student.delete({
        where: { id: studentId },
      });

      // Eliminar el usuario
      await tx.user.delete({
        where: { id: existingStudent.userId },
      });
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error al eliminar estudiante:", error);
    return NextResponse.json(
      { error: "Error al eliminar estudiante" },
      { status: 500 }
    );
  }
}
