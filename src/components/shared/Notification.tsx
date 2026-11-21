"use client";

import React from "react";
import { CheckCircle, AlertCircle, Info, X } from "lucide-react";
import { useNotification } from "@/components/shared/NotificationContext";
import { NotificationType } from "@/lib/types";

const iconMap: Record<NotificationType, React.ReactNode> = {
  success: <CheckCircle className="w-6 h-6 text-green-600" />,
  error: <AlertCircle className="w-6 h-6 text-red-500" />,
  info: <Info className="w-6 h-6 text-primary" />,
};

const bgMap: Record<NotificationType, string> = {
  success: "bg-mint",
  error: "bg-coral/30",
  info: "bg-lavender",
};

export default function NotificationContainer() {
  const { notifications, removeNotification } = useNotification();

  if (notifications.length === 0) return null;

  return (
    <div className="notification-stack">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className="notification-item"
          role={notification.type === "error" ? "alert" : "status"}
        >
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
              bgMap[notification.type]
            }`}
          >
            {iconMap[notification.type]}
          </div>
          <p className="text-text-primary font-medium flex-1">
            {notification.message}
          </p>
          <button
            onClick={() => removeNotification(notification.id)}
            className="rounded-lg hover:bg-sage"
            aria-label="Dismiss notification"
          >
            <X className="w-4 h-4 text-text-secondary" />
          </button>
        </div>
      ))}
    </div>
  );
}
