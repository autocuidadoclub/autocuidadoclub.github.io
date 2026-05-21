const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const csv = require('csv-parser');

const client = new Client({
  authStrategy: new LocalAuth()
});

const contacts = [];

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

client.on('qr', qr => {
  qrcode.generate(qr, { small: true });
});

client.on('ready', async () => {
  console.log('WhatsApp is ready.');

  fs.createReadStream('clientes.csv')
    .pipe(csv())
    .on('data', (row) => contacts.push(row))
    .on('end', async () => {
      for (const contact of contacts) {
        const number = contact.telefono + '@c.us';
        const message =
          `Hola ${contact.nombre}, buen día 👋\n\n` +
          `Somos AutoCuidado ICE 🧊\n` +
          `¿Necesitan hielo de 50 lb para esta semana?\n\n` +
          `🚚 Entrega a domicilio\n` +
          `💰 Precios especiales por volumen`;

        try {
          await client.sendMessage(number, message);
          console.log(`Sent to ${contact.telefono}`);
        } catch (error) {
          console.log(`Failed to send to ${contact.telefono}`);
        }

        await delay(60000); // Wait 60 seconds
      }

      console.log('Finished sending messages.');
    });
});

client.initialize();
