import { expect, test, type Page } from "@playwright/test";
import JSZip from "jszip";
import { PDFDocument } from "pdf-lib";

const fixture = "e2e/fixtures/sample.svg";

async function downloadZip(page: Page, buttonName: string) {
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: buttonName }).click();
  const download = await downloadPromise;
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream!) chunks.push(chunk);
  return { download, zip: await JSZip.loadAsync(Buffer.concat(chunks)) };
}

async function downloadWatermark(page: Page, buttonName: string) {
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: buttonName }).click();
  return downloadPromise;
}

test("桌面用户可下载批量水印图片与一图一 PDF ZIP", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "桌面端专属场景");
  await page.goto("/");
  await page.getByLabel("选择源图片").setInputFiles([fixture, fixture]);
  await page.getByLabel("水印文字").fill("内部使用");

  for (const [buttonName, zipName, extension, magic] of [
    ["下载批量水印 PNG ZIP", "文字水印-PNG-批量导出.zip", "png", [0x89, 0x50, 0x4e, 0x47]],
    ["下载批量水印 JPEG ZIP", "文字水印-JPEG-批量导出.zip", "jpg", [0xff, 0xd8]],
    ["下载批量水印 WebP ZIP", "文字水印-WEBP-批量导出.zip", "webp", [0x52, 0x49, 0x46, 0x46]],
  ] as const) {
    const imageDownload = await downloadZip(page, buttonName);
    expect(imageDownload.download.suggestedFilename()).toBe(zipName);
    const filenames = [`sample-watermarked.${extension}`, `sample-watermarked-2.${extension}`];
    expect(Object.keys(imageDownload.zip.files)).toEqual(filenames);
    expect(Array.from((await imageDownload.zip.file(filenames[0])!.async("uint8array")).slice(0, magic.length))).toEqual(magic);
  }

  const pdfDownload = await downloadZip(page, "下载批量水印 PDF ZIP");
  expect(pdfDownload.download.suggestedFilename()).toBe("文字水印-PDF-批量导出.zip");
  const pdfZip = pdfDownload.zip;
  expect(Object.keys(pdfZip.files)).toEqual(["sample-watermarked.pdf", "sample-watermarked-2.pdf"]);
  for (const filename of Object.keys(pdfZip.files)) {
    expect((await PDFDocument.load(await pdfZip.file(filename)!.async("uint8array"))).getPageCount()).toBe(1);
  }
});

test("移动端保持单图水印导出", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "移动端专属场景");
  await page.goto("/");
  await page.getByLabel("选择源图片").setInputFiles(fixture);
  for (const [buttonName, filename] of [["下载水印 PNG", "sample-watermarked.png"], ["下载水印 JPEG", "sample-watermarked.jpg"], ["下载水印 WebP", "sample-watermarked.webp"], ["下载水印 PDF", "sample-watermarked.pdf"]]) {
    expect((await downloadWatermark(page, buttonName)).suggestedFilename()).toBe(filename);
  }
  await expect(page.getByRole("button", { name: /下载批量水印/ })).toHaveCount(0);
});
