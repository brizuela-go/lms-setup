import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// PUT: Mark a specific notification as read
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const notificationId = params.id;

    // Find the notification
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      return NextResponse.json(
        { error: "Notificación no encontrada" },
        { status: 404 }
      );
    }

    // Verify that the notification belongs to the current user
    if (notification.userId !== session.user.id) {
      return NextResponse.json(
        { error: "No tiene permiso para modificar esta notificación" },
        { status: 403 }
      );
    }

    // Update the notification to mark as read
    const updatedNotification = await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });

    return NextResponse.json(
      { notification: updatedNotification },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return NextResponse.json(
      { error: "Error al marcar notificación como leída" },
      { status: 500 }
    );
  }
}
