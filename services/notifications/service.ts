// services/notification-service.ts
import { toast } from "sonner";

export interface Notification {
  id: string;
  title: string;
  message: string;
  category: string;
  isRead: boolean;
  createdAt: string;
}

export const notificationService = {
  async getNotifications(): Promise<Notification[]> {
    try {
      const response = await fetch("/api/notifications");
      if (!response.ok) {
        throw new Error("Failed to fetch notifications");
      }
      const data = await response.json();
      return data.notifications;
    } catch (error) {
      console.error("Error fetching notifications:", error);
      toast.error("Failed to load notifications");
      return [];
    }
  },

  async markAsRead(id: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/notifications/${id}/read`, {
        method: "PUT",
      });
      if (!response.ok) {
        throw new Error("Failed to mark notification as read");
      }
      return true;
    } catch (error) {
      console.error("Error marking notification as read:", error);
      toast.error("Failed to update notification");
      return false;
    }
  },

  async markAllAsRead(): Promise<boolean> {
    try {
      const response = await fetch("/api/notifications/readAll", {
        method: "PUT",
      });
      if (!response.ok) {
        throw new Error("Failed to mark all notifications as read");
      }
      return true;
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      toast.error("Failed to update notifications");
      return false;
    }
  },

  async deleteNotification(id: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete notification");
      }
      return true;
    } catch (error) {
      console.error("Error deleting notification:", error);
      toast.error("Failed to delete notification");
      return false;
    }
  },
};
