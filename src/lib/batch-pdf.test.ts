import JSZip from "jszip";
import { describe, expect, it } from "vitest";
import { createBatchOriginalPdfZip } from "./batch-pdf";

describe("桌面批量原图 PDF ZIP", () => {
  it("按选择顺序写入独立 PDF，并为重复基础名编号", async () => {
    const files = [
      new File(["first"], "旅行.png", { type: "image/png" }),
      new File(["second"], "旅行.jpg", { type: "image/jpeg" }),
      new File(["third"], "收据.png", { type: "image/png" }),
    ];
    const created = await createBatchOriginalPdfZip(files, async (file) => new TextEncoder().encode(`PDF:${file.name}`));
    const zip = await JSZip.loadAsync(created);

    expect(Object.keys(zip.files)).toEqual(["旅行.pdf", "旅行-2.pdf", "收据.pdf"]);
    await expect(zip.file("旅行.pdf")!.async("string")).resolves.toBe("PDF:旅行.png");
    await expect(zip.file("旅行-2.pdf")!.async("string")).resolves.toBe("PDF:旅行.jpg");
    await expect(zip.file("收据.pdf")!.async("string")).resolves.toBe("PDF:收据.png");
  });

  it("按大小写不敏感规则为冲突基础名编号", async () => {
    const files = [
      new File(["first"], "Photo.png", { type: "image/png" }),
      new File(["second"], "photo.jpg", { type: "image/jpeg" }),
    ];

    const zip = await JSZip.loadAsync(await createBatchOriginalPdfZip(files, async () => new Uint8Array()));

    expect(Object.keys(zip.files)).toEqual(["Photo.pdf", "photo-2.pdf"]);
  });
});
