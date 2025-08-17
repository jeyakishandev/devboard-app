// Petit shim au cas où l'IDE ne résout pas les types @types/...
declare module "multer" {
  import { Request } from "express";
  import { Readable } from "stream";
  export type FileFilterCallback = (error: Error | null, acceptFile?: boolean) => void;

  export interface MulterFile {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    size: number;
    destination: string;
    filename: string;
    path: string;
    buffer: Buffer;
    stream: Readable;
  }

  export interface DiskStorageOptions {
    destination?: string | ((req: Request, file: MulterFile, cb: (err: Error | null, dest: string) => void) => void);
    filename?: (req: Request, file: MulterFile, cb: (err: Error | null, filename: string) => void) => void;
  }

  interface MulterNamespace {
    (options?: any): any;
    diskStorage(options: DiskStorageOptions): any;
  }

  const multer: MulterNamespace;
  export default multer;
}

declare module "mime-types" {
  export function lookup(path: string): string | false;
  export function extension(mimeType: string): string | false;
  const _default: {
    lookup: typeof lookup;
    extension: typeof extension;
  };
  export default _default;
}
