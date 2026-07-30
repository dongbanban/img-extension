import { createBatchZip, uniqueExportFilename } from "./batch-zip";
import { createPdfFilename } from "./export-name";

type PdfCreator = (file: File) => Promise<Uint8Array>;

function uniquePdfFilename(file: File, usedNames: Set<string>) {
  return uniqueExportFilename(createPdfFilename(file.name), usedNames);
}

export async function createBatchOriginalPdfZip(files: File[], createPdf: PdfCreator) {
  return createBatchZip(files, uniquePdfFilename, createPdf);
}
