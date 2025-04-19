require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { MessagingResponse } = require('twilio').twiml;

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

app.post('/whatsapp', (req, res) => {
  const twiml = new MessagingResponse();
  const msg = req.body.Body.toLowerCase();

  if (msg.includes('hola')) {
    twiml.message('¡Hola! Bienvenido a AutoCuidado Club 🚗✨\n\nEscribe:\n1️⃣ Para conocer nuestros planes\n2️⃣ Para contactar al staff\n3️⃣ Para programar tu mantenimiento');
  } else if (msg === '1' || msg.includes('plan')) {
    twiml.message('Nuestros planes:\n\n🔧 Básico desde $29.99/mes\n🚗 Plus desde $59.99/mes\n\nEscribe *2* para contactar al staff.');
  } else if (msg === '2' || msg.includes('staff')) {
    twiml.message('Puedes escribirnos directo aquí 👇\nhttps://wa.me/50377777777');
  } else if (msg === '3' || msg.includes('programar')) {
    twiml.message('Perfecto. Ingresá a: https://autocuidadoclub.com/dashboard3.html para agendar tu cita.');
  } else {
    twiml.message('Lo siento, no entendí. Escribe "hola" para comenzar de nuevo.');
  }

  res.writeHead(200, { 'Content-Type': 'text/xml' });
  res.end(twiml.toString());
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Bot WhatsApp activo en puerto ${PORT}`));
