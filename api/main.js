require("dotenv").config({
  path: require("path").resolve(__dirname, ".env"),
  override: true,
});

const express = require("express");
const cors = require("cors");
const path = require("path");
const livrosRouter = require("./routes/livros.routes");
const usuariosRouter = require("./routes/usuarios.routes");
const emprestimosRouter = require("./routes/emprestimos.router");
const comentarioRoutes = require("./routes/comentario.routes");
const avaliacaoRoutes = require("./routes/avaliacoes.routes");
const sugestoesRoutes = require("./routes/sugestoes.routes");
const doelivroRoutes = require("./routes/doelivro.routes");
const comunidadeRoutes = require("./routes/comunidade.routes");
const notificacoesRoutes = require("./routes/notificacoes.routes");
const relatorioRoutes = require("./routes/relatorios.routes");
const indicacoesRoutes = require("./routes/indicacoes.routes");
const ocrRoutes = require("./routes/ocr.routes");
const mykidsRoutes = require("./routes/mykids.routes");
const { createRateLimit } = require("./middlewares/rateLimit");
const {
  securityHeaders,
  validateRequestShape,
  requireJwtSecret,
} = require("./middlewares/security");

requireJwtSecret();

const app = express();
app.disable("x-powered-by");
app.set("trust proxy", 1);

const allowedOrigins = Array.from(
  new Set([
    "https://app.helenaramazzotte.online",
    ...(process.env.CORS_ORIGINS || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  ])
);
const isLocalOrigin = (origin) =>
  /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin || "");
const allowNoOriginRequests =
  process.env.ALLOW_NO_ORIGIN_REQUESTS === "true" || process.env.NODE_ENV !== "production";

app.use(
  cors({
    origin(origin, callback) {
      if (!origin && allowNoOriginRequests) return callback(null, true);
      if (origin && (isLocalOrigin(origin) || allowedOrigins.includes(origin))) {
        return callback(null, true);
      }
      return callback(new Error("Origem nao permitida"));
    },
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: false,
  })
);

app.use(securityHeaders);
app.use(
  createRateLimit({
    windowMs: 60_000,
    maxRequests: 300,
    maxConcurrent: 30,
    keyPrefix: "api",
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use(validateRequestShape);

app.use(express.static(path.join(__dirname, "public")));

app.use(livrosRouter);
app.use("/api", usuariosRouter);
app.use("/api", emprestimosRouter);
app.use("/api", comentarioRoutes);
app.use("/api", avaliacaoRoutes);
app.use("/api", sugestoesRoutes);
app.use("/api", doelivroRoutes);
app.use("/api", comunidadeRoutes);
app.use("/api", notificacoesRoutes);
app.use("/api", relatorioRoutes);
app.use("/api", indicacoesRoutes);
app.use("/api", ocrRoutes);
app.use("/api", mykidsRoutes);

app.use((err, req, res, next) => {
  console.error("Erro nao tratado na API:", err);
  res.status(err.status || 500).json({ erro: "Erro interno no servidor" });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`API iniciada na porta ${PORT}`);
});
