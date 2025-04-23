import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { z } from "zod";
import prisma from "@/prisma";

// Schema para la creación de profesores
const createTeacherSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  email: z.string().email("Correo electrónico inválido"),
  department: z.string().nullable().optional(),
  bio: z.string().nullable().optional(),
  password: z.string().optional(),
});

// Schema para la actualización de profesores
const updateTeacherSchema = z.object({
  id: z.string().min(1, "El ID del profesor es obligatorio"),
  name: z.string().min(1, "El nombre es obligatorio").optional(),
  email: z.string().email("Correo electrónico inválido").optional(),
  department: z.string().nullable().optional(),
  bio: z.string().nullable().optional(),
});

// Crear un nuevo profesor
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Solo administradores pueden crear profesores
    if (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    // Obtener y validar los datos de la solicitud
    const body = await request.json();
    const validationResult = createTeacherSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { name, email, department, bio, password } = validationResult.data;

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

    // Crear el usuario y el profesor en una transacción
    const result = await prisma.$transaction(async (tx) => {
      // Crear el usuario
      const user = await tx.user.create({
        data: {
          name,
          email,
          password: password || Math.random().toString(36).slice(-8), // Generar contraseña aleatoria si no se proporciona
          role: "TEACHER",
        },
      });

      // Crear el profesor
      const teacher = await tx.teacher.create({
        data: {
          userId: user.id,
          department,
          bio,
        },
      });

      return { user, teacher };
    });

    return NextResponse.json(
      { success: true, user: result.user, teacher: result.teacher },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error al crear profesor:", error);
    return NextResponse.json(
      { error: "Error al crear profesor" },
      { status: 500 }
    );
  }
}

// Obtener todos los profesores o un profesor específico
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const teacherId = searchParams.get("id");

    // Si se proporciona un ID, obtener un profesor específico
    if (teacherId) {
      const teacher = await prisma.teacher.findUnique({
        where: { id: teacherId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              image: true,
              createdAt: true,
            },
          },
          subjects: {
            include: {
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
                      grade: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!teacher) {
        return NextResponse.json(
          { error: "Profesor no encontrado" },
          { status: 404 }
        );
      }

      return NextResponse.json({ teacher }, { status: 200 });
    }

    // Si no se proporciona un ID, obtener todos los profesores
    // Verificar permisos para el listado
    if (session.user.role === "STUDENT") {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    let teachers;

    // Si es profesor, solo puede ver su propio perfil
    if (session.user.role === "TEACHER") {
      teachers = await prisma.teacher.findMany({
        where: { userId: session.user.id },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              image: true,
              createdAt: true,
            },
          },
          subjects: {
            include: {
              enrollments: true,
            },
          },
        },
      });
    } else {
      // Para admin, obtener todos los profesores
      teachers = await prisma.teacher.findMany({
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              image: true,
              createdAt: true,
            },
          },
          subjects: {
            include: {
              enrollments: true,
            },
          },
        },
        orderBy: {
          user: {
            name: "asc",
          },
        },
      });
    }

    return NextResponse.json({ teachers }, { status: 200 });
  } catch (error) {
    console.error("Error al obtener profesores:", error);
    return NextResponse.json(
      { error: "Error al obtener profesores" },
      { status: 500 }
    );
  }
}

// Actualizar un profesor existente
export async function PUT(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Solo administradores pueden actualizar profesores
    if (
      session.user.role !== "ADMIN" &&
      session.user.role !== "SUPERADMIN" &&
      session.user.role !== "TEACHER"
    ) {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    // Obtener y validar los datos de la solicitud
    const body = await request.json();
    const validationResult = updateTeacherSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { id, name, email, department, bio } = validationResult.data;

    // Verificar si el profesor existe
    const existingTeacher = await prisma.teacher.findUnique({
      where: { id },
      include: {
        user: true,
      },
    });

    if (!existingTeacher) {
      return NextResponse.json(
        { error: "Profesor no encontrado" },
        { status: 404 }
      );
    }

    // Si no es admin o superadmin, verificar que sea el propio profesor
    if (
      session.user.role === "TEACHER" &&
      existingTeacher.userId !== session.user.id
    ) {
      return NextResponse.json(
        { error: "Solo puedes actualizar tu propio perfil" },
        { status: 403 }
      );
    }

    // Verificar si el email ya está en uso por otro usuario
    if (email && email !== existingTeacher.user.email) {
      const existingUserEmail = await prisma.user.findUnique({
        where: { email },
      });

      if (
        existingUserEmail &&
        existingUserEmail.id !== existingTeacher.userId
      ) {
        return NextResponse.json(
          { error: "El correo electrónico ya está en uso" },
          { status: 400 }
        );
      }
    }

    // Actualizar el profesor y el usuario en una transacción
    const result = await prisma.$transaction(async (tx) => {
      // Actualizar el usuario
      const user = await tx.user.update({
        where: { id: existingTeacher.userId },
        data: {
          name: name !== undefined ? name : existingTeacher.user.name,
          email: email !== undefined ? email : existingTeacher.user.email,
        },
      });

      // Actualizar el profesor
      const teacher = await tx.teacher.update({
        where: { id },
        data: {
          department:
            department !== undefined ? department : existingTeacher.department,
          bio: bio !== undefined ? bio : existingTeacher.bio,
        },
      });

      return { user, teacher };
    });

    return NextResponse.json(
      { success: true, user: result.user, teacher: result.teacher },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error al actualizar profesor:", error);
    return NextResponse.json(
      { error: "Error al actualizar profesor" },
      { status: 500 }
    );
  }
}

// Eliminar un profesor
export async function DELETE(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Solo super administradores pueden eliminar profesores
    if (session.user.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const teacherId = searchParams.get("id");

    if (!teacherId) {
      return NextResponse.json(
        { error: "Se requiere el ID del profesor" },
        { status: 400 }
      );
    }

    // Verificar si el profesor existe
    const existingTeacher = await prisma.teacher.findUnique({
      where: { id: teacherId },
      include: {
        subjects: true,
      },
    });

    if (!existingTeacher) {
      return NextResponse.json(
        { error: "Profesor no encontrado" },
        { status: 404 }
      );
    }

    // Verificar si el profesor tiene materias asignadas
    if (existingTeacher.subjects.length > 0) {
      return NextResponse.json(
        {
          error: "No se puede eliminar un profesor con materias asignadas",
          subjectsCount: existingTeacher.subjects.length,
        },
        { status: 400 }
      );
    }

    // Eliminar el profesor y el usuario en una transacción
    await prisma.$transaction(async (tx) => {
      // Eliminar el profesor
      await tx.teacher.delete({
        where: { id: teacherId },
      });

      // Eliminar el usuario
      await tx.user.delete({
        where: { id: existingTeacher.userId },
      });
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error al eliminar profesor:", error);
    return NextResponse.json(
      { error: "Error al eliminar profesor" },
      { status: 500 }
    );
  }
}
