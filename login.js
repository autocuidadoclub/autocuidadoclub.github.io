// login.js
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
