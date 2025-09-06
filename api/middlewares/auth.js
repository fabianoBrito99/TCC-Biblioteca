const jwt = require("jsonwebtoken");

function getTokenFrom(req) {
  const auth = req.headers.authorization || "";
  if (auth.startsWith("Bearer ")) return auth.slice(7);
  return null; // se quiser, aqui poderia buscar cookie: req.cookies?.token
}

exports.auth = (req, res, next) => {
  const token = getTokenFrom(req);
  if (!token) return res.status(401).json({ erro: "Token ausente" });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; // { id, nome_login, tipo_usuario, iat, exp }
    next();
  } catch {
    return res.status(401).json({ erro: "Token inválido ou expirado" });
  }
};

exports.authorize = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ erro: "Não autenticado" });
  if (!roles.length || roles.includes(req.user.tipo_usuario)) return next();
  return res.status(403).json({ erro: "Sem permissão" });
};
