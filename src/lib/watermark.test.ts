import { describe, expect, it } from "vitest";
import {
  clampPositionForImage,
  createWatermarkConfig,
  relativePositionToPixels,
  watermarkFitScale,
  watermarkBounds,
  watermarkFilename,
} from "./watermark";

describe("文字水印规则", () => {
  it("限制旋转文字边界留在源图片内", () => {
    const bounds = watermarkBounds({ width: 200, height: 100 }, 40, 45);
    const position = clampPositionForImage({ x: 1, y: 0 }, { width: 200, height: 100 }, 40, 45);

    expect(position.x).toBeCloseTo(1 - bounds.halfWidth / 200);
    expect(position.y).toBeCloseTo(bounds.halfHeight / 100);
  });

  it("保留重复水印预留间距配置", () => {
    expect(createWatermarkConfig().horizontalSpacing).toBeGreaterThan(0);
    expect(createWatermarkConfig().verticalSpacing).toBeGreaterThan(0);
  });

  it("默认使用红色水印", () => {
    expect(createWatermarkConfig().color).toBe("#ff0000");
  });

  it("缩小无法容纳在图片内的旋转文字", () => {
    expect(watermarkFitScale({ width: 100, height: 80 }, 600, 100, 45)).toBeLessThan(1);
  });

  it("按图片格式生成水印导出名", () => {
    expect(watermarkFilename("photo.heic", "image/webp")).toBe("photo-watermarked.webp");
    expect(watermarkFilename("photo.jpg", "application/pdf")).toBe("photo-watermarked.pdf");
  });

  it("将同一相对水印位置映射到不同尺寸的源图片", () => {
    const position = { x: 0.25, y: 0.75 };

    expect(relativePositionToPixels(position, { width: 400, height: 200 })).toEqual({ x: 100, y: 150 });
    expect(relativePositionToPixels(position, { width: 1600, height: 800 })).toEqual({ x: 400, y: 600 });
  });
});
