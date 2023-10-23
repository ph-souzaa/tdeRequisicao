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

const CACHE_NAME = 'my-app-v1';
const ASSETS_TO_CACHE = [
  '/',
  './public/index.html',
  './public/app.js',
  './public/styles.css',
  './firebase-messaging-sw.js',
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
  'https://cdn.jsdelivr.net/npm/localforage@1.10.0/dist/localforage.min.js',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request);
      })
  );
});
