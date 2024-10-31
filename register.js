import { auth, db, createUserWithEmailAndPassword, setDoc, doc } from './firebase.js';

document.getElementById('registerForm').addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const phone = document.getElementById('phone').value;
    const plate = document.getElementById('plate').value;
    const make = document.getElementById('make').value;
    const model = document.getElementById('model').value;
    const year = document.getElementById('year').value;

    createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            const userId = userCredential.user.uid;
            
            // Save user data to Firestore
            setDoc(doc(db, 'users', userId), {
                name,
                email,
                phone,
                vehicles: [{ plate, make, model, year }],
                subscriptionStatus: 'Pending'
            }).then(() => {
                alert('Usuario registrado exitosamente');
                window.location.href = 'login.html';
            }).catch(error => console.error('Error al guardar en Firestore:', error));
        })
        .catch(error => console.error('Error al registrar usuario:', error));
});
