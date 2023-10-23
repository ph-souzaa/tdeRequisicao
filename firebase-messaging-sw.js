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