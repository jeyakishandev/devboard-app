import "multer";

declare global {
  namespace Express {
    // au cas où l'augmentation n'est pas chargée
    interface Request {
      file?: Multer.File;
      files?: Multer.File[] | { [fieldname: string]: Multer.File[] };
    }
  }
}
export {};
