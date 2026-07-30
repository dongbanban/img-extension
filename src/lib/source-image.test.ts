import { describe, expect, it } from "vitest";
import { validateSourceImage } from "./source-image";

const decode = async () => ({ width: 1200, height: 800 });

describe("可处理源图片资格", () => {
  it("接受浏览器可解码且未超限静态图片", async () => {
    await expect(validateSourceImage(new File(["image"], "photo.png", { type: "image/png" }), decode)).resolves.toEqual({ ok: true });
  });

  it("拒绝动图", async () => {
    await expect(validateSourceImage(new File(["GIF89a"], "motion.gif", { type: "image/gif" }), decode)).resolves.toMatchObject({ ok: false, message: "不支持动图" });
  });

  it("拒绝超过 20 MB 文件", async () => {
    const file = new File([new Uint8Array(20 * 1024 * 1024 + 1)], "large.png", { type: "image/png" });
    await expect(validateSourceImage(file, decode)).resolves.toMatchObject({ ok: false, message: "文件不能超过 20 MB" });
  });

  it("拒绝最长边超过 8,000 px 图片", async () => {
    await expect(validateSourceImage(new File(["image"], "wide.png", { type: "image/png" }), async () => ({ width: 8001, height: 300 }))).resolves.toMatchObject({ ok: false, message: "图片最长边不能超过 8,000 px" });
  });
});
