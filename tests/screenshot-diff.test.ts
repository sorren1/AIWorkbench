import { PNG } from "pngjs";
import { describe, expect, it } from "vitest";

import {
  isAcceptableScreenshotDifference,
  MAX_ANTIALIAS_CHANNEL_DELTA,
  MAX_ANTIALIAS_PIXELS,
  pixelDifference,
} from "../scripts/screenshot-diff";

function png(width: number, height: number, changedPixels = 0, channelDelta = 0): Uint8Array {
  const image = new PNG({ width, height });
  image.data.fill(255);
  for (let index = 0; index < changedPixels; index += 1) {
    image.data[index * 4] = 255 - channelDelta;
  }
  return PNG.sync.write(image);
}

describe("canonical screenshot difference policy", () => {
  it("accepts only bounded SVG edge antialiasing variance", () => {
    const expected = png(MAX_ANTIALIAS_PIXELS, 1);
    const actual = png(MAX_ANTIALIAS_PIXELS, 1, MAX_ANTIALIAS_PIXELS, MAX_ANTIALIAS_CHANNEL_DELTA);

    expect(isAcceptableScreenshotDifference(pixelDifference(expected, actual))).toBe(true);
  });

  it("rejects a larger changed region", () => {
    const expected = png(MAX_ANTIALIAS_PIXELS + 1, 1);
    const actual = png(
      MAX_ANTIALIAS_PIXELS + 1,
      1,
      MAX_ANTIALIAS_PIXELS + 1,
      MAX_ANTIALIAS_CHANNEL_DELTA,
    );

    expect(isAcceptableScreenshotDifference(pixelDifference(expected, actual))).toBe(false);
  });

  it("rejects a material channel change and dimension mismatch", () => {
    expect(
      isAcceptableScreenshotDifference(
        pixelDifference(png(1, 1), png(1, 1, 1, MAX_ANTIALIAS_CHANNEL_DELTA + 1)),
      ),
    ).toBe(false);
    expect(isAcceptableScreenshotDifference(pixelDifference(png(1, 1), png(2, 1)))).toBe(false);
  });
});
