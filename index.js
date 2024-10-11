const fs = require('fs');
const qrcode = require('qrcode-terminal');
const { Client, MessageMedia } = require('whatsapp-web.js');
const express = require('express');
const cors = require('cors');
 
const SESSION_FILE_PATH = './session.json';
let ws;
let dataSession;

 
const withSession = () => {
  dataSession = require(SESSION_FILE_PATH);
  ws = new Client({ session: dataSession });
  ws.on('ready', () => console.log('Cliente está pronto!'));
  ws.on('auth_failure', () => {
      console.log('** O erro de autenticação regenera o QRCODE (Excluir o arquivo session.json) **');
      fs.unlinkSync('./session.json');
  })
  ws.initialize();
}
 
const withOutSession = () => {
  ws = new Client();
   ws.on('qr', qr => { qrcode.generate(qr, { small: true }); });
  ws.on('ready', () => console.log('Cliente está pronto!'));
  ws.on('auth_failure', () => {
      console.log('** O erro de autenticação regenera o QRCODE (Excluir o arquivo session.json) **');
      fs.unlinkSync('./session.json');
  })
  ws.on('authenticated', (session) => {
      dataSession = session;
      fs.writeFile(SESSION_FILE_PATH, JSON.stringify(session), (err) => {
          if (err) console.log(err);
      });
  });
  ws.initialize();
}

 
(fs.existsSync(SESSION_FILE_PATH)) ? withSession() : withOutSession();

 
const sendMessage = (number = null, text = null) => {
  number = number.replace('@c.us', '');
  number = `${number}@c.us`
  const message = text || `Olá, eu sou um BOT`;
  ws.sendMessage(number, message);
}

 

const sendMessageMedia = (number, fileName, caption) => {
  number = number.replace('@c.us', '');
  number = `${number}@c.us`
  const media = MessageMedia.fromFilePath(`./media/${fileName}`)
  ws.sendMessage(number, media, { caption: caption });
}

 
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: true }));
 
const sendText = (req, res) => {
  const { message, number } = req.body
  sendMessage(number, message)
  res.send({ status: 'Enviado mensagem!' })
}


const sendMidia = (req, res) => {
  const { number, fileName, caption } = req.body
  sendMessageMedia(number, fileName, caption)
  res.send({ status: 'Enviado mensagem multimidia!' })
}
 
app.post('/send', sendText);
app.post('/sendMedia', sendMidia);

 


app.listen(9000, () => console.log('Server ready!'));
