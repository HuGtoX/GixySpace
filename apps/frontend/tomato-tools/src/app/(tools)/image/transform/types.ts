export type ImageFormat = "jpg" | "jpeg" | "png" | "webp" | "svg";

export interface ImageFile {
  id: string;
  file: File;
  preview: string;
  format: ImageFormat;
  size: number;
  name: string;
  status: "idle" | "processing" | "completed" | "error";
  result?: {
    preview: string;
    blob?: Blob;
    format: ImageFormat;
    size: number;
  };
  error?: string;
}

export interface ConversionSettings {
  format: ImageFormat;
  quality: number;
  removeBackground: boolean;
  preserveExif: boolean;
}
