import { PDFDocument } from "pdf-lib";

async function loadImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("无法解码图片"));
    image.src = url;
  });
}

function canvasToPng(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("无法生成图片数据"))), "image/png");
  });
}

export async function createOriginalPdf(file: File) {
  const url = URL.createObjectURL(file);
  try {
    const image = await loadImage(url);
    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    canvas.getContext("2d")!.drawImage(image, 0, 0);

    const pdf = await PDFDocument.create();
    const page = pdf.addPage([image.naturalWidth, image.naturalHeight]);
    const png = await pdf.embedPng(await (await canvasToPng(canvas)).arrayBuffer());
    page.drawImage(png, { x: 0, y: 0, width: page.getWidth(), height: page.getHeight() });
    return pdf.save();
  } finally {
    URL.revokeObjectURL(url);
  }
}
