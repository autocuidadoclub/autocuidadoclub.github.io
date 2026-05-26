const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const csv = require('csv-parser');

const client = new Client({
  authStrategy: new LocalAuth()
});

const contacts = [];
const processedNumbers = new Set();

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

client.on('qr', qr => {
  qrcode.generate(qr, { small: true });
});

client.on('ready', async () => {
  console.log('WhatsApp is ready.');

  const archivo = process.argv[2] || 'clientes_hielo.csv';

  const esAgua = archivo.toLowerCase().includes('agua');

  fs.createReadStream(archivo)
    .pipe(csv())
    .on('data', (row) => contacts.push(row))
    .on('end', async () => {

      console.log(`Loaded ${contacts.length} contacts`);

      for (const contact of contacts) {

        // Clean number
        let telefono = String(contact.telefono || '')
          .replace(/\D/g, '')
          .trim();

        // Validate Salvadoran number
        if (telefono.length !== 11 || !telefono.startsWith('503')) {
          console.log(`Skipping invalid number: ${telefono}`);
          continue;
        }

        // Avoid duplicates
        if (processedNumbers.has(telefono)) {
          console.log(`Skipping duplicate: ${telefono}`);
          continue;
        }

        processedNumbers.add(telefono);

        const number = telefono + '@c.us';

        const message = esAgua
          ? `Hola ${contact.nombre}, buen día 👋\n\n` +
            `¿Necesitan agua Cristal de 5 galones para esta semana? 💧\n\n` +
            `🚚 Entrega a domicilio\n` +
            `Quedo atento a su pedido. ¡Gracias!`

          : `Hola ${contact.nombre}, buen día 👋\n\n` +
            `Recuerda que con buen hielo 🧊 puedes mejorar la calidad de tus bebidas y brindar una mejor experiencia a tus clientes.\n\n` +
            `¿Necesitan hielo de 50 lb para esta semana?\n\n` +
            `🚚 Entrega a domicilio\n` +
            `Quedo atento a su pedido. ¡Gracias!`;

        try {

          await client.sendMessage(number, message);

          console.log(`✅ Sent to ${telefono}`);

        } catch (error) {

          console.log(`❌ Failed: ${telefono}`);
          console.log(error.message);

        }

        // Random delay between 4 and 8 seconds
        const randomDelay =
          4000 + Math.floor(Math.random() * 4000);

        console.log(
          `Waiting ${Math.round(randomDelay / 1000)} seconds...`
        );

        await delay(randomDelay);
      }

      console.log('Finished sending messages.');
      process.exit(0);
    });
});

client.initialize();
