import { auth, db, doc, getDoc } from './firebase.js';

auth.onAuthStateChanged((user) => {
    if (user) {
        const userRef = doc(db, 'users', user.uid);
        
        getDoc(userRef).then((docSnap) => {
            if (docSnap.exists()) {
                const userData = docSnap.data();
                const vehicles = userData.vehicles.map(v => `${v.make} ${v.model} (${v.year})`).join(', ');

                document.getElementById('profileInfo').innerHTML = `
                    <h2>${userData.name}</h2>
                    <p>Email: ${userData.email}</p>
                    <p>Teléfono: ${userData.phone}</p>
                    <p>Vehículos: ${vehicles}</p>
                    <p>Estado de Suscripción: ${userData.subscriptionStatus}</p>
                `;
            } else {
                console.error('Documento no encontrado');
            }
        }).catch(error => console.error('Error al obtener el documento:', error));
    } else {
        window.location.href = 'login.html';
    }
});
