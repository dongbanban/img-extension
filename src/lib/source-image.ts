export {};
export const MAX_SOURCE_IMAGE_BYTES = 20 * 1024 * 1024;
export const MAX_SOURCE_IMAGE_EDGE = 8_000;

export type ImageSize = { width: number; height: number };
export type DecodeImage = (file: File) => Promise<ImageSize>;
export type SourceImageValidation = { ok: true } | { ok: false; message: string };

const isGif = (file: File) => file.type === "image/gif" || file.name.toLowerCase().endsWith(".gif");

export async function validateSourceImage(file: File, decodeImage: DecodeImage): Promise<SourceImageValidation> {
  if (isGif(file)) {
    return { ok: false, message: "不支持动图" };
  }
  if (file.size > MAX_SOURCE_IMAGE_BYTES) {
    return { ok: false, message: "文件不能超过 20 MB" };
  }

  try {
    const { width, height } = await decodeImage(file);
    if (Math.max(width, height) > MAX_SOURCE_IMAGE_EDGE) {
      return { ok: false, message: "图片最长边不能超过 8,000 px" };
    }
    return { ok: true };
  } catch {
    return { ok: false, message: "此浏览器无法解码此图片，请选择静态图片" };
  }
}
