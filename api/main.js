require('dotenv').config({ override: true });


const express = require("express");
const cors = require("cors");
const path = require("path");
const livrosRouter = require("./routes/livros.routes");
const usuariosRouter = require("./routes/usuarios.routes");
const emprestimosRouter = require("./routes/emprestimos.router");
const comentarioRoutes = require('./routes/comentario.routes');
const avaliacaoRoutes = require('./routes/avaliacoes.routes'); 
const sugestoesRoutes = require('./routes/sugestoes.routes'); 
const doelivroRoutes = require('./routes/doelivro.routes'); 
const comunidadeRoutes = require('./routes/comunidade.routes'); 
const noticacoesRoutes = require('./routes/notificacoes.routes'); 
const relatorioRoutes = require('./routes/relatorios.routes'); 
const indicacoesRoutes = require('./routes/indicacoes.routes'); 
const app = express();


const allowedOrigins = (process.env.CORS_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);


app.use(cors({
  origin: function (origin, callback) {
    // permite sem Origin (curl/postman) ou se estiver na lista
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Não permitido por CORS: ' + origin));
  },
  methods: ['GET','POST','PATCH','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
  credentials: false,
}));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

app.use(express.static(path.join(__dirname, "public")));

app.use(livrosRouter);
app.use("/api", usuariosRouter);
app.use("/api", emprestimosRouter);
app.use("/api", comentarioRoutes);
app.use("/api", avaliacaoRoutes); 
app.use("/api", sugestoesRoutes); 
app.use("/api", doelivroRoutes); 
app.use("/api", comunidadeRoutes); 
app.use("/api", noticacoesRoutes); 
app.use("/api", relatorioRoutes); 
app.use("/api", indicacoesRoutes); 


const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`API iniciada na porta ${PORT}`);
});

