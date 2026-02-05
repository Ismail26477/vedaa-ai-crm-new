const CACHE_NAME = "grablead-v1"
const urlsToCache = ["/", "/index.html", "/src/main.tsx"]

// Install event - cache files
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log("[v0] Service Worker: Caching app shell")
      return cache.addAll(urlsToCache).catch(() => {
        // Fail gracefully if offline during install
        console.warn("[v0] Service Worker: Some assets failed to cache")
      })
    })
  )
  self.skipWaiting()
})

// Activate event
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(cacheName => cacheName !== CACHE_NAME)
          .map(cacheName => {
            console.log("[v0] Service Worker: Deleting old cache", cacheName)
            return caches.delete(cacheName)
          })
      )
    })
  )
  self.clients.claim()
})

// Fetch event - cache and network strategy
self.addEventListener("fetch", event => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== "GET") {
    return
  }

  // Skip extension requests
  if (url.protocol === "chrome-extension:") {
    return
  }

  // Cache-first strategy for static assets
  if (url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|gif|webp|woff|woff2)$/)) {
    event.respondWith(
      caches.match(request).then(response => {
        return (
          response ||
          fetch(request)
            .then(response => {
              // Cache successful responses
              if (response && response.status === 200) {
                const cache = caches.open(CACHE_NAME)
                cache.then(c => c.put(request, response.clone()))
              }
              return response
            })
            .catch(() => {
              // Fallback for failed requests
              return caches.match("/index.html")
            })
        )
      })
    )
  }
  // Network-first strategy for API calls
  else if (url.pathname.startsWith("/api")) {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Cache successful API responses
          if (response && response.status === 200) {
            const cache = caches.open(CACHE_NAME)
            cache.then(c => c.put(request, response.clone()))
          }
          return response
        })
        .catch(() => {
          // Return cached response if network fails
          return caches.match(request).then(response => {
            return response || new Response(JSON.stringify({ error: "Offline" }), { status: 503 })
          })
        })
    )
  }
  // Network-first for HTML
  else {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response && response.status === 200) {
            const cache = caches.open(CACHE_NAME)
            cache.then(c => c.put(request, response.clone()))
          }
          return response
        })
        .catch(() => {
          return caches.match(request)
        })
    )
  }
})
