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
  const twiml = new MessagingResponse();
  const msg = req.body.Body ? req.body.Body.trim().toLowerCase() : '';
  let response = '';

  switch (msg) {
    case 'hola':
    case 'hi':
    case 'hello':
    case 'volver':
      response = `🚗 ¡Hola y bienvenido a AutoCuidado Club!

Elegí una opción para continuar:

1⃣ ¿Quiénes somos?  
2⃣ Inicio  
3⃣ Servicios  
4⃣ Suscripciones  
5⃣ Contactar al staff  
6⃣ Ingresar a tu cuenta  
7⃣ Centro de ayuda  
8⃣ Descargá nuestra app`;
      break;

    case '1':
      response = `🧠 Somos AutoCuidado Club.

Cuidamos tu vehículo sin talleres ni filas. Hecha con orgullo en El Salvador 🇸🇻

👉 Conocenos mejor aquí: https://autocuidadoclub.com/nosotros.html

✏️ Escribí *volver* para regresar al menú.`;
      break;

    case '2':
      response = `🏠 Volvé a la página principal del sitio y descubrí cómo trabajamos:

👉 https://autocuidadoclub.com

✏️ Escribí *volver* para regresar al menú.`;
      break;

    case '3':
      response = `🧰 ¿Qué querés conocer?

a) ¿Qué Revisamos en tu Vehículo?  
b) Nuestro Programa de Lealtad  
c) Conocé nuestro proceso  
d) Nuestras ofertas

📌 Escribí: a, b, c o d  
✏️ O escribí *volver* para regresar al menú.`;
      break;

    case 'a':
      response = `🔍 Revisamos frenos, niveles, batería, aceite, filtros, y más.

👉 Detalles: https://autocuidadoclub.com/servicios.html#checklist

✏️ Escribí *volver* para regresar al menú.`;
      break;

    case 'b':
      response = `🏅 Ganá premios por cuidar tu carro mensualmente.

👉 Detalles: https://autocuidadoclub.com/servicios.html#lealtad

✏️ Escribí *volver* para regresar al menú.`;
      break;

    case 'c':
      response = `⚙️ Llegamos a tu casa/oficina. Revisamos. Cuidamos. ¡Sin filas!

👉 Conocé cómo lo hacemos: https://autocuidadoclub.com/servicios.html#proceso

✏️ Escribí *volver* para regresar al menú.`;
      break;

    case 'd':
      response = `💸 Revisá nuestras promociones y premios disponibles.

👉 https://autocuidadoclub.com/servicios.html#ofertas

✏️ Escribí *volver* para regresar al menú.`;
      break;

    case '4':
      response = `📅 Elegí el plan ideal para vos y empezá a recibir mantenimiento personalizado.

👉 https://autocuidadoclub.com/suscripciones.html

✏️ Escribí *volver* para regresar al menú.`;
      break;

    case '5':
      response = `💬 ¿Necesitás ayuda?

👉 Escribinos directamente: https://wa.me/50377777777

✏️ Escribí *volver* para regresar al menú.`;
      break;

    case '6':
      response = `🔐 Accedé a tu dashboard para ver agenda, lealtad y referidos.

👉 https://autocuidadoclub.com/dashboard2.html

✏️ Escribí *volver* para regresar al menú.`;
      break;

    case '7':
      response = `❓¿Tenés dudas sobre el servicio, pagos o tu plan?

👉 Resolvelo aquí: https://autocuidadoclub.com/centro-ayuda.html

✏️ Escribí *volver* para regresar al menú.`;
      break;

    case '8':
      response = `📲 ¡Accedé más rápido desde tu pantalla de inicio!

👉 https://autocuidadoclub.com (en tu navegador móvil seleccioná "Agregar a inicio")

✏️ Escribí *volver* para regresar al menú.`;
      break;

    default:
      response = `🤖 Lo siento, no entendí ese mensaje.

Escribí *hola* o *volver* para ver las opciones disponibles.`;
  }

  // Branding y redes
  response += `

✨ Esta app es más que tecnología. Es una forma distinta de cuidar lo que importa.
AutoCuidado Club — Hecha con visión. Hecha con orgullo en El Salvador 🇸🇻

📱 Seguinos:
👉 Facebook: https://facebook.com/autocuidadoclub
👉 X: https://x.com/AutoCuidadoClub
👉 Instagram: https://instagram.com/autocuidadoclub`;

  twiml.message(response);
  res.writeHead(200, { 'Content-Type': 'text/xml' });
  res.end(twiml.toString());
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Bot WhatsApp activo en puerto ${PORT}`);
});
