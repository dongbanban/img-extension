import JSZip from "jszip";
import { createPdfFilename } from "./export-name";

type PdfCreator = (file: File) => Promise<Uint8Array>;

function normalizedFilename(filename: string) {
  return filename.toLowerCase();
}

function uniquePdfFilename(file: File, usedNames: Set<string>) {
  const filename = createPdfFilename(file.name);
  if (!usedNames.has(normalizedFilename(filename))) return filename;

  const basename = filename.slice(0, -4);
  let index = 2;
  let numberedFilename = `${basename}-${index}.pdf`;
  while (usedNames.has(normalizedFilename(numberedFilename))) {
    index += 1;
    numberedFilename = `${basename}-${index}.pdf`;
  }
  return numberedFilename;
}

export async function createBatchOriginalPdfZip(files: File[], createPdf: PdfCreator) {
  const zip = new JSZip();
  const usedNames = new Set<string>();

  for (const file of files) {
    const filename = uniquePdfFilename(file, usedNames);
    usedNames.add(normalizedFilename(filename));
    zip.file(filename, await createPdf(file));
  }

  return zip.generateAsync({ type: "uint8array" });
}
