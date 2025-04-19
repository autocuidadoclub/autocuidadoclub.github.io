require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { MessagingResponse } = require('twilio').twiml;

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

app.post('/whatsapp', (req, res) => {
  const twiml = new MessagingResponse();
  const incomingMsg = req.body.Body.trim().toLowerCase();

  let response = '';

  if (incomingMsg === 'hola' || incomingMsg === 'hi' || incomingMsg === 'hello') {
    response = `🚗 ¡Hola y bienvenido a AutoCuidado Club!

Elegí una opción para continuar:

1️⃣ Ver nuestros planes  
2️⃣ Programar mantenimiento  
3️⃣ Programa de lealtad  
4️⃣ Invitar a un amigo  
5️⃣ Contactar al staff`;
  }

  else if (incomingMsg === '1') {
    response = `🔧 Nuestros planes disponibles:

- Plan Básico desde $29.99
- Plan Plus con más beneficios

👉 Descubrí todos los detalles aquí:  
https://autocuidadoclub.com/suscripciones2.html`;
  }

  else if (incomingMsg === '2') {
    response = `📅 ¡Listo para tu primer mantenimiento?

👉 Agenda tu inspección aquí:  
https://autocuidadoclub.com/dashboard3.html`;
  }

  else if (incomingMsg === '3') {
    response = `🏅 Tu progreso en el programa de lealtad está disponible aquí:

👉 https://autocuidadoclub.com/dashboard3.html#lealtad`;
  }

  else if (incomingMsg === '4') {
    response = `🎁 Invitá a tus amigos y ganá premios:

👉 Compartí tu código aquí:  
https://autocuidadoclub.com/dashboard3.html#referidos`;
  }

  else if (incomingMsg === '5') {
    response = `💬 ¿Necesitás ayuda?

👉 Escribinos directamente aquí:  
https://wa.me/50377777777`;
  }

  else {
    response = `🤖 Lo siento, no entendí ese mensaje.

Escribí "hola" para ver las opciones disponibles.`;
  }

  twiml.message(response);
  res.writeHead(200, { 'Content-Type': 'text/xml' });
  res.end(twiml.toString());
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Bot WhatsApp activo en puerto ${PORT}`));

Update bot logic to include menu options

