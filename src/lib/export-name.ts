export {};
export function sourceBasename(filename: string) {
  const finalDot = filename.lastIndexOf(".");
  return finalDot > 0 ? filename.slice(0, finalDot) : filename;
}

export function createPdfFilename(sourceFilename: string) {
  return `${sourceBasename(sourceFilename)}.pdf`;
}
