// main.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const livrosRouter = require('./routes/livros.routes');
// Importar rotas para usuários e empréstimos conforme necessário
const usuariosRouter = require('./routes/usuarios.routes');
const emprestimosRouter = require('./routes/emprestimos.router');

const app = express();

app.use(cors({
  origin: 'http://127.0.0.1:5501',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

app.use(express.static(path.join(__dirname, 'public')));

app.use(livrosRouter);
app.use('/api', usuariosRouter);
app.use('/api', emprestimosRouter);

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`API iniciada na porta: ${PORT}`);
});
