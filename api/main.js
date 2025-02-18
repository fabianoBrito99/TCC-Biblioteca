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

// Configuração CORS para permitir múltiplas origens
const allowedOrigins = [
  "http://127.0.0.1:5501",
  "http://localhost:3000",
  "http://10.0.2.2:3000",
  "http://10.0.2.2:3000", // Para emuladores Android
  "http://192.168.1.4:8081", // Endereço do Expo
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Permite requisições de origens que estão na lista
      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error("Não permitido por CORS"));
      }
    },
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

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


const PORT = 4000;
app.listen(PORT, () => {
  console.log(`API iniciada na porta: ${PORT}`);
});
