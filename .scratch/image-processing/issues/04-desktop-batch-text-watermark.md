# 04 — 桌面批量文字水印导出

**What to build:** 桌面用户可将一套文字水印配置按相对水印位置应用到多张源图片，并把批量水印图片或一图一水印 PDF 导出为 ZIP；现有单图、移动端流程保持可用。

**Blocked by:** 02 — 单图文字水印与图片/PDF 导出；03 — 桌面批量原图 PDF ZIP。

**Status:** done

- [x] 批量处理将同一套文字水印配置应用至每张源图片，并按每张图片尺寸保持水印位置的相对一致性。
- [x] 用户可下载批量水印 PNG、JPEG、WebP 结果 ZIP，或下载一图一水印 PDF 的 ZIP。
- [x] 批量结果遵循选择顺序、导出命名、同名编号与本地处理约束。
- [x] Playwright 覆盖桌面批量水印图片/PDF ZIP 与移动单图回归；Vitest 覆盖相对位置应用、批量导出顺序和命名规则。
- [x] CI 全量执行 Vitest、Playwright、构建；main 自动部署后的静态站保留全部已验收流程。

## Comments

- 批量导出按选择顺序逐张渲染；同一份文字水印配置含相对位置传给每张源图片。
- 验证：`npm run test:all`（Vitest 14 passed；Playwright 12 passed、6 项跨视口 skip；构建通过）。
- `.github/workflows/pages.yml` 在 Pull Request、main 执行 Vitest、Playwright、构建；main 成功后部署 GitHub Pages。
