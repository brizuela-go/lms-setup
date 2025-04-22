import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// PUT: Mark all notifications as read for the current user
export async function PUT(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Update all unread notifications for the current user
    const result = await prisma.notification.updateMany({
      where: {
        userId: session.user.id,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        count: result.count,
        message: `${result.count} notificaciones marcadas como leídas`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    return NextResponse.json(
      { error: "Error al marcar todas las notificaciones como leídas" },
      { status: 500 }
    );
  }
}
