export type RelativePosition = { x: number; y: number };

export type WatermarkConfig = {
  text: string;
  fontSize: number;
  color: string;
  opacity: number;
  rotation: number;
  position: RelativePosition;
  repeated: boolean;
  horizontalSpacing: number;
  verticalSpacing: number;
};

export type ImageDimensions = { width: number; height: number };

export function relativePositionToPixels(position: RelativePosition, image: ImageDimensions) {
  return { x: position.x * image.width, y: position.y * image.height };
}

export function createWatermarkConfig(): WatermarkConfig {
  return {
    text: "仅供内部使用",
    fontSize: 36,
    color: "#ff0000",
    opacity: 70,
    rotation: -30,
    position: { x: 0.5, y: 0.5 },
    repeated: false,
    horizontalSpacing: 96,
    verticalSpacing: 72,
  };
}

export function watermarkBounds(image: ImageDimensions, textWidth: number, rotation: number, textHeight = image.height * 0.035) {
  const radians = Math.abs(rotation) * Math.PI / 180;
  const halfWidth = (Math.abs(textWidth * Math.cos(radians)) + Math.abs(textHeight * Math.sin(radians))) / 2;
  const halfHeight = (Math.abs(textWidth * Math.sin(radians)) + Math.abs(textHeight * Math.cos(radians))) / 2;
  return { halfWidth: Math.min(halfWidth, image.width / 2), halfHeight: Math.min(halfHeight, image.height / 2) };
}

export function watermarkFitScale(image: ImageDimensions, textWidth: number, textHeight: number, rotation: number) {
  const radians = Math.abs(rotation) * Math.PI / 180;
  const rotatedWidth = Math.abs(textWidth * Math.cos(radians)) + Math.abs(textHeight * Math.sin(radians));
  const rotatedHeight = Math.abs(textWidth * Math.sin(radians)) + Math.abs(textHeight * Math.cos(radians));
  return Math.min(1, image.width / rotatedWidth, image.height / rotatedHeight);
}

export function clampPositionForImage(position: RelativePosition, image: ImageDimensions, textWidth: number, rotation: number, textHeight?: number): RelativePosition {
  const bounds = watermarkBounds(image, textWidth, rotation, textHeight);
  return {
    x: Math.min(1 - bounds.halfWidth / image.width, Math.max(bounds.halfWidth / image.width, position.x)),
    y: Math.min(1 - bounds.halfHeight / image.height, Math.max(bounds.halfHeight / image.height, position.y)),
  };
}

export function watermarkFilename(sourceFilename: string, mimeType: "image/png" | "image/jpeg" | "image/webp" | "application/pdf") {
  const extension = mimeType === "image/jpeg" ? "jpg" : mimeType === "application/pdf" ? "pdf" : mimeType.slice(6);
  return `${sourceBasename(sourceFilename)}-watermarked.${extension}`;
}

function applyTextStyle(context: CanvasRenderingContext2D, config: WatermarkConfig) {
  context.font = `${config.fontSize}px sans-serif`;
  context.fillStyle = config.color;
  context.globalAlpha = config.opacity / 100;
  context.textAlign = "center";
  context.textBaseline = "middle";
}

export function drawWatermark(context: CanvasRenderingContext2D, image: ImageDimensions, config: WatermarkConfig) {
  if (!config.text.trim()) return;
  context.save();
  applyTextStyle(context, config);
  let metrics = context.measureText(config.text);
  let textWidth = metrics.width;
  let textHeight = (metrics.actualBoundingBoxAscent || config.fontSize) + (metrics.actualBoundingBoxDescent || 0);
  const scale = watermarkFitScale(image, textWidth, textHeight, config.rotation);
  if (scale < 1) {
    context.font = `${config.fontSize * scale}px sans-serif`;
    metrics = context.measureText(config.text);
    textWidth = metrics.width;
    textHeight = (metrics.actualBoundingBoxAscent || config.fontSize * scale) + (metrics.actualBoundingBoxDescent || 0);
  }
  const rotation = config.rotation * Math.PI / 180;

  const drawAt = (x: number, y: number) => {
    context.save();
    context.translate(x, y);
    context.rotate(rotation);
    context.fillText(config.text, 0, 0);
    context.restore();
  };

  if (config.repeated) {
    const stepX = Math.max(textWidth + config.horizontalSpacing, 1);
    const stepY = Math.max(textHeight + config.verticalSpacing, 1);
    for (let y = -image.height; y < image.height * 2; y += stepY) {
      for (let x = -image.width; x < image.width * 2; x += stepX) drawAt(x, y);
    }
  } else {
    const position = clampPositionForImage(config.position, image, textWidth, config.rotation, textHeight);
    const pixels = relativePositionToPixels(position, image);
    drawAt(pixels.x, pixels.y);
  }
  context.restore();
}

export async function createWatermarkedCanvas(file: File, config: WatermarkConfig) {
  const sourceUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error("无法解码图片"));
      element.src = sourceUrl;
    });
    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("浏览器不支持 Canvas");
    context.drawImage(image, 0, 0);
    drawWatermark(context, { width: canvas.width, height: canvas.height }, config);
    return canvas;
  } finally {
    URL.revokeObjectURL(sourceUrl);
  }
}
import { sourceBasename } from "./export-name";
