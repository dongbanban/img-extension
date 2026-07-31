import { Download, FileImage, ShieldCheck } from "lucide-react";
import { ChangeEvent, PointerEvent, useEffect, useRef, useState } from "react";
import { Button } from "./components/ui/button";
import { createBatchOriginalPdfZip } from "./lib/batch-pdf";
import { createBatchWatermarkZip } from "./lib/batch-watermark";
import { createPdfFilename } from "./lib/export-name";
import { createOriginalPdf, createPdfFromCanvas } from "./lib/pdf";
import { type DecodeImage, validateSourceImage } from "./lib/source-image";
import {
  clampPositionForImage,
  createWatermarkConfig,
  createWatermarkedCanvas,
  type WatermarkConfig,
  watermarkFilename,
} from "./lib/watermark";

type SourceImage = { file: File; previewUrl: string };
type ExportMimeType = "image/png" | "image/jpeg" | "image/webp";

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

async function downloadBlob(blob: Blob, filename: string, useSystemShare = false) {
  if (useSystemShare && "share" in navigator && "canShare" in navigator) {
    const file = new File([blob], filename, { type: blob.type });
    const shareData = { files: [file], title: filename };
    if (navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }
  }
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

function canvasBlob(canvas: HTMLCanvasElement, type: ExportMimeType) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("此浏览器不支持该图片格式")), type, 0.92);
  });
}

export default function App() {
  const [sourceImages, setSourceImages] = useState<SourceImage[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [error, setError] = useState("");
  const [isDesktop, setIsDesktop] = useState(matchesDesktopBreakpoint);
  const [isExporting, setIsExporting] = useState(false);
  const [watermark, setWatermark] = useState<WatermarkConfig>(createWatermarkConfig);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const selectionRevision = useRef(0);
  const sourceImage = sourceImages[currentImageIndex];

  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)");
    const update = () => setIsDesktop(media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => () => sourceImages.forEach((image) => URL.revokeObjectURL(image.previewUrl)), [sourceImages]);

  useEffect(() => {
    if (!sourceImage || !canvasRef.current) return;
    let cancelled = false;
    void createWatermarkedCanvas(sourceImage.file, watermark).then((rendered) => {
      if (cancelled || !canvasRef.current) return;
      canvasRef.current.width = rendered.width;
      canvasRef.current.height = rendered.height;
      canvasRef.current.getContext("2d")?.drawImage(rendered, 0, 0);
    }).catch(() => setError("水印预览生成失败，请更换图片后重试"));
    return () => { cancelled = true; };
  }, [sourceImage, watermark]);

  async function selectImages(event: ChangeEvent<HTMLInputElement>) {
    const revision = selectionRevision.current + 1;
    selectionRevision.current = revision;
    const files = Array.from(event.target.files ?? []).slice(0, isDesktop ? undefined : 1);
    event.target.value = "";
    if (!files.length) return;
    const accepted: SourceImage[] = [];
    const errors: string[] = [];
    for (const file of files) {
      const validation = await validateSourceImage(file, decodeImage);
      if (validation.ok) {
        accepted.push({ file, previewUrl: URL.createObjectURL(file) });
      } else {
        errors.push(validation.message);
      }
    }
    if (revision !== selectionRevision.current) {
      accepted.forEach((image) => URL.revokeObjectURL(image.previewUrl));
      return;
    }
    if (accepted.length) {
      setSourceImages(accepted);
      setCurrentImageIndex(0);
    }
    setError(errors.length ? errors.join("；") : "");
  }

  async function downloadPdf() {
    if (!sourceImage) return;
    setIsExporting(true);
    setError("");
    try {
      await downloadBlob(new Blob([await createOriginalPdf(sourceImage.file) as Uint8Array<ArrayBuffer>], { type: "application/pdf" }), createPdfFilename(sourceImage.file.name), !isDesktop);
    } catch {
      setError("PDF 导出失败，请更换图片后重试");
    } finally {
      setIsExporting(false);
    }
  }

  async function downloadBatchPdf() {
    if (sourceImages.length < 2) return;
    setIsExporting(true);
    setError("");
    try {
      const zip = await createBatchOriginalPdfZip(sourceImages.map((image) => image.file), createOriginalPdf);
      downloadBlob(new Blob([zip as Uint8Array<ArrayBuffer>], { type: "application/zip" }), "原图-PDF-批量导出.zip");
    } catch {
      setError("批量 PDF 导出失败，请更换图片后重试");
    } finally {
      setIsExporting(false);
    }
  }

  async function downloadWatermark(type: ExportMimeType | "application/pdf") {
    if (!sourceImage) return;
    setIsExporting(true);
    setError("");
    try {
      const canvas = await createWatermarkedCanvas(sourceImage.file, watermark);
      const blob = type === "application/pdf"
        ? new Blob([await createPdfFromCanvas(canvas) as Uint8Array<ArrayBuffer>], { type })
        : await canvasBlob(canvas, type);
      await downloadBlob(blob, watermarkFilename(sourceImage.file.name, type), !isDesktop && type === "application/pdf");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "水印导出失败，请重试");
    } finally {
      setIsExporting(false);
    }
  }

  async function downloadBatchWatermark(type: ExportMimeType | "application/pdf") {
    if (sourceImages.length < 2) return;
    setIsExporting(true);
    setError("");
    try {
      const zip = await createBatchWatermarkZip(sourceImages.map((image) => image.file), type, watermark, async (file, config) => {
        const canvas = await createWatermarkedCanvas(file, config);
        if (type === "application/pdf") return await createPdfFromCanvas(canvas);
        return new Uint8Array(await (await canvasBlob(canvas, type)).arrayBuffer());
      });
      downloadBlob(new Blob([zip as Uint8Array<ArrayBuffer>], { type: "application/zip" }), `文字水印-${type === "application/pdf" ? "PDF" : type.slice(6).toUpperCase()}-批量导出.zip`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "批量水印导出失败，请重试");
    } finally {
      setIsExporting(false);
    }
  }

  function dragWatermark(event: PointerEvent<HTMLCanvasElement>) {
    if (!sourceImage || watermark.repeated || !canvasRef.current) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width;
    const y = (event.clientY - bounds.top) / bounds.height;
    const context = canvasRef.current.getContext("2d");
    if (!context) return;
    context.font = `${watermark.fontSize}px sans-serif`;
    setWatermark((current) => ({
      ...current,
      position: clampPositionForImage({ x, y }, { width: canvasRef.current!.width, height: canvasRef.current!.height }, context.measureText(current.text).width, current.rotation, current.fontSize),
    }));
  }

  return <main className="page-shell">
    <header>
      <p className="eyebrow">本地图像处理</p>
      <h1>图像转换与文字水印</h1>
      <p className="lead">配置文字水印。预览、图片、PDF 使用同一渲染结果。</p>
    </header>

    <section className="notice" aria-label="本地处理说明">
      <ShieldCheck aria-hidden="true" size={22} />
      <div><strong>仅在此处理会话内处理</strong><span>文件不会上传；刷新或关闭页面即清除。</span></div>
    </section>

    <section className="workspace" aria-label="图像处理与导出">
      <div className="picker">
        <FileImage aria-hidden="true" size={28} />
        <h2>选择源图片</h2>
        <p>{isDesktop ? "桌面端可选择多张源图片并批量导出。" : "移动端仅支持单图导出。"}</p>
        <label className="file-button">选择源图片<input aria-label="选择源图片" type="file" accept="image/*" multiple={isDesktop} onChange={selectImages} /></label>
        <small>支持浏览器可解码静态图片。动图、超过 20 MB、最长边超过 8,000 px 的图片不可处理。</small>
        {isDesktop && sourceImages.length > 1 && <div className="thumbnail-list" aria-label="源图片缩略图列表">
          {sourceImages.map((image, index) => <button className={index === currentImageIndex ? "thumbnail active" : "thumbnail"} key={image.previewUrl} type="button" onClick={() => setCurrentImageIndex(index)}>
            <img alt="" src={image.previewUrl} />{image.file.name}
          </button>)}
        </div>}
      </div>

      <div className="preview-area">
        {sourceImage ? <><canvas ref={canvasRef} className="preview-image" aria-label="水印预览" onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); dragWatermark(event); }} onPointerMove={(event) => event.currentTarget.hasPointerCapture(event.pointerId) && dragWatermark(event)} /><p className="current-image">当前预览：{sourceImage.file.name}{sourceImages.length > 1 && `（${currentImageIndex + 1} / ${sourceImages.length}）`}</p></> : <p>选择一张源图片后在此预览</p>}
      </div>

      <div className="settings-panel">
        <h2>文字水印</h2>
        <label>水印文字<input aria-label="水印文字" value={watermark.text} onChange={(event) => setWatermark({ ...watermark, text: event.target.value })} /></label>
        <label>字号<input aria-label="字号" type="number" min="12" max="400" value={watermark.fontSize} onChange={(event) => setWatermark({ ...watermark, fontSize: Number(event.target.value) })} /></label>
        <label>颜色<input aria-label="颜色" type="color" value={watermark.color} onChange={(event) => setWatermark({ ...watermark, color: event.target.value })} /></label>
        <label>不透明度<input aria-label="不透明度" type="number" min="0" max="100" value={watermark.opacity} onChange={(event) => setWatermark({ ...watermark, opacity: Number(event.target.value) })} /></label>
        <label>旋转角度<input aria-label="旋转角度" type="number" min="-180" max="180" value={watermark.rotation} onChange={(event) => setWatermark({ ...watermark, rotation: Number(event.target.value) })} /></label>
        <label className="checkbox-label"><input aria-label="重复水印" type="checkbox" checked={watermark.repeated} onChange={(event) => setWatermark({ ...watermark, repeated: event.target.checked })} />重复水印</label>
        {watermark.repeated && <p className="hint">重复水印将以固定网格覆盖整图</p>}
        {!watermark.repeated && <p className="hint">在预览图片上拖拽文字位置。</p>}
      </div>

      <div className="export-panel">
        <h2>导出</h2>
        <p>水印 PDF 页面比例与图片一致，铺满页面，无白边。</p>
        <div className="export-actions">
          <Button disabled={!sourceImage || isExporting} onClick={() => downloadWatermark("image/png")}>下载水印 PNG</Button>
          <Button disabled={!sourceImage || isExporting} onClick={() => downloadWatermark("image/jpeg")}>下载水印 JPEG</Button>
          <Button disabled={!sourceImage || isExporting} onClick={() => downloadWatermark("image/webp")}>下载水印 WebP</Button>
          <Button disabled={!sourceImage || isExporting} onClick={() => downloadWatermark("application/pdf")}><Download aria-hidden="true" size={18} />下载水印 PDF</Button>
          <Button disabled={!sourceImage || isExporting} onClick={downloadPdf}>下载原图 PDF</Button>
          {isDesktop && <Button disabled={sourceImages.length < 2 || isExporting} onClick={downloadBatchPdf}>下载批量原图 PDF ZIP</Button>}
          {isDesktop && <Button disabled={sourceImages.length < 2 || isExporting} onClick={() => downloadBatchWatermark("image/png")}>下载批量水印 PNG ZIP</Button>}
          {isDesktop && <Button disabled={sourceImages.length < 2 || isExporting} onClick={() => downloadBatchWatermark("image/jpeg")}>下载批量水印 JPEG ZIP</Button>}
          {isDesktop && <Button disabled={sourceImages.length < 2 || isExporting} onClick={() => downloadBatchWatermark("image/webp")}>下载批量水印 WebP ZIP</Button>}
          {isDesktop && <Button disabled={sourceImages.length < 2 || isExporting} onClick={() => downloadBatchWatermark("application/pdf")}>下载批量水印 PDF ZIP</Button>}
        </div>
      </div>
    </section>
    {error && <p className="error" role="alert">{error}</p>}
  </main>;
}
