import { expect, test } from "@playwright/test";
import { PDFDocument } from "pdf-lib";

const fixture = "e2e/fixtures/sample.svg";

test("桌面用户可选择单张源图片、预览并下载无白边 PDF", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "桌面端专属场景");
  await page.goto("/");
  await page.getByLabel("选择源图片").setInputFiles(fixture);

  await expect(page.getByRole("img", { name: "源图片预览" })).toBeVisible();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "下载原图 PDF" }).click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toBe("sample.pdf");
  const bytes = await download.createReadStream().then(async (stream) => {
    const chunks: Buffer[] = [];
    for await (const chunk of stream!) chunks.push(chunk);
    return Buffer.concat(chunks);
  });
  const pdf = await PDFDocument.load(bytes);
  expect(pdf.getPageCount()).toBe(1);
  const { width, height } = pdf.getPage(0).getSize();
  expect(width / height).toBeCloseTo(1.5, 4);
});

test("移动端只允许一张源图片且提供 PDF 导出", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "移动端专属场景");
  await page.goto("/");
  await page.getByLabel("选择源图片").setInputFiles(fixture);

  await expect(page.getByText("移动端仅支持单图导出")).toBeVisible();
  await expect(page.getByRole("img", { name: "源图片预览" })).toBeVisible();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "下载原图 PDF" }).click();
  expect((await downloadPromise).suggestedFilename()).toBe("sample.pdf");
});

test("桌面与移动端拒绝动图并说明限制", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("选择源图片").setInputFiles({
    name: "motion.gif",
    mimeType: "image/gif",
    buffer: Buffer.from("GIF89a"),
  });
  await expect(page.getByRole("alert")).toHaveText("不支持动图");
  await expect(page.getByRole("img", { name: "源图片预览" })).not.toBeVisible();
});
