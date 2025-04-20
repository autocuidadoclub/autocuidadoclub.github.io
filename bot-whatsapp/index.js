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
  const twiml = new MessagingResponse();
  const msg = req.body.Body ? req.body.Body.trim().toLowerCase() : '';
  let response = '';

  if (msg === 'hola' || msg === 'hi' || msg === 'hello') {
    response = `🚗 ¡Hola y bienvenido a AutoCuidado Club!\n\n1️⃣ Ver planes\n2️⃣ Programar mantenimiento\n3️⃣ Lealtad\n4️⃣ Referir amigo\n5️⃣ Contactar staff`;
  } else {
    response = `🤖 Lo siento, no entendí. Escribí "hola" para ver el menú.`;
  }

  twiml.message(response);
  res.writeHead(200, { 'Content-Type': 'text/xml' });
  res.end(twiml.toString());
});

// 👇 Este es el secreto
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Bot WhatsApp activo en puerto ${PORT}`);
});
