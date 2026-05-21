const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');

const client = new Client({
  authStrategy: new LocalAuth()
});

client.on('qr', qr => {
  qrcode.generate(qr, { small: true });
});

client.on('ready', async () => {
  console.log('WhatsApp is ready.');
  console.log('Reading chats...');

  const chats = await client.getChats();

  let hieloCSV = 'telefono,nombre\n';
  let aguaCSV = 'telefono,nombre\n';

  for (const chat of chats) {
    try {
      if (!chat.isGroup && chat.id.user) {

        const number = chat.id.user;

        const name =
          chat.name ||
          chat.pushname ||
          'Cliente';

        // Detect words related to water
        const lowerName = name.toLowerCase();

        if (
          lowerName.includes('agua') ||
          lowerName.includes('water')
        ) {
          aguaCSV += `${number},${name}\n`;
        } else {
          hieloCSV += `${number},${name}\n`;
        }
      }
    } catch (err) {
      console.log('Error reading chat');
    }
  }

  fs.writeFileSync('clientes_hielo.csv', hieloCSV);
  fs.writeFileSync('clientes_agua.csv', aguaCSV);

  console.log('Files created successfully!');
  console.log('clientes_hielo.csv');
  console.log('clientes_agua.csv');

  process.exit(0);
});

client.initialize();
