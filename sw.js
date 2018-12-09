'use strict';

const cacheName = 'review-site-v2.1';

const urlsCached = [
  '.',
  'index.html',
  'img/1.jpg',
  'img/2.jpg',
  'img/3.jpg',
  'img/4.jpg',
  'img/5.jpg',
  'img/6.jpg',
  'img/7.jpg',
  'img/8.jpg',
  'img/9.jpg',
  'img/10.jpg',
  'img/icons/192.png',
  'img/icons/512.png',
  'css/styles.css',
  'css/responsive.css',
  'js/idb.js',
  'js/dbhelper.js',
  'js/main.js',
  'js/restaurant_info.js'
];

self.addEventListener('install', function(event) {
  console.log('Install service worker');
  event.waitUntil(
    caches.open(cacheName).then(function(cache) {
      return cache.addAll(urlsCached);
    })
  );
});

self.addEventListener('fetch', function(event) {
  let requestUrl = new URL(event.request.url);
  if (requestUrl.origin === location.origin) {
    if (requestUrl.pathname.startsWith('/restaurant.html')) {
      event.respondWith(loadRestaurantPage(event.request));
      return;
    }
    if (event.request.method !== 'GET') return;
    event.respondWith(
      caches
        .match(event.request)
        .then(function(response) {
          if (response) {
            return response;
          }
          return fetch(event.request).then(function(response) {
            if (response.status === 404) {
              return caches.match('');
            }
            return caches.open(cacheName).then(function(cache) {
              cache.put(event.request.url, response.clone());
              return response;
            });
          });
        })
        .catch(function(error) {
          return caches.match('');
        })
    );
  }
});

self.addEventListener('activate', function(event) {
  console.log('refresh sw');

  let cacheWhitelist = [cacheName];

  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('sync', function(event) {
  if (event.tag == 'reviewSync') {
    event.waitUntil(
      ClientMsg({ message: 'post-offline-reviews-to-server' })
    );
  }
});

function ClientMsg(message) {
  self.clients.matchAll().then(function(clients) {
    clients.forEach(function(client) {
      client.postMessage(message);
    });
  });
}

function loadRestaurantPage(request) {

  const storageUrl = request.url.split('?')[0];

  return caches.open(cacheName).then(function(cache) {
    return cache.match(storageUrl).then(function(response) {
      if (response) return response;

      return fetch(request).then(function(networkResponse) {
        cache.put(storageUrl, networkResponse.clone());
        return networkResponse;
      });
    });
  });
}
