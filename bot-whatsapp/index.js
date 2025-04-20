require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { MessagingResponse } = require('twilio').twiml;

const app = express();
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.get('/', (req, res) => {
  res.send('✅ Bot activo y escuchando');
});


app.post('/whatsapp', (req, res) => {
  console.log('✅ Incoming message from Twilio:', req.body);
  const twiml = new MessagingResponse();
  const msg = req.body.Body ? req.body.Body.trim().toLowerCase() : '';

  let response = '';

  if (msg === 'hola' || msg === 'hi' || msg === 'hello') {
    response = `🚗 ¡Hola y bienvenido a AutoCuidado Club!

Elegí una opción para continuar:

1️⃣ Ver nuestros planes  
2️⃣ Programar mantenimiento  
3️⃣ Programa de lealtad  
4️⃣ Invitar a un amigo  
5️⃣ Contactar al staff`;
  } else if (msg === '1') {
    response = `🔧 Nuestros planes disponibles:

- Plan Básico desde $29.99
- Plan Plus con más beneficios

👉 Más detalles aquí: https://autocuidadoclub.com/suscripciones2.html`;
  } else if (msg === '2') {
    response = `📅 ¡Listo para tu primer mantenimiento!

👉 Agenda aquí: https://autocuidadoclub.com/dashboard3.html`;
  } else if (msg === '3') {
    response = `🏅 Consultá tu programa de lealtad:

👉 https://autocuidadoclub.com/dashboard3.html#lealtad`;
  } else if (msg === '4') {
    response = `🎁 Invitá a tus amigos y ganá premios:

👉 Compartí tu código en: https://autocuidadoclub.com/dashboard3.html#referidos`;
  } else if (msg === '5') {
    response = `💬 ¿Necesitás ayuda?

👉 Escribinos aquí: https://wa.me/50377777777`;
  } else {
    response = `🤖 Lo siento, no entendí ese mensaje.

Escribí "hola" para ver las opciones disponibles.`;
  }
 
  twiml.message(response);
  res.writeHead(200, { 'Content-Type': 'text/xml' });
  res.end(twiml.toString());
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Bot WhatsApp activo en puerto ${PORT}`);
});
