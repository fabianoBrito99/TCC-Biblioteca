const jwt = require("jsonwebtoken");
const connection = require("../config/mysql.config");

function getTokenFrom(req) {
  const auth = req.headers.authorization || "";
  if (auth.startsWith("Bearer ")) return auth.slice(7);
  return null; // se quiser, aqui poderia buscar cookie: req.cookies?.token
}

function normalizeRole(role) {
  const normalized = String(role || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

  if (normalized === "administrador") return "admin";
  if (normalized === "voluntario") return "voluntario";
  if (normalized === "leitor") return "leitor";
  return normalized;
}

function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    connection.query(sql, params, (error, results) => {
      if (error) return reject(error);
      resolve(results);
    });
  });
}

async function carregarTipoUsuarioAtual(req) {
  if (!req.user?.id) return normalizeRole(req.user?.tipo_usuario);
  if (req.user.tipo_usuario_db) return req.user.tipo_usuario_db;

  try {
    const rows = await query(
      "SELECT tipo_usuario FROM Usuario WHERE id_usuario = ? LIMIT 1",
      [Number(req.user.id)]
    );
    const tipoAtual = normalizeRole(rows?.[0]?.tipo_usuario || req.user.tipo_usuario);
    req.user.tipo_usuario_db = tipoAtual;
    req.user.tipo_usuario = tipoAtual;
    return tipoAtual;
  } catch {
    return normalizeRole(req.user?.tipo_usuario);
  }
}

exports.auth = (req, res, next) => {
  const token = getTokenFrom(req);
  if (!token) return res.status(401).json({ erro: "Token ausente" });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const roleFromToken =
      payload.tipo_usuario ??
      payload.tipoUsuario ??
      payload.tipo ??
      payload.role;

    req.user = {
      ...payload,
      id: payload.id ?? payload.id_usuario ?? payload.userId,
      tipo_usuario: normalizeRole(roleFromToken),
    }; // { id, nome_login, tipo_usuario, iat, exp }
    next();
  } catch {
    return res.status(401).json({ erro: "Token inválido ou expirado" });
  }
};

exports.authorize = (...roles) => async (req, res, next) => {
  if (!req.user) return res.status(401).json({ erro: "Não autenticado" });
  const allowed = roles.map(normalizeRole);
  const roleAtual = await carregarTipoUsuarioAtual(req);
  if (!allowed.length || allowed.includes(roleAtual)) return next();
  return res.status(403).json({ erro: "Sem permissão" });
};

exports.authorizeSelfOr = (...roles) => async (req, res, next) => {
  if (!req.user) return res.status(401).json({ erro: "Não autenticado" });

  const userIdToken = Number(req.user.id);
  const userIdParam = Number(req.params.id);
  const isSelf = Number.isFinite(userIdToken) && Number.isFinite(userIdParam) && userIdToken === userIdParam;
  const allowed = roles.map(normalizeRole);
  const roleAtual = await carregarTipoUsuarioAtual(req);
  const hasRole = allowed.includes(roleAtual);

  if (isSelf || hasRole) return next();
  return res.status(403).json({ erro: "Sem permissão" });
};
