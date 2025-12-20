'use client';

import { useEffect } from 'react';
import { X, CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';
import type { Notification, NotificationType } from './NotificationContext';

interface NotificationToastProps {
  notification: Notification;
  onRemove: (id: string) => void;
}

export default function NotificationToast({
  notification,
  onRemove,
}: NotificationToastProps) {
  useEffect(() => {
    if (notification.duration && notification.duration > 0) {
      const timer = setTimeout(() => {
        onRemove(notification.id);
      }, notification.duration);

      return () => clearTimeout(timer);
    }
  }, [notification, onRemove]);

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5" />;
      case 'error':
        return <XCircle className="w-5 h-5" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5" />;
      case 'info':
        return <Info className="w-5 h-5" />;
      default:
        return <Info className="w-5 h-5" />;
    }
  };

  const getStyles = (type: NotificationType) => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          icon: 'text-green-600',
          title: 'text-green-900',
          message: 'text-green-700',
          button: 'text-green-500 hover:text-green-700',
        };
      case 'error':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          icon: 'text-red-600',
          title: 'text-red-900',
          message: 'text-red-700',
          button: 'text-red-500 hover:text-red-700',
        };
      case 'warning':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          icon: 'text-yellow-600',
          title: 'text-yellow-900',
          message: 'text-yellow-700',
          button: 'text-yellow-500 hover:text-yellow-700',
        };
      case 'info':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          icon: 'text-blue-600',
          title: 'text-blue-900',
          message: 'text-blue-700',
          button: 'text-blue-500 hover:text-blue-700',
        };
      default:
        return {
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          icon: 'text-gray-600',
          title: 'text-gray-900',
          message: 'text-gray-700',
          button: 'text-gray-500 hover:text-gray-700',
        };
    }
  };

  const styles = getStyles(notification.type);

  return (
    <div
      className={`${styles.bg} ${styles.border} border rounded-lg shadow-lg p-4 mb-3 max-w-md w-full animate-slide-in-right`}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <div className={`${styles.icon} flex-shrink-0 mt-0.5`}>
          {getIcon(notification.type)}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold ${styles.title}`}>
            {notification.title}
          </p>
          {notification.message && (
            <p className={`text-sm mt-1 ${styles.message}`}>
              {notification.message}
            </p>
          )}
        </div>
        <button
          onClick={() => onRemove(notification.id)}
          className={`${styles.button} flex-shrink-0 transition-colors`}
          aria-label="Cerrar notificación"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
