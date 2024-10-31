import { auth, signInWithEmailAndPassword } from './firebase.js';

document.getElementById('loginForm').addEventListener('submit', (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    signInWithEmailAndPassword(auth, email, password)
        .then(() => {
            window.location.href = 'profile.html';
        })
        .catch(error => console.error('Error al iniciar sesión:', error));
});
