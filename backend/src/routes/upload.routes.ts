import { Router, type Request, type Response, type NextFunction } from "express";
import multer from "multer"; // import défaut, pas de namespace
import fs from "fs";
import path from "path";
import mime from "mime-types";
import { auth } from "../middleware/auth";

const router = Router();

// Dossier uploads
const UP = path.join(__dirname, "..", "..", "uploads");
if (!fs.existsSync(UP)) fs.mkdirSync(UP, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb: (err: Error | null, dest: string) => void) => cb(null, UP),
  filename: (_req, file: Express.Multer.File, cb: (err: Error | null, filename: string) => void) => {
    const ext = String(mime.extension(file.mimetype) || "bin");
    const name = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    cb(null, `${name}.${ext}`);
  },
});

// fileFilter typé explicitement (pas de types multer “namespace”)
const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: (error: Error | null, acceptFile?: boolean) => void
) => {
  const ok = /^(image\/|application\/pdf|text\/plain)/i.test(file.mimetype);
  cb(ok ? null : new Error("type non supporté (images/pdf/txt)"));
};

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 Mo
});

// POST /api/uploads (inchangé)
router.post("/", auth(true), (req: Request, res: Response, next: NextFunction) => {
  const single = upload.single("file");
  single(req, res, (err?: any) => {
    if (err) return next(err);

    const f = req.file as Express.Multer.File | undefined;
    if (!f) return res.status(400).json({ success: false, error: "Aucun fichier" });

    const relativeUrl = `/uploads/${f.filename}`;
    const base = process.env.APP_URL || `http://localhost:${process.env.PORT || 3000}`;
    const absoluteUrl = `${base}${relativeUrl}`;

    return res.status(201).json({
      success: true,
      data: {
        url: absoluteUrl,
        relativeUrl,
        mimetype: f.mimetype,
        size: f.size,
        filename: f.originalname,
      },
    });
  });
});

// Handler d'erreurs (garde le message clair)
router.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  if (err && typeof err === "object") {
    if ((err as any).code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({ success: false, error: "Fichier trop volumineux (>10Mo)" });
    }
    return res.status(400).json({ success: false, error: err.message || "Upload error" });
  }
  return res.status(400).json({ success: false, error: "Upload error" });
});

export default router;
