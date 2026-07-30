import { expect, test } from "@playwright/test";
import { PDFDocument } from "pdf-lib";

const fixture = "e2e/fixtures/sample.svg";

test("用户可配置、拖拽文字水印，预览并导出各种格式", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("选择源图片").setInputFiles(fixture);
  await page.getByLabel("水印文字").fill("内部使用");
  await page.getByLabel("字号").fill("32");
  await page.getByLabel("不透明度").fill("60");
  await page.getByLabel("旋转角度").fill("-30");

  const preview = page.getByLabel("水印预览");
  await preview.dragTo(preview, { sourcePosition: { x: 200, y: 120 }, targetPosition: { x: 300, y: 180 } });
  await expect(preview).toBeVisible();

  for (const [name, extension] of [["下载水印 PNG", ".png"], ["下载水印 JPEG", ".jpg"], ["下载水印 WebP", ".webp"]]) {
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name }).click();
    expect((await downloadPromise).suggestedFilename()).toBe(`sample-watermarked${extension}`);
  }

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "下载水印 PDF" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("sample-watermarked.pdf");
  const bytes = await download.createReadStream().then(async (stream) => {
    const chunks: Buffer[] = [];
    for await (const chunk of stream!) chunks.push(chunk);
    return Buffer.concat(chunks);
  });
  const pageSize = (await PDFDocument.load(bytes)).getPage(0).getSize();
  expect(pageSize.width / pageSize.height).toBeCloseTo(1.5, 4);
});

test("用户可启用重复水印", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("选择源图片").setInputFiles(fixture);
  await page.getByLabel("重复水印").check();
  await expect(page.getByText("重复水印将以固定网格覆盖整图")).toBeVisible();
});
