declare module "gifuct-js" {
  interface FrameDimensions {
    top: number;
    left: number;
    width: number;
    height: number;
  }

  interface DecompressedFrame {
    pixels: number[];
    dims: FrameDimensions;
    delay?: number;
    disposalType?: number;
    colorTable: number[][];
    transparentIndex?: number;
    patch: Uint8ClampedArray;
  }

  interface ParsedGif {
    lsd: {
      width: number;
      height: number;
    };
    gct: number[][];
    frames: Array<any>;
  }

  export function parseGIF(buffer: ArrayBuffer): ParsedGif;
  export function decompressFrames(
    gif: ParsedGif,
    buildImagePatch: boolean,
  ): DecompressedFrame[];
}

declare module "gifenc" {
  export type Palette = Array<number[]>;

  export interface QuantizeOptions {
    format?: "rgb565" | "rgb444" | "rgba4444";
    clearAlpha?: boolean;
    clearAlphaColor?: number;
    clearAlphaThreshold?: number;
    oneBitAlpha?: boolean | number;
  }

  export function quantize(
    rgba: Uint8Array | Uint8ClampedArray,
    maxColors: number,
    options?: QuantizeOptions,
  ): Palette;

  export function applyPalette(
    rgba: Uint8Array | Uint8ClampedArray,
    palette: Palette,
    format?: "rgb565" | "rgb444" | "rgba4444",
  ): Uint8Array;

  export interface FrameOptions {
    palette?: Palette;
    delay?: number;
    repeat?: number;
    transparent?: boolean;
    transparentIndex?: number;
    dispose?: number;
  }

  export interface GifEncoderInstance {
    writeFrame(
      indexBitmap: Uint8Array,
      width: number,
      height: number,
      options?: FrameOptions,
    ): void;
    finish(): void;
    bytes(): Uint8Array;
    reset(): void;
  }

  export interface GifEncoderOptions {
    initialCapacity?: number;
    auto?: boolean;
  }

  export function GIFEncoder(options?: GifEncoderOptions): GifEncoderInstance;
  export const defaultExport: typeof GIFEncoder;
  export default defaultExport;
}
