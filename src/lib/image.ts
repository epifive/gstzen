"use client";

/**
 * Reads an image file and downscales it so it fits comfortably in localStorage.
 * SVGs are kept as-is (they are small); raster images become PNG (keeps transparency).
 */
export async function fileToDataUrl(file: File, maxSize = 480): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Please choose an image file (PNG, JPG, SVG or WebP).");
  if (file.size > 5 * 1024 * 1024) throw new Error("Image is larger than 5 MB.");
  const raw = await new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error("Could not read the file."));
    r.readAsDataURL(file);
  });
  if (file.type === "image/svg+xml") {
    if (raw.length > 200_000) throw new Error("SVG is too large (max 150 KB).");
    return raw;
  }
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error("This image could not be opened."));
    i.src = raw;
  });
  const ratio = Math.min(1, maxSize / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * ratio));
  const h = Math.max(1, Math.round(img.height * ratio));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL("image/png");
}
