// backend/src/middlewares/security-lite.ts
import type { NextFunction, Request, Response } from "express";

/**
 * CORS minimal sans dépendance
 * - autorise l'origin déclaré (ou * si vide)
 */
export function corsLite(allowedOrigins: string[] = []) {
  return (req: Request, res: Response, next: NextFunction) => {
    const origin = req.headers.origin as string | undefined;
    const allowAll = allowedOrigins.length === 0 || allowedOrigins.includes("*");
    const allowed =
      allowAll ||
      (origin && allowedOrigins.some((o) => o === origin));

    if (allowed) {
      res.setHeader("Access-Control-Allow-Origin", origin ?? "*");
      res.setHeader("Vary", "Origin");
      res.setHeader("Access-Control-Allow-Credentials", "true");
      res.setHeader(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept, Authorization"
      );
      res.setHeader(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, PATCH, DELETE, OPTIONS"
      );
    }

    if (req.method === "OPTIONS") {
      return res.status(204).end();
    }
    next();
  };
}

/**
 * Quelques headers type "helmet" sans dépendance
 * (CSP volontairement omis pour éviter de casser le front en dev)
 */
export function helmetLite() {
  return (_req: Request, res: Response, next: NextFunction) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("X-XSS-Protection", "0");
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    next();
  };
}

/**
 * Rate limit en mémoire (simple) par IP
 * - windowMs : fenêtre en ms
 * - max : nb req acceptées dans la fenêtre
 */
export function rateLimitLite(opts: { windowMs: number; max: number }) {
  const hits = new Map<
    string,
    { count: number; resetAt: number }
  >();

  return (req: Request, res: Response, next: NextFunction) => {
    const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
               req.socket.remoteAddress ||
               "unknown";
    const now = Date.now();
    const entry = hits.get(ip);

    if (!entry || now > entry.resetAt) {
      hits.set(ip, { count: 1, resetAt: now + opts.windowMs });
      return next();
    }

    if (entry.count >= opts.max) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      res.setHeader("Retry-After", String(retryAfter));
      return res.status(429).json({ success: false, error: "Too many requests" });
    }

    entry.count++;
    next();
  };
}
