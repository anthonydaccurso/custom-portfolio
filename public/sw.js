// Disable caching in service worker
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    }).catch(error => {
      console.error('Fetch error:', error);
      return new Response('Network error', { status: 503 });
    })
  );
});

self.addEventListener('push', (event) => {
  const options = {
    body: event.data.text(),
    icon: '/apple-touch-icon.png',
    badge: '/favicon-32x32.png'
  };

  event.waitUntil(
    self.registration.showNotification('Daccurso Digital Marketing', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('https://anthonydaccurso.com')
  );
});