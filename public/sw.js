// Public service worker para PWA
// Este arquivo fica em /public/sw.js

const CACHE_NAME = "biblioteca-v1";
const urlsToCache = [
  "/",
  "/homecards",
  "/livraria",
  "/logo-biblioteca.svg",
];

// Instalar service worker
self.addEventListener("install", (event) => {
  console.log("Service Worker instalado");
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache).catch(() => {
        // Alguns URLs podem falhar, mas continuamos
        console.warn("Alguns URLs não puderam ser cacheados");
      });
    })
  );
  self.skipWaiting();
});

// Ativar service worker
self.addEventListener("activate", (event) => {
  console.log("Service Worker ativado");
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log("Removendo cache antigo:", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - Estratégia: rede primeiro, depois cache
self.addEventListener("fetch", (event) => {
  // Ignorar requisições de API e outras não-cacheaveis
  if (
    event.request.method !== "GET" ||
    event.request.url.includes("/api/") ||
    event.request.url.includes(".wasm")
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone a resposta
        const clonedResponse = response.clone();

        // Cache a resposta
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, clonedResponse);
        });

        return response;
      })
      .catch(() => {
        // Se fetch falhar, tenta pegar do cache
        return caches.match(event.request);
      })
  );
});

// Lidar com mensagens do cliente
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// Notificações push
self.addEventListener("push", (event) => {
  console.log("Push notification recebida:", event);

  let notificationData = {
    title: "Biblioteca Helena Ramazzotte",
    body: "Você tem uma nova notificação",
    icon: "/logo-biblioteca.svg",
    badge: "/logo-biblioteca.svg",
    tag: "biblioteca-notification",
  };

  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = { ...notificationData, ...data };
    } catch (e) {
      notificationData.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      requireInteraction: true,
      actions: [
        {
          action: "open",
          title: "Abrir",
        },
        {
          action: "close",
          title: "Fechar",
        },
      ],
    })
  );
});

// Clique em notificação
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "close") {
    return;
  }

  const urlToOpen = event.notification.data?.url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Procura se há uma janela aberta
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === urlToOpen && "focus" in client) {
          return client.focus();
        }
      }
      // Se não houver, abre uma nova
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Fechar notificação
self.addEventListener("notificationclose", (event) => {
  console.log("Notificação fechada", event.notification);
});
