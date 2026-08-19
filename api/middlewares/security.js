const BLOCKED_KEYS = new Set(["__proto__", "prototype", "constructor"]);
const MAX_STRING_LENGTH = 5000;
const MAX_DEPTH = 8;

function securityHeaders(req, res, next) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "same-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("Cache-Control", "no-store");
  next();
}

function assertSafeValue(value, depth = 0) {
  if (depth > MAX_DEPTH) {
    const error = new Error("Payload muito profundo");
    error.statusCode = 400;
    throw error;
  }

  if (typeof value === "string" && value.length > MAX_STRING_LENGTH) {
    const error = new Error("Texto muito longo");
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
    value.forEach((item) => assertSafeValue(item, depth + 1));
    return;
  }

  for (const key of Object.keys(value)) {
    if (BLOCKED_KEYS.has(key)) {
      const error = new Error("Campo invalido");
      error.statusCode = 400;
      throw error;
    }
    assertSafeValue(value[key], depth + 1);
  }
}

function validateRequestShape(req, res, next) {
  try {
    assertSafeValue(req.body);
    assertSafeValue(req.query);
    assertSafeValue(req.params);
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
