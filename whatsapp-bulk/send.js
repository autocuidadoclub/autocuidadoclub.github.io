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

  // File to use: clientes_hielo.csv or clientes_agua.csv
  const archivo = process.argv[2] || 'clientes_hielo.csv';

  // Determine whether this is the water list
  const esAgua = archivo.toLowerCase().includes('agua');

  fs.createReadStream(archivo)
    .pipe(csv())
    .on('data', (row) => contacts.push(row))
    .on('end', async () => {
      for (const contact of contacts) {
        const number = contact.telefono + '@c.us';

        // Select message based on file name
       const message = esAgua
  ? `Hola ${contact.nombre}, buen día 👋\n\n` +
    `¿Necesitan agua Cristal de 5 galones para esta semana? 💧\n\n` +
    `🚚 Entrega a domicilio\n` +
    `Quedo atento a su pedido. ¡Gracias!`
  : `Hola ${contact.nombre}, buen día 👋\n\n` +
    `Recuerden que con buen hielo sus bebidas se mantienen frías por más tiempo y mejoran la experiencia de sus clientes 🧊🍹\n\n` +
    `¿Necesitan hielo de 50 lb para esta semana?\n\n` +
    `🚚 Entrega a domicilio\n` +
    `💎 Más calidad para sus bebidas y eventos\n\n` +
    `Quedo atento a su pedido. ¡Gracias!`;

        try {
         const chat = await client.getChatById(number);

await chat.sendStateTyping();

await delay(2000 + Math.floor(Math.random() * 3000));

// TEST MODE ONLY
console.log('--------------------------------');
console.log(`READY TO SEND TO: ${telefono}`);
console.log(`NAME: ${contact.nombre}`);
console.log('MESSAGE:');
console.log(message);
console.log('--------------------------------');
          console.log(`Sent to ${contact.telefono}`);
        } catch (error) {
          console.log(`Failed to send to ${contact.telefono}`);
          console.log(error.message);
        }

        // Wait 60 seconds between messages
        // Random delay between 8 and 20 seconds
const randomDelay = 8000 + Math.floor(Math.random() * 12000);

console.log(`Waiting ${Math.round(randomDelay / 1000)} seconds...`);

await delay(randomDelay);
      }

      console.log('Finished sending messages.');
      process.exit(0);
    });
});

client.initialize();
