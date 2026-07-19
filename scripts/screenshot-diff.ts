import { PNG } from "pngjs";

export type PixelDifference = {
  readonly differingPixels: number;
  readonly maxChannelDelta: number;
};

export const MAX_ANTIALIAS_PIXELS = 32;
export const MAX_ANTIALIAS_CHANNEL_DELTA = 40;

export function pixelDifference(expected: Uint8Array, actual: Uint8Array): PixelDifference {
  const expectedPng = PNG.sync.read(Buffer.from(expected));
  const actualPng = PNG.sync.read(Buffer.from(actual));
  if (expectedPng.width !== actualPng.width || expectedPng.height !== actualPng.height) {
    return { differingPixels: Number.POSITIVE_INFINITY, maxChannelDelta: 255 };
  }

  let differingPixels = 0;
  let maxChannelDelta = 0;
  for (let offset = 0; offset < expectedPng.data.length; offset += 4) {
    let pixelDelta = 0;
    for (let channel = 0; channel < 4; channel += 1) {
      pixelDelta = Math.max(
        pixelDelta,
        Math.abs(
          (expectedPng.data[offset + channel] ?? 0) - (actualPng.data[offset + channel] ?? 0),
        ),
      );
    }
    if (pixelDelta > 0) differingPixels += 1;
    maxChannelDelta = Math.max(maxChannelDelta, pixelDelta);
  }
  return { differingPixels, maxChannelDelta };
}

export function isAcceptableScreenshotDifference(difference: PixelDifference): boolean {
  return (
    Number.isFinite(difference.differingPixels) &&
    difference.differingPixels <= MAX_ANTIALIAS_PIXELS &&
    difference.maxChannelDelta <= MAX_ANTIALIAS_CHANNEL_DELTA
  );
}
