import { expect, test } from "@playwright/test";
import JSZip from "jszip";
import { PDFDocument } from "pdf-lib";

const fixture = "e2e/fixtures/sample.svg";

test("桌面用户可多选、切换缩略图并下载一图一 PDF ZIP", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "桌面端专属场景");
  await page.goto("/");
  await page.getByLabel("选择源图片").setInputFiles([fixture, fixture]);

  await expect(page.getByRole("button", { name: "sample.svg" })).toHaveCount(2);
  await page.getByRole("button", { name: "sample.svg" }).nth(1).click();
  await expect(page.getByText("当前预览：sample.svg（2 / 2）")).toBeVisible();

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "下载批量原图 PDF ZIP" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("原图-PDF-批量导出.zip");
  const zip = await JSZip.loadAsync(await download.createReadStream().then(async (stream) => {
    const chunks: Buffer[] = [];
    for await (const chunk of stream!) chunks.push(chunk);
    return Buffer.concat(chunks);
  }));
  expect(Object.keys(zip.files)).toEqual(["sample.pdf", "sample-2.pdf"]);
  for (const filename of ["sample.pdf", "sample-2.pdf"]) {
    const pdf = await PDFDocument.load(await zip.file(filename)!.async("uint8array"));
    expect(pdf.getPageCount()).toBe(1);
  }
});

test("移动端不提供批量入口", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "移动端专属场景");
  await page.goto("/");
  await expect(page.getByLabel("选择源图片")).not.toHaveAttribute("multiple", "");
  await expect(page.getByRole("button", { name: "下载批量原图 PDF ZIP" })).toHaveCount(0);
});
