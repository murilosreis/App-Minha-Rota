const CACHE_NAME = 'minha-rota-v2';
const APP_SHELL = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  // Não chama mais self.skipWaiting() aqui de propósito: assim, quando
  // sobe uma versão nova, ela fica "esperando" até o usuário confirmar
  // no botão "Atualizar" na tela, em vez de trocar sozinha por baixo dos panos.
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Permite que a página peça pro service worker novo assumir agora
// (disparado quando o usuário toca em "Atualizar").
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING'){
    self.skipWaiting();
  }
});

// Estratégia: tenta a rede primeiro, ignorando qualquer cache HTTP do
// navegador (cache: 'no-store'), pra sempre pegar a versão mais nova.
// Só usa o cache do service worker como reserva se estiver offline.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request, { cache: 'no-store' })
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
