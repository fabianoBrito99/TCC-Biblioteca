const buckets = new Map();

function limparExpirados(agora) {
  for (const [chave, bucket] of buckets.entries()) {
    if (bucket.resetAt <= agora) {
      buckets.delete(chave);
    }
  }
}

function createRateLimit({
  windowMs = 60_000,
  maxRequests = 120,
  keyPrefix = "global",
} = {}) {
  return function rateLimitMiddleware(req, res, next) {
    const agora = Date.now();
    limparExpirados(agora);

    const ip = req.headers["x-forwarded-for"]?.toString().split(",")[0].trim() || req.ip || "unknown";
    const chave = `${keyPrefix}:${ip}`;
    const existente = buckets.get(chave);

    if (!existente || existente.resetAt <= agora) {
      buckets.set(chave, { count: 1, resetAt: agora + windowMs });
      return next();
    }

    if (existente.count >= maxRequests) {
      const segundosRestantes = Math.ceil((existente.resetAt - agora) / 1000);
      res.setHeader("Retry-After", String(Math.max(1, segundosRestantes)));
      return res.status(429).json({
        erro: "Muitas requisições. Tente novamente em instantes.",
      });
    }

    existente.count += 1;
    return next();
  };
}

module.exports = { createRateLimit };
