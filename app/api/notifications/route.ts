import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET: Fetch all notifications for the current user
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Get user's notifications
    const notifications = await prisma.notification.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ notifications }, { status: 200 });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: "Error al obtener notificaciones" },
      { status: 500 }
    );
  }
}

// POST: Create a new notification
export async function POST(request: NextRequest) {
  try {
    // Check authentication - only admins and teachers can create notifications
    const session = await auth();

    if (
      !session ||
      (session.user.role !== "ADMIN" &&
        session.user.role !== "SUPERADMIN" &&
        session.user.role !== "TEACHER")
    ) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Get and validate request body
    const body = await request.json();

    if (!body.title || !body.message || !body.userId) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      );
    }

    // Create notification
    const notification = await prisma.notification.create({
      data: {
        title: body.title,
        message: body.message,
        userId: body.userId,
        isRead: false,
      },
    });

    return NextResponse.json({ notification }, { status: 201 });
  } catch (error) {
    console.error("Error creating notification:", error);
    return NextResponse.json(
      { error: "Error al crear notificación" },
      { status: 500 }
    );
  }
}
