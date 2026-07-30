import { createBatchZip, uniqueExportFilename } from "./batch-zip";
import { watermarkFilename, type WatermarkConfig } from "./watermark";

type WatermarkExportMimeType = "image/png" | "image/jpeg" | "image/webp" | "application/pdf";
type WatermarkedFileCreator = (file: File, config: WatermarkConfig) => Promise<Uint8Array>;

function uniqueWatermarkFilename(file: File, mimeType: WatermarkExportMimeType, usedNames: Set<string>) {
  return uniqueExportFilename(watermarkFilename(file.name, mimeType), usedNames);
}

export async function createBatchWatermarkZip(files: File[], mimeType: WatermarkExportMimeType, config: WatermarkConfig, createWatermarkedFile: WatermarkedFileCreator) {
  return createBatchZip(files, (file, usedNames) => uniqueWatermarkFilename(file, mimeType, usedNames), (file) => createWatermarkedFile(file, config));
}
