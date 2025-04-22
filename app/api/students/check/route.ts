// app/api/students/check/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma";

export async function GET(request: NextRequest) {
  try {
    const studentId = request.nextUrl.searchParams.get("id");

    if (!studentId) {
      return NextResponse.json(
        { error: "ID de estudiante requerido" },
        { status: 400 }
      );
    }

    // Find the student by ID
    const student = await prisma.student.findUnique({
      where: { studentId },
    });

    if (!student) {
      return NextResponse.json(
        { exists: false, message: "Estudiante no encontrado" },
        { status: 200 }
      );
    }

    // Return student data with activation status
    return NextResponse.json(
      {
        exists: true,
        activated: student.isActivated,
        message: student.isActivated ? "Cuenta activada" : "Cuenta no activada",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error checking student:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
