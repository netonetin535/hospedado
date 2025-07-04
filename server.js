const express = require('express');
const multer = require('multer');
const session = require('express-session');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

const ADMIN_USER = 'admin';
const ADMIN_PASS = '123456';

const upload = multer({ dest: 'public/uploads/' });

app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: 'secreto-cds',
  resave: false,
  saveUninitialized: true
}));

const dbPath = './cds.json';
let cds = fs.existsSync(dbPath) ? JSON.parse(fs.readFileSync(dbPath)) : [];

function saveCDs() {
  fs.writeFileSync(dbPath, JSON.stringify(cds, null, 2));
}

app.get('/admin', (req, res) => {
  if (req.session.logado) return res.redirect('/admin/admin.html');
  res.sendFile(__dirname + '/public/admin/login.html');
});

app.post('/login', (req, res) => {
  const { user, pass } = req.body;
  if (user === ADMIN_USER && pass === ADMIN_PASS) {
    req.session.logado = true;
    return res.redirect('/admin/admin.html');
  }
  res.send('<p>Login inválido. <a href="/admin">Tentar novamente</a></p>');
});

app.use('/admin/admin.html', (req, res, next) => {
  if (!req.session.logado) return res.redirect('/admin');
  next();
});

app.post('/api/upload', upload.fields([
  { name: 'capa', maxCount: 1 },
  { name: 'zip', maxCount: 1 },
  { name: 'faixas' }
]), (req, res) => {
  if (!req.session.logado) return res.status(403).send('Proibido');

  const nome = req.body.nome;
  const capa = req.files['capa'][0];
  const zip = req.files['zip'][0];
  const faixas = req.files['faixas'] || [];

  const faixaInfos = faixas.map(faixa => ({
    nome: faixa.originalname.replace('.mp3', ''),
    arquivo: `/uploads/${faixa.filename}`
  }));

  const cd = {
    id: Date.now(),
    nome,
    capa: `/uploads/${capa.filename}`,
    zip: `/uploads/${zip.filename}`,
    zipOriginal: zip.originalname,
    faixas: faixaInfos
  };

  cds.unshift(cd);
  saveCDs();
  res.redirect('/admin/admin.html');
});

app.get('/api/cds', (req, res) => {
  res.json(cds);
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
