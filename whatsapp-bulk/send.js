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

  console.log('==============================');
  console.log('VERSION MAY 28 - SAFE MODE');
  console.log('WhatsApp is ready.');
  console.log('==============================');

  const archivo = process.argv[2] || 'clientes_hielo.csv';

  const esAgua = archivo.toLowerCase().includes('agua');

  fs.createReadStream(archivo)
    .pipe(csv())
    .on('data', (row) => contacts.push(row))
    .on('end', async () => {

      console.log(`Loaded ${contacts.length} contacts`);

      let sentCount = 0;

      for (const contact of contacts) {

        // Clean phone number
        let telefono = String(contact.telefono || '')
          .replace(/\D/g, '')
          .trim();

        // Validate number
        if (
          telefono.length !== 11 ||
          !telefono.startsWith('503')
        ) {
          console.log(`⚠️ Skipping invalid number: ${telefono}`);
          continue;
        }

        // Avoid duplicates
        if (processedNumbers.has(telefono)) {
          console.log(`⚠️ Skipping duplicate: ${telefono}`);
          continue;
        }

        processedNumbers.add(telefono);

        const number = telefono + '@c.us';

        // Message templates
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

          // Simulate typing
          const chat = await client.getChatById(number);

          await chat.sendStateTyping();

          // Small typing delay
          await delay(
            2000 + Math.floor(Math.random() * 3000)
          );

          // Send message
          await client.sendMessage(number, message);

          console.log(`✅ Sent to ${telefono}`);

          sentCount++;

          // Long break every 15 messages
          if (sentCount % 15 === 0) {

            console.log('☕ Taking a 1 minute break...');

            await delay(60000);
          }

        } catch (error) {

          console.log(`❌ Failed: ${telefono}`);

          console.log(error.message);

        }

        // Random delay between 12 and 22 seconds
        const randomDelay =
          12000 + Math.floor(Math.random() * 10000);

        console.log(
          `⏳ Waiting ${Math.round(randomDelay / 1000)} seconds...`
        );

        await delay(randomDelay);
      }

      console.log('==============================');
      console.log('Finished sending messages.');
      console.log('==============================');

      process.exit(0);
    });
});

client.initialize();
