// Le Paradise HRMS - Service Worker for Push Notifications

self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Service Worker activated and claiming clients');
  event.waitUntil(clients.claim());
});

self.addEventListener('push', (event) => {
  console.log('[SW] Push event received:', event);

  let data = {
    title: 'Le Paradise HRMS',
    body: 'New notification',
    url: '/dashboard',
  };

  if (event.data) {
    try {
      data = event.data.json();
      console.log('[SW] Parsed push payload:', data);
    } catch (err) {
      console.log('[SW] Non-JSON payload received:', event.data.text());
      data.body = event.data.text();
    }
  }

  const title = data.title || 'Le Paradise HRMS';
  const options = {
    body: data.body || '',
    data: { url: data.url || '/dashboard' },
    tag: data.tag || 'hrms-notification',
  };

  event.waitUntil(
    self.registration
      .showNotification(title, options)
      .then(() => console.log('[SW] showNotification succeeded'))
      .catch((err) => console.error('[SW] showNotification error:', err))
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/dashboard';

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        for (const client of windowClients) {
          if ('focus' in client) {
            client.focus();
            if ('navigate' in client) {
              client.navigate(targetUrl);
            }
            return;
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      })
  );
});

