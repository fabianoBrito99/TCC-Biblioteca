const BLOCKED_KEYS = new Set(["__proto__", "prototype", "constructor"]);
const MAX_STRING_LENGTH = 5000;
const MAX_PROFILE_PHOTO_LENGTH = 3 * 1024 * 1024;
const MAX_DEPTH = 8;

function securityHeaders(req, res, next) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "same-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("Cache-Control", "no-store");
  next();
}

function assertSafeValue(value, depth = 0, path = "") {
  if (depth > MAX_DEPTH) {
    const error = new Error("Payload muito profundo");
    error.statusCode = 400;
    throw error;
  }

  const maxStringLength =
    path === "body.foto_usuario"
      ? MAX_PROFILE_PHOTO_LENGTH
      : MAX_STRING_LENGTH;

  if (typeof value === "string" && value.length > maxStringLength) {
    const error = new Error(
      path === "body.foto_usuario" ? "Foto muito grande" : "Texto muito longo"
    );
    error.statusCode = 413;
    throw error;
  }

  if (!value || typeof value !== "object") return;

  if (Array.isArray(value)) {
    if (value.length > 500) {
      const error = new Error("Lista muito grande");
      error.statusCode = 413;
      throw error;
    }
    value.forEach((item, index) =>
      assertSafeValue(item, depth + 1, `${path}.${index}`)
    );
    return;
  }

  for (const key of Object.keys(value)) {
    if (BLOCKED_KEYS.has(key)) {
      const error = new Error("Campo invalido");
      error.statusCode = 400;
      throw error;
    }
    assertSafeValue(value[key], depth + 1, path ? `${path}.${key}` : key);
  }
}

function validateRequestShape(req, res, next) {
  try {
    assertSafeValue(req.body, 0, "body");
    assertSafeValue(req.query, 0, "query");
    assertSafeValue(req.params, 0, "params");
    next();
  } catch (error) {
    res.status(error.statusCode || 400).json({ erro: error.message || "Requisicao invalida" });
  }
}

function requireJwtSecret() {
  const secret = process.env.JWT_SECRET || "";
  if (secret.length < 32) {
    throw new Error("JWT_SECRET ausente ou fraco. Configure um segredo com pelo menos 32 caracteres.");
  }
}

module.exports = {
  securityHeaders,
  validateRequestShape,
  requireJwtSecret,
};
