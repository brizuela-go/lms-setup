// app/api/debug/auth/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma";

export async function GET(request: NextRequest) {
  // Only allow in development environment
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { error: "Debug endpoints are only available in development mode" },
      { status: 403 }
    );
  }

  try {
    // Get database status
    const usersCount = await prisma.user.count();
    const studentsCount = await prisma.student.count();

    // Get sample data for debugging (limited for security)
    const sampleUsers = await prisma.user.findMany({
      take: 3,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        // Don't include password
      },
    });

    const sampleStudents = await prisma.student.findMany({
      take: 3,
      select: {
        id: true,
        studentId: true,
        isActivated: true,
        userId: true,
      },
    });

    return NextResponse.json({
      message: "Debug information for authentication",
      dbStatus: {
        usersCount,
        studentsCount,
      },
      sampleData: {
        users: sampleUsers,
        students: sampleStudents,
      },
      nextAuthConfig: {
        enabledProviders: [
          "credentials-email",
          "credentials-student",
          "student-activation",
        ],
        sessionStrategy: "jwt",
        debug: process.env.NEXTAUTH_DEBUG === "true",
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        nextAuthUrl: process.env.NEXTAUTH_URL,
      },
    });
  } catch (error) {
    console.error("Error in debug API:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
