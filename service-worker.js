importScripts('https://www.gstatic.com/firebasejs/10.5.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.5.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBppI8FqUnvYRbcb3ODxekdOkzOrOdKOtg",
  authDomain: "tderequisicao-8b3c1.firebaseapp.com",
  projectId: "tderequisicao-8b3c1",
  storageBucket: "tderequisicao-8b3c1.appspot.com",
  messagingSenderId: "716098425450",
  appId: "1:716098425450:web:b7749f812f3b0587e2b013",
  measurementId: "G-BNLQXEVLVC"
});

const messaging = firebase.messaging();

// Nome do cache
const CACHE_NAME = 'my-app-cache-v1';
// Arquivos/rotas para armazenar em cache
const urlsToCache = [
  './',
  './public/index.html',
  './public/app.js',
  './public/styles.css',
  './service-worker.js',
  'https://maxcdn.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css',
  'https://www.gstatic.com/firebasejs/10.5.0/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/10.5.0/firebase-auth-compat.js',
  'https://www.gstatic.com/firebasejs/10.5.0/firebase-firestore-compat.js',
  'https://www.gstatic.com/firebasejs/10.5.0/firebase-analytics-compat.js',
  'https://www.gstatic.com/firebasejs/10.5.0/firebase-messaging-compat.js',
  'https://cdn.jsdelivr.net/npm/idb-keyval@6/dist/umd.js',
  'https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.16.0/umd/popper.min.js',
  'https://maxcdn.bootstrapcdn.com/bootstrap/4.5.2/js/bootstrap.min.js',
  // Adicione quaisquer outras imagens, ícones ou fontes aqui
];

self.addEventListener('install', function (event) {
  // Realiza o pré-cache dos recursos
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function (cache) {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', function (event) {
  event.respondWith(
    caches.match(event.request)
      .then(function (response) {
        return response || fetch(event.request);
      })
      .catch(function () {
        // Responda com um recurso de fallback se estiver offline
        return caches.match('/offline.html');
      })
  );
});

self.addEventListener('sync', event => {
  if (event.tag === 'sync-requests') {
    event.waitUntil(syncOfflineRequests());
  } else if (event.tag === 'sync-items') {
    event.waitUntil(syncOfflineItems());
  }
});

async function syncOfflineRequests () {
  const offlineRequests = await idbKeyval.get('offline-requests') || [];
  for (let request of offlineRequests) {
    const { description, userId, userEmail, timestamp } = request;
    const requestsRef = firebase.firestore()
      .collection('usuarios')
      .doc(userId)
      .collection('requisicoes');
    await requestsRef.add({
      descricao: description,
      hora: firebase.firestore.Timestamp.fromDate(new Date(timestamp)),
      status: "Pendente",
      userId: userId,
      userEmail: userEmail
    });
  }
  await idbKeyval.set('offline-requests', []); // Limpamos as requisições offline após sincronizá-las
}

async function syncOfflineItems () {
  const offlineItems = await idbKeyval.get('offline-items') || [];
  for (let item of offlineItems) {
    const { itemName, itemQuantity, itemPrice, requestId, userId, timestamp } = item;
    const itemsRef = firebase.firestore()
      .collection('usuarios')
      .doc(userId)
      .collection('requisicoes')
      .doc(requestId)
      .collection('itens');
    await itemsRef.add({
      nome: itemName,
      quantidade: itemQuantity,
      preco: itemPrice
    });
  }
  await idbKeyval.set('offline-items', []); // Limpamos os itens offline após sincronizá-los
}
