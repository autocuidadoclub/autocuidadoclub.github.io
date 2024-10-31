// register.js
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

    // Register user in Firebase Auth
    firebase.auth().createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            const userId = userCredential.user.uid;

            // Save profile data to Firestore
            return firebase.firestore().collection('users').doc(userId).set({
                name, email, phone,
                vehicles: [{ plate, make, model, year }],
                subscriptionStatus: 'Pending'
            });
        })
        .then(() => {
            alert('Registro exitoso');
            // Send WhatsApp message via Twilio (see Step 5)
            window.location.href = 'login.html';
        })
        .catch((error) => {
            console.error('Error en el registro:', error);
        });
});
