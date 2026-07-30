import JSZip from "jszip";

type BatchFileCreator = (file: File) => Promise<Uint8Array>;
type BatchFilenameCreator = (file: File, usedNames: Set<string>) => string;

function normalizedFilename(filename: string) {
  return filename.toLowerCase();
}

export function uniqueExportFilename(filename: string, usedNames: Set<string>) {
  if (!usedNames.has(normalizedFilename(filename))) return filename;

  const extensionStart = filename.lastIndexOf(".");
  const basename = filename.slice(0, extensionStart);
  const extension = filename.slice(extensionStart);
  let index = 2;
  let numberedFilename = `${basename}-${index}${extension}`;
  while (usedNames.has(normalizedFilename(numberedFilename))) {
    index += 1;
    numberedFilename = `${basename}-${index}${extension}`;
  }
  return numberedFilename;
}

export async function createBatchZip(files: File[], createFilename: BatchFilenameCreator, createFile: BatchFileCreator) {
  const zip = new JSZip();
  const usedNames = new Set<string>();

  for (const file of files) {
    const filename = createFilename(file, usedNames);
    usedNames.add(normalizedFilename(filename));
    zip.file(filename, await createFile(file));
  }

  return zip.generateAsync({ type: "uint8array" });
}
