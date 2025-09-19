import { parseGIF, decompressFrames } from "gifuct-js";
import { GIFEncoder, quantize, applyPalette, Palette } from "gifenc";
import JSZip from "jszip";

export type GifConvertibleFormat = "png" | "jpeg" | "jpg" | "webp";

export interface GifFrame {
  imageData: ImageData;
  delay: number; // milliseconds
}

export interface DecodedGif {
  width: number;
  height: number;
  frames: GifFrame[];
  duration: number;
}

export interface GifZipOptions {
  format: GifConvertibleFormat;
  quality: number; // 1-100
  scale: number; // 0.1 - 1
  baseName: string;
}

export interface GifEncodeOptions {
  fps: number;
  loop?: boolean;
  maxColors?: number;
  useGlobalPalette?: boolean;
}

export const GIF_MIME_TYPE = "image/gif";

const MIME_MAP: Record<GifConvertibleFormat, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
};

const DEFAULT_DELAY = 100; // ms
const MAX_COLORS = 256;

export const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const canvasPool: HTMLCanvasElement[] = [];

function getCanvas(width: number, height: number) {
  const canvas =
    canvasPool.pop() || (typeof document !== "undefined" ? document.createElement("canvas") : null);
  if (!canvas) {
    throw new Error("当前环境不支持 Canvas 渲染");
  }
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function releaseCanvas(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  canvasPool.push(canvas);
}

function cloneImageData(imageData: ImageData): ImageData {
  return new ImageData(new Uint8ClampedArray(imageData.data), imageData.width, imageData.height);
}

function hasTransparency(imageData: ImageData): boolean {
  const { data } = imageData;
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] < 255) {
      return true;
    }
  }
  return false;
}

export async function decodeGifFile(file: File): Promise<DecodedGif> {
  const buffer = await file.arrayBuffer();
  const parsed = parseGIF(buffer);
  const frames = decompressFrames(parsed, true);

  const width = parsed.lsd.width;
  const height = parsed.lsd.height;

  const canvas = getCanvas(width, height);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    releaseCanvas(canvas);
    throw new Error("无法获取 Canvas 上下文");
  }

  let previousImageData: ImageData | null = null;
  const composedFrames: GifFrame[] = [];
  let totalDuration = 0;

  for (const frame of frames) {
    const delay = frame.delay ?? DEFAULT_DELAY;

    if (frame.disposalType === 2) {
      ctx.clearRect(frame.dims.left, frame.dims.top, frame.dims.width, frame.dims.height);
    } else if (frame.disposalType === 3 && previousImageData) {
      ctx.putImageData(previousImageData, 0, 0);
    }

    const patchImageData = ctx.createImageData(frame.dims.width, frame.dims.height);
    patchImageData.data.set(frame.patch);
    ctx.putImageData(patchImageData, frame.dims.left, frame.dims.top);

    const snapshot = ctx.getImageData(0, 0, width, height);
    composedFrames.push({ imageData: cloneImageData(snapshot), delay });
    totalDuration += delay;

    if (frame.disposalType === 2) {
      ctx.clearRect(frame.dims.left, frame.dims.top, frame.dims.width, frame.dims.height);
    } else if (frame.disposalType === 3 && previousImageData) {
      ctx.putImageData(previousImageData, 0, 0);
    } else {
      previousImageData = cloneImageData(snapshot);
    }
  }

  releaseCanvas(canvas);

  return {
    width,
    height,
    frames: composedFrames,
    duration: totalDuration,
  };
}

export function scaleImageData(imageData: ImageData, scale: number): ImageData {
  if (scale === 1) return cloneImageData(imageData);

  const targetWidth = Math.max(1, Math.round(imageData.width * scale));
  const targetHeight = Math.max(1, Math.round(imageData.height * scale));

  const sourceCanvas = getCanvas(imageData.width, imageData.height);
  const sourceCtx = sourceCanvas.getContext("2d");
  if (!sourceCtx) {
    releaseCanvas(sourceCanvas);
    throw new Error("无法创建源 Canvas 上下文");
  }
  sourceCtx.putImageData(imageData, 0, 0);

  const targetCanvas = getCanvas(targetWidth, targetHeight);
  const targetCtx = targetCanvas.getContext("2d");
  if (!targetCtx) {
    releaseCanvas(sourceCanvas);
    releaseCanvas(targetCanvas);
    throw new Error("无法创建目标 Canvas 上下文");
  }

  targetCtx.drawImage(sourceCanvas, 0, 0, targetWidth, targetHeight);
  const scaled = targetCtx.getImageData(0, 0, targetWidth, targetHeight);

  releaseCanvas(sourceCanvas);
  releaseCanvas(targetCanvas);

  return scaled;
}

async function imageDataToBlob(
  imageData: ImageData,
  format: GifConvertibleFormat,
  quality: number,
): Promise<Blob> {
  const canvas = getCanvas(imageData.width, imageData.height);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    releaseCanvas(canvas);
    throw new Error("无法创建 Canvas 上下文");
  }

  ctx.putImageData(imageData, 0, 0);

  const mime = MIME_MAP[format];
  const normalizedQuality = clamp(quality / 100, 0.05, 1);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (!result) {
          reject(new Error("生成图片失败"));
          return;
        }
        resolve(result);
      },
      mime,
      format === "png" ? undefined : normalizedQuality,
    );
  });

  releaseCanvas(canvas);

  return blob;
}

export async function convertGifToZip(
  decoded: DecodedGif,
  options: GifZipOptions,
): Promise<{ blob: Blob; files: number }> {
  const { format, quality, scale, baseName } = options;
  const zip = new JSZip();

  for (let index = 0; index < decoded.frames.length; index += 1) {
    const frame = decoded.frames[index];
    const scaled = scaleImageData(frame.imageData, scale);
    const blob = await imageDataToBlob(scaled, format, quality);
    const ext = format === "jpeg" ? "jpg" : format;
    const fileName = `${baseName}-frame-${(index + 1).toString().padStart(3, "0")}.${ext}`;
    zip.file(fileName, blob);
  }

  const zipBlob = await zip.generateAsync({ type: "blob" });
  return { blob: zipBlob, files: decoded.frames.length };
}

export function normaliseFps(fps: number) {
  return clamp(Math.round(fps), 1, 60);
}

function collectPaletteSource(frames: ImageData[]): Uint8Array {
  if (frames.length === 1) {
    return new Uint8Array(frames[0].data);
  }
  const totalLength = frames.reduce((acc, frame) => acc + frame.data.length, 0);
  const merged = new Uint8Array(totalLength);
  let offset = 0;
  for (const frame of frames) {
    merged.set(frame.data, offset);
    offset += frame.data.length;
  }
  return merged;
}

function buildFrameOptions(
  params: {
    delay: number;
    index: number;
    hasAlpha: boolean;
    palette: Palette;
    globalPalette: Palette | null;
    loop?: boolean;
    transparentIndex?: number;
  },
) {
  const { delay, index, hasAlpha, palette, globalPalette, loop, transparentIndex } = params;
  const effectiveTransparentIndex =
    typeof transparentIndex === "number" ? transparentIndex : undefined;
  const hasTransparent = typeof effectiveTransparentIndex === "number";
  return {
    delay,
    repeat: index === 0 ? (loop === false ? -1 : 0) : undefined,
    transparent: hasTransparent,
    transparentIndex: effectiveTransparentIndex,
    dispose: hasTransparent ? 1 : 0,
    palette: globalPalette ? (index === 0 ? globalPalette : undefined) : palette,
  } as const;
}

function findTransparentIndex(palette: Palette | null) {
  if (!palette) return undefined;
  for (let i = 0; i < palette.length; i += 1) {
    const color = palette[i];
    if (color && color.length >= 4 && color[3] === 0) {
      return i;
    }
  }
  return undefined;
}

export async function encodeGifFromFrames(
  frames: GifFrame[],
  options: GifEncodeOptions,
): Promise<Blob> {
  if (!frames.length) {
    throw new Error("至少需要一帧图像来生成 GIF");
  }

  const fps = normaliseFps(options.fps);
  const fallbackDelay = Math.round(1000 / fps);
  const width = frames[0].imageData.width;
  const height = frames[0].imageData.height;

  const encoder = GIFEncoder();
  const maxColors = clamp(options.maxColors ?? MAX_COLORS, 2, MAX_COLORS);

  const hasAlpha = frames.some((frame) => hasTransparency(frame.imageData));
  const quantizeFormat = hasAlpha ? "rgba4444" : "rgb565";

  const paletteSource = options.useGlobalPalette
    ? collectPaletteSource(frames.map((frame) => frame.imageData))
    : undefined;

  const globalPalette = paletteSource
    ? quantize(paletteSource, maxColors, {
        format: quantizeFormat,
        clearAlpha: true,
        clearAlphaThreshold: 5,
        oneBitAlpha: hasAlpha,
      })
    : null;
  const globalTransparentIndex = findTransparentIndex(globalPalette);

  frames.forEach((frame, index) => {
    const rgba = frame.imageData.data;
    const palette =
      globalPalette ??
      quantize(rgba, maxColors, {
        format: quantizeFormat,
        clearAlpha: true,
        clearAlphaThreshold: 5,
        oneBitAlpha: hasAlpha,
      });

    const indexed = applyPalette(rgba, palette, quantizeFormat);
    const frameTransparentIndex =
      globalPalette && typeof globalTransparentIndex === "number"
        ? globalTransparentIndex
        : findTransparentIndex(palette);

    const frameOptions = buildFrameOptions({
      delay: frame.delay ?? fallbackDelay,
      index,
      hasAlpha,
      palette,
      globalPalette,
      loop: options.loop,
      transparentIndex: frameTransparentIndex,
    });

    encoder.writeFrame(indexed, width, height, frameOptions);
  });

  encoder.finish();
  const bytes = encoder.bytes();
  return new Blob([bytes], { type: GIF_MIME_TYPE });
}

function fitImageDataToCanvas(
  imageData: ImageData,
  targetWidth: number,
  targetHeight: number,
): ImageData {
  const tempCanvas = getCanvas(imageData.width, imageData.height);
  const tempCtx = tempCanvas.getContext("2d");
  if (!tempCtx) {
    releaseCanvas(tempCanvas);
    throw new Error("无法创建临时 Canvas 上下文");
  }
  tempCtx.putImageData(imageData, 0, 0);

  const canvas = getCanvas(targetWidth, targetHeight);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    releaseCanvas(tempCanvas);
    releaseCanvas(canvas);
    throw new Error("无法创建 Canvas 上下文");
  }

  ctx.clearRect(0, 0, targetWidth, targetHeight);
  const scale = Math.min(targetWidth / imageData.width, targetHeight / imageData.height);
  const drawWidth = Math.max(1, Math.round(imageData.width * scale));
  const drawHeight = Math.max(1, Math.round(imageData.height * scale));
  const offsetX = Math.floor((targetWidth - drawWidth) / 2);
  const offsetY = Math.floor((targetHeight - drawHeight) / 2);

  ctx.drawImage(tempCanvas, offsetX, offsetY, drawWidth, drawHeight);

  const result = ctx.getImageData(0, 0, targetWidth, targetHeight);

  releaseCanvas(tempCanvas);
  releaseCanvas(canvas);

  return result;
}

async function loadImageDataFromFile(
  file: File,
  scale: number,
): Promise<ImageData> {
  const objectUrl = URL.createObjectURL(file);
  return new Promise<ImageData>((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const targetWidth = Math.max(1, Math.round(img.width * scale));
        const targetHeight = Math.max(1, Math.round(img.height * scale));
        const canvas = getCanvas(targetWidth, targetHeight);
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          releaseCanvas(canvas);
          reject(new Error("无法创建 Canvas 上下文"));
          return;
        }
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
        const data = ctx.getImageData(0, 0, targetWidth, targetHeight);
        releaseCanvas(canvas);
        resolve(data);
      } catch (error) {
        reject(error);
      } finally {
        URL.revokeObjectURL(objectUrl);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("加载图片失败"));
    };
    img.src = objectUrl;
  });
}

export async function imageFilesToFrames(
  files: File[],
  options: { scale: number; fps: number },
): Promise<GifFrame[]> {
  const frames: GifFrame[] = [];
  const fps = normaliseFps(options.fps);
  const delay = Math.round(1000 / fps);

  if (!files.length) {
    return frames;
  }

  const firstImageData = await loadImageDataFromFile(files[0], options.scale);
  frames.push({ imageData: firstImageData, delay });
  const targetWidth = firstImageData.width;
  const targetHeight = firstImageData.height;

  for (const file of files.slice(1)) {
    const imageData = await loadImageDataFromFile(file, options.scale);
    const normalized =
      imageData.width === targetWidth && imageData.height === targetHeight
        ? imageData
        : fitImageDataToCanvas(imageData, targetWidth, targetHeight);
    frames.push({ imageData: normalized, delay });
  }

  return frames;
}

export async function mergeGifFiles(
  files: File[],
  options: { fps: number; scale: number; loop?: boolean; maxColors?: number },
): Promise<{ blob: Blob; width: number; height: number; frameCount: number }> {
  if (!files.length) {
    throw new Error("请先选择需要合并的 GIF 文件");
  }

  const decodedList = await Promise.all(files.map((file) => decodeGifFile(file)));
  const scale = clamp(options.scale, 0.1, 1);

  const targetWidth =
    Math.max(...decodedList.map((item) => Math.round(item.width * scale))) ||
    Math.round(decodedList[0].width * scale);
  const targetHeight =
    Math.max(...decodedList.map((item) => Math.round(item.height * scale))) ||
    Math.round(decodedList[0].height * scale);

  const width = Math.max(1, targetWidth);
  const height = Math.max(1, targetHeight);

  const mergedFrames: GifFrame[] = [];

  for (const decoded of decodedList) {
    for (const frame of decoded.frames) {
      const scaled = scaleImageData(frame.imageData, scale);
      const normalized = fitImageDataToCanvas(scaled, width, height);
      mergedFrames.push({ imageData: normalized, delay: frame.delay });
    }
  }

  const blob = await encodeGifFromFrames(mergedFrames, {
    fps: options.fps,
    loop: options.loop,
    maxColors: options.maxColors,
    useGlobalPalette: true,
  });

  return {
    blob,
    width,
    height,
    frameCount: mergedFrames.length,
  };
}

export function suggestBaseName(name: string, suffix: string) {
  const base = name.replace(/\.[^.]+$/, "");
  return `${base}-${suffix}`;
}
