// login.js

import firebase from "firebase/app";
import "firebase/auth";
import "firebase/firestore";
const firebaseConfig = {
  apiKey: "AIzaSyBsYS6pHWaTgXzdml-H_y3lQewWgOUezPM",
  authDomain: "auto-cuidadoclub.firebaseapp.com",
  databaseURL: "https://auto-cuidadoclub-default-rtdb.firebaseio.com",
  projectId: "auto-cuidadoclub",
  storageBucket: "auto-cuidadoclub.appspot.com",
  messagingSenderId: "986704701191",
  appId: "1:986704701191:web:fc96ef678d64c1cdcf47a2",
  measurementId: "G-LBBGXV2YX5"

document.getElementById('loginForm').addEventListener('submit', (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    firebase.auth().signInWithEmailAndPassword(email, password)
        .then(() => {
            window.location.href = 'profile.html';
        })
        .catch((error) => {
            console.error('Error al iniciar sesión:', error);
        });
});
