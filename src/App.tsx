import { Download, FileImage, ShieldCheck } from "lucide-react";
import { ChangeEvent, useEffect, useState } from "react";
import { Button } from "./components/ui/button";
import { createPdfFilename } from "./lib/export-name";
import { createOriginalPdf } from "./lib/pdf";
import { type DecodeImage, validateSourceImage } from "./lib/source-image";

type SourceImage = { file: File; previewUrl: string };

const decodeImage: DecodeImage = (file) => new Promise((resolve, reject) => {
  const url = URL.createObjectURL(file);
  const image = new Image();
  image.onload = () => {
    URL.revokeObjectURL(url);
    resolve({ width: image.naturalWidth, height: image.naturalHeight });
  };
  image.onerror = () => {
    URL.revokeObjectURL(url);
    reject(new Error("decode failed"));
  };
  image.src = url;
});

function matchesDesktopBreakpoint() {
  return window.matchMedia("(min-width: 768px)").matches;
}

export default function App() {
  const [sourceImage, setSourceImage] = useState<SourceImage>();
  const [error, setError] = useState("");
  const [isDesktop, setIsDesktop] = useState(matchesDesktopBreakpoint);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)");
    const update = () => setIsDesktop(media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => () => sourceImage && URL.revokeObjectURL(sourceImage.previewUrl), [sourceImage]);

  async function selectImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const validation = await validateSourceImage(file, decodeImage);
    if (!validation.ok) {
      setError(validation.message);
      return;
    }
    setError("");
    setSourceImage({ file, previewUrl: URL.createObjectURL(file) });
  }

  async function downloadPdf() {
    if (!sourceImage) return;
    setIsExporting(true);
    setError("");
    try {
      const bytes = await createOriginalPdf(sourceImage.file);
      const blob = new Blob([bytes as Uint8Array<ArrayBuffer>], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = createPdfFilename(sourceImage.file.name);
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("PDF 导出失败，请更换图片后重试");
    } finally {
      setIsExporting(false);
    }
  }

  return <main className="page-shell">
    <header>
      <p className="eyebrow">本地图像处理</p>
      <h1>图片转原图 PDF</h1>
      <p className="lead">保持原图比例。页面铺满图片。无白边。</p>
    </header>

    <section className="notice" aria-label="本地处理说明">
      <ShieldCheck aria-hidden="true" size={22} />
      <div><strong>仅在此处理会话内处理</strong><span>文件不会上传；刷新或关闭页面即清除。</span></div>
    </section>

    <section className="workspace" aria-label="原图 PDF 导出">
      <div className="picker">
        <FileImage aria-hidden="true" size={28} />
        <h2>选择源图片</h2>
        <p>{isDesktop ? "当前版本一次处理一张图片。" : "移动端仅支持单图导出。"}</p>
        <label className="file-button">
          选择源图片
          <input aria-label="选择源图片" type="file" accept="image/*" onChange={selectImage} />
        </label>
        <small>支持浏览器可解码静态图片。动图、超过 20 MB、最长边超过 8,000 px 的图片不可处理。</small>
      </div>

      <div className="preview-area">
        {sourceImage ? <img className="preview-image" src={sourceImage.previewUrl} alt="源图片预览" /> : <p>选择一张源图片后在此预览</p>}
      </div>

      <div className="export-panel">
        <h2>导出</h2>
        <p>导出 PDF 页面比例与源图片一致，图片铺满页面，无白边。</p>
        <Button disabled={!sourceImage || isExporting} onClick={downloadPdf}>
          <Download aria-hidden="true" size={18} />
          {isExporting ? "正在生成 PDF" : "下载原图 PDF"}
        </Button>
      </div>
    </section>
    {error && <p className="error" role="alert">{error}</p>}
  </main>;
}
