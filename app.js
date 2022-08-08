const qrcode = require('qrcode-terminal');
const { Client, LocalAuth, List, Buttons, MessageMedia } = require('whatsapp-web.js');
const { readFileAsTextSync } = require('node-read-file-helper');
const path = require('path');

const client = new Client({
restartOnAuthFail: true,
puppeteer: {
  headless: true,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-accelerated-2d-canvas',
    '--no-first-run',
    '--no-zygote',
    '--single-process', // <- this one doesn't works in Windows
    '--disable-gpu'
  ],
},
authStrategy: new LocalAuth()
});

client.on('qr', (qr) => {
    qrcode.generate(qr, {small: true});
});

client.on('ready', () => {
    console.log('Client is ready!');
});

client.on('authenticated', () => {
    console.log('Log =>', 'Whatsapp is authenticated!');
});

client.on('auth_failure', function() {
    console.log('Log =>', 'Auth failure, restarting...');
});

client.on('disconnected', (reason) => {
    console.log('Log =>', 'Whatsapp is disconnected!');
    client.destroy();
    client.initialize();
});


const dtpeg = require('./lib/pegawai');
const { sendMediaFromUrl } = require('./lib/sendMedia');
const cek_validate = require('./helpers/validations');

// MESSAGE REPLY
client.on('message', async (message) => {
    if(message.body === '!ping') {
        const yt = await MessageMedia.fromUrl('https://www.youtube.com/watch?v=Y6ghFjumFfI', {unsafeMime: true});
        await client.sendMessage(message.from, yt, {linkPreview: true});
        console.log(await message.getQuotedMessage());
    }
});

// MESSAGE SEND
client.on('message', async (message, ack) => {
   // console.log('RECIVED', message)
    
    let req = message.body.toLowerCase();
    let req_nipnik = message.body.toLowerCase().substring(3);
    let separator = '_';

    // const onStart = await client.sendSeen(message.from, (data) => {return data});

    // if(onStart === true) {
        // client.sendMessage(message.from, 'Hi Selamat Datang Di BOT WA BKPSDM, ketik /start untuk memulai');
        // console.log(Events)
    // }

    /* Statis Response */
    if(req === '/hi') {
        const contact = await message.getContact();
        await client.sendMessage(message.from, `👋 Hello! @${contact.name}`);
        let button_data = [{id:'customId',body:'bt1'},{body:'bt2'},{body:'bt3'}];
        let btn = new Buttons('Button body',button_data,'title','footer');
        await client.sendMessage(message.from, btn);
    } else if(req === '/start' || req === 'hi' || req === 'hello' || req === 'hay' || req === 'assalamualaikum') {
        const contact = await message.getContact();
        let sections = [{title:'PILIH LAYANAN',rows:[{id: '/pegawai',title:'PEGAWAI', description: 'Profile Pegawai'},{id: '/pensiun',title:'PENSIUNAN', description: 'Persyaratan Pensiun'}]}];
        let list = new List(`👋 Hello! @${contact.name}, perkenalkan saya Putra asistan layanan info pegawai. Silahkan pilih *menu* di bawah ini untuk detail layanan.`,'MENU',sections,'LAYANAN INFORMASI KEPEGAWAIAN','footer');
        client.sendMessage(message.from, list);
    } else if(message.selectedRowId === '/pegawai') {
        await client.sendMessage(message.from, `Silahkan masukan *NIP* *(PNS)* dan *NIK* *(NON PNS)*\n\n*FORMAT:* \nID<undescure>NIP/NIK\n\n*CONTOH:*\nID${separator}XXXXXXXXXXX\n\n*CATATAN:*\nXXX ganti menjadi NIP/NIK anda`);
    } else if(message.selectedRowId === '/pensiun') {
        const asString = readFileAsTextSync(path.resolve('./response/pensiunan.txt'));
        let sections = [{title:'PILIH LAYANAN',rows:[{id: '/pensiun_01',title:'PENSIUN APS', description: 'Pensiunan Atas Permintaan Sendiri'},{id: '/pensiun_02',title:'PENSIUNAN BUP', description: 'Pensiun Batas Usia Pensiun'}]}];
        let list = new List(asString,'MENU',sections,'LAYANAN INFORMASI PENSIUN','footer');
        client.sendMessage(message.from, list);
    }
    
    /* CEK PROFILE PEGAWAI */
    else if(req === `id${separator}${req_nipnik}`) {
      if(req_nipnik.length < 16 || req_nipnik.length > 18) {
        client.sendMessage(message.from, 'NIP/NIK INVALID');
        return false;  
      }
      if(cek_validate.validation.isNumber(req_nipnik) === false){
        client.sendMessage(message.from, 'SILAHKAN MASUKAN NIP ATAU NIK YANG VALID !');
        return false;
      }
      dtpeg.pegawai(req_nipnik).then(res => {
        if(res.status !== 200) {
            client.sendMessage(message.from, 'ERR_BAD_REQUEST | SERVER NOT CONNECT');
            return;
        }

        if(res.data[0].kind === true) {
          client.sendMessage(message.from, res.data[0].message.toUpperCase());
          client.sendMessage(message.from, `*ID*\n${res.data[0].id}\n\n*NAMA*\n${res.data[0].nama}\n\n*JENIS KELAMIN*\n${res.data[0].jk}\n\n*UMUR*\n${res.data[0].umur} Tahun`);   
        } else {
          client.sendMessage(message.from, res.data[0].message);
        }
      })
    } else {
        if(ack == 2) {
            const contact = await message.getContact();
            client.sendMessage(message.from, `*NOTED*\n👋 Hello! @${contact.name}, terimakasih sudah menghubungi putra, saat ini saya sedang sibuk jadi mohon menunggu beberapa saat.\n\n_pesan ini ditampilkan oleh *bot*_`, {});
        }
    }
});
client.initialize();