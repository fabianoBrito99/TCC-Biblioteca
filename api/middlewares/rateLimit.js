const buckets = new Map();

function defaultKey(req) {
  const auth = req.headers.authorization || "";
  const ip = req.headers["x-forwarded-for"]?.toString().split(",")[0].trim() || req.ip || "unknown";
  if (auth.startsWith("Bearer ")) {
    return `token:${auth.slice(7, 23)}`;
  }
  return `ip:${ip}`;
}

function limparExpirados(agora) {
  for (const [chave, bucket] of buckets.entries()) {
    if (bucket.resetAt <= agora && bucket.inFlight <= 0) {
      buckets.delete(chave);
    }
  }
}

function createRateLimit({
  windowMs = 60_000,
  maxRequests = 120,
  maxConcurrent = 20,
  keyPrefix = "global",
  keyGenerator = defaultKey,
} = {}) {
  return function rateLimitMiddleware(req, res, next) {
    if (req.method === "OPTIONS") return next();

    const agora = Date.now();
    limparExpirados(agora);

    const chave = `${keyPrefix}:${keyGenerator(req)}`;
    const existente = buckets.get(chave);

    if (!existente || existente.resetAt <= agora) {
      const bucket = { count: 1, inFlight: 1, resetAt: agora + windowMs };
      buckets.set(chave, bucket);
      res.on("finish", () => {
        bucket.inFlight = Math.max(0, bucket.inFlight - 1);
      });
      return next();
    }

    if (existente.inFlight >= maxConcurrent) {
      res.setHeader("Retry-After", "2");
      return res.status(429).json({
        erro: "Muitas requisições simultâneas. Aguarde e tente novamente.",
      });
    }

    if (existente.count >= maxRequests) {
      const segundosRestantes = Math.ceil((existente.resetAt - agora) / 1000);
      res.setHeader("Retry-After", String(Math.max(1, segundosRestantes)));
      return res.status(429).json({
        erro: "Muitas requisições. Tente novamente em instantes.",
      });
    }

    existente.count += 1;
    existente.inFlight += 1;
    res.on("finish", () => {
      existente.inFlight = Math.max(0, existente.inFlight - 1);
    });
    return next();
  };
}

module.exports = { createRateLimit };
