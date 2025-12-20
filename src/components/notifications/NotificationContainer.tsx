'use client';

import { useNotification } from './NotificationContext';
import NotificationToast from './NotificationToast';

export default function NotificationContainer() {
  const { notifications, removeNotification } = useNotification();

  return (
    <div
      className="fixed top-4 right-4 z-50 pointer-events-none"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="flex flex-col items-end pointer-events-auto">
        {notifications.map((notification) => (
          <NotificationToast
            key={notification.id}
            notification={notification}
            onRemove={removeNotification}
          />
        ))}
      </div>
    </div>
  );
}
