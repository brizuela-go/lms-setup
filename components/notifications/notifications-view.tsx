"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Bell,
  CheckCircle,
  Trash2,
  Loader2,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationsViewProps {
  initialNotifications: Notification[];
}

export function NotificationsView({
  initialNotifications,
}: NotificationsViewProps) {
  const router = useRouter();
  const [notifications, setNotifications] =
    useState<Notification[]>(initialNotifications);
  const [isLoading, setIsLoading] = useState(false);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Load notifications
  const loadNotifications = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/notifications");
      if (!response.ok) {
        throw new Error("Error al cargar notificaciones");
      }
      const data = await response.json();
      setNotifications(data.notifications);
      toast.success("Notificaciones actualizadas");
    } catch (error) {
      console.error("Error al cargar notificaciones:", error);
      toast.error("No se pudieron cargar las notificaciones");
    } finally {
      setIsLoading(false);
    }
  };

  // Mark as read
  const markAsRead = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}/read`, {
        method: "PUT",
      });

      if (!response.ok) {
        throw new Error("Error al marcar notificación");
      }

      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (error) {
      console.error("Error al marcar notificación:", error);
      toast.error("No se pudo marcar la notificación como leída");
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const response = await fetch("/api/notifications/readAll", {
        method: "PUT",
      });

      if (!response.ok) {
        throw new Error("Error al marcar notificaciones");
      }

      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));

      toast.success("Todas las notificaciones marcadas como leídas");
    } catch (error) {
      console.error("Error al marcar notificaciones:", error);
      toast.error("No se pudieron marcar las notificaciones como leídas");
    }
  };

  // Delete notification
  const deleteNotification = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Error al eliminar notificación");
      }

      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (error) {
      console.error("Error al eliminar notificación:", error);
      toast.error("No se pudo eliminar la notificación");
    }
  };

  return (
    <div className="container py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Bell className="size-6" />
            Notificaciones
            {unreadCount > 0 && (
              <Badge className="ml-2">{unreadCount} nuevas</Badge>
            )}
          </h1>
          <p className="text-muted-foreground">
            Mantente informado sobre actividades importantes
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadNotifications}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="size-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="size-4 mr-2" />
            )}
            Actualizar
          </Button>
          {unreadCount > 0 && (
            <Button size="sm" onClick={markAllAsRead}>
              <CheckCircle className="size-4 mr-2" />
              Marcar todo como leído
            </Button>
          )}
        </div>
      </div>

      {notifications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Bell className="size-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">
              No tienes notificaciones
            </h3>
            <p className="text-muted-foreground max-w-md">
              Cuando recibas notificaciones importantes, aparecerán aquí.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <Card
              key={notification.id}
              className={cn(
                "transition-colors border",
                !notification.isRead && "bg-primary/5 border-primary/20"
              )}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base flex items-center gap-2">
                      {!notification.isRead && (
                        <span className="block w-2 h-2 rounded-full bg-primary" />
                      )}
                      {notification.title}
                    </CardTitle>
                    <CardDescription>
                      {format(
                        new Date(notification.createdAt),
                        "d 'de' MMMM, h:mm a",
                        {
                          locale: es,
                        }
                      )}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-1">
                    {!notification.isRead && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => markAsRead(notification.id)}
                      >
                        <CheckCircle className="size-4 text-primary" />
                        <span className="sr-only">Marcar como leída</span>
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteNotification(notification.id)}
                    >
                      <Trash2 className="size-4 text-muted-foreground hover:text-destructive" />
                      <span className="sr-only">Eliminar</span>
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{notification.message}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
