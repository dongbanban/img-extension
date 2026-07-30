# 01 — 初始化本地图像处理站点与单图原图 PDF

**What to build:** 用户可在中文浅色静态网页中，从设备选择一张可处理源图片，确认其仅在当前处理会话内存在，并导出页面比例与图片一致、无白边的原图 PDF。移动端保持单图流程，桌面与移动端均能看到清晰的文件限制错误。站点具备可执行测试与 GitHub Pages 发布流程。

**Blocked by:** None — can start immediately.

**Status:** done

- [x] 使用当前稳定版 Vite、React、Vitest、shadcn/ui 建立可构建的纯静态中文浅色站点；无上传、后端、账户、LocalStorage 或 PWA。
- [x] 用户可选择浏览器可解码静态源图片；动图、超过 20 MB、最长边超过 8,000 px 的输入显示明确错误，且不进入处理会话。
- [x] 移动端单选；桌面与移动端均能预览单张源图片，并显示本地处理与刷新/关闭即清除的边界。
- [x] 用户可下载原图 PDF；页面与图片比例一致、图片铺满、无白边，且文件名遵循导出命名规则。
- [x] Vitest 覆盖输入资格、导出命名等可观察规则；Playwright 覆盖桌面、移动单图选图与原图 PDF 导出。
- [x] Pull Request 与 main 运行 Vitest、Playwright、构建；main 成功后部署 GitHub Pages。

## Comments

- 验证：`npm run test:all` 通过（Vitest 6 项；Playwright 桌面、移动各 1 项；生产构建）。
- 原图 PDF 用 `pdf-lib` 按源像素尺寸建页；Canvas 光栅化后铺满整页。
