import { describe, expect, it } from "vitest";
import { createPdfFilename } from "./export-name";

describe("导出命名", () => {
  it("保留源文件基础名并导出为 PDF", () => {
    expect(createPdfFilename("旅行照片.final.jpeg")).toBe("旅行照片.final.pdf");
  });
});
