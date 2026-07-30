import JSZip from "jszip";
import { describe, expect, it } from "vitest";
import { createBatchWatermarkZip } from "./batch-watermark";
import { createWatermarkConfig } from "./watermark";

describe("桌面批量文字水印 ZIP", () => {
  it("按选择顺序应用同一配置，并为同名水印图片编号", async () => {
    const files = [
      new File(["first"], "旅行.png", { type: "image/png" }),
      new File(["second"], "旅行.jpg", { type: "image/jpeg" }),
      new File(["third"], "收据.png", { type: "image/png" }),
    ];
    const config = { ...createWatermarkConfig(), position: { x: 0.25, y: 0.75 } };
    const appliedConfigs: unknown[] = [];
    const zip = await JSZip.loadAsync(await createBatchWatermarkZip(files, "image/webp", config, async (file, receivedConfig) => {
      appliedConfigs.push(receivedConfig);
      return new TextEncoder().encode(`watermarked:${file.name}`);
    }));

    expect(Object.keys(zip.files)).toEqual(["旅行-watermarked.webp", "旅行-watermarked-2.webp", "收据-watermarked.webp"]);
    expect(appliedConfigs).toEqual([config, config, config]);
    await expect(zip.file("旅行-watermarked-2.webp")!.async("string")).resolves.toBe("watermarked:旅行.jpg");
  });

  it("按选择顺序导出一图一水印 PDF", async () => {
    const files = [
      new File(["first"], "Photo.png", { type: "image/png" }),
      new File(["second"], "photo.jpg", { type: "image/jpeg" }),
    ];
    const zip = await JSZip.loadAsync(await createBatchWatermarkZip(files, "application/pdf", createWatermarkConfig(), async (file) => new TextEncoder().encode(`PDF:${file.name}`)));

    expect(Object.keys(zip.files)).toEqual(["Photo-watermarked.pdf", "photo-watermarked-2.pdf"]);
    await expect(zip.file("Photo-watermarked.pdf")!.async("string")).resolves.toBe("PDF:Photo.png");
  });
});
