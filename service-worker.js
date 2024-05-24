const CACHE_NAME = 'chat-cache-v1';
const urlsToCache = [
    '/chat/',
    '/chat/index.html',
    '/chat/styles.css',
    '/chat/app.js',
    '/chat/manifest.json',
    '/chat/icons/delete-icon.png',  
    '/chat/icons/download-icon.png',  
    '/chat/logo.jpg',
    '/chat/log.ico',
    '/chat/clip-icon.png',
    '/chat/send-icon.png',
    '/chat/app.png',
    '/chat/images/icons/icon-72x72.png',
    '/chat/images/icons/icon-96x96.png',
    '/chat/images/icons/icon-128x128.png',
    '/chat/images/icons/icon-144x144.png',
    '/chat/images/icons/icon-152x152.png',
    '/chat/images/icons/icon-192x192.png',
    '/chat/images/icons/icon-384x384.png',
    '/chat/images/icons/icon-512x512.png',
    '/chat/images/icons/maskable_icon_x192.png',
    '/chat/images/icons/maskable_icon_x512.png'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                return Promise.all(
                    urlsToCache.map(url => {
                        return fetch(url, { cache: "no-store" })
                            .then(response => {
                                if (!response.ok) {
                                    throw new TypeError('Bad response status');
                                }
                                return cache.put(url, response);
                            })
                            .catch(error => {
                                console.error('Failed to cache:', url, error);
                            });
                    })
                );
            })
            .catch(error => {
                console.error('Failed to open cache:', error);
            })
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    return response;
                }
                return fetch(event.request).catch(error => {
                    console.error('Fetch failed:', event.request.url, error);
                    throw error;
                });
            })
    );
});

self.addEventListener('push', event => {
    const data = event.data.json();
    self.registration.showNotification(data.title, {
        body: data.body,
        icon: '/chat/images/icons/icon-192x192.png',
        data: { messageId: data.messageId }
    });
});

self.addEventListener('notificationclick', function(event) {
    const messageId = event.notification.data.messageId;
    event.notification.close();  

   
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
            if (clientList.length > 0) {
                let client = clientList[0];
                for (let i = 0; i < clientList.length; i++) {
                    if (clientList[i].focused) {
                        client = clientList[i];
                    }
                }
                return client.focus();
            }
            return clients.openWindow('/chat/').then(function(windowClient) {
            
                windowClient.postMessage({ action: 'focusMessage', messageId: messageId });
            });
        })
    );
});
