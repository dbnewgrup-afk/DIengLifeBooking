export async function compressImageToDataUrl(
  file: File,
  options?: { targetBytes?: number; minQuality?: number }
) {
  const targetBytes = options?.targetBytes ?? 200 * 1024;
  const minQuality = options?.minQuality ?? 0.42;

  const dataUrl = await readFileAsDataUrl(file);
  const image = await loadImage(dataUrl);
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas tidak tersedia untuk kompres gambar.");
  }

  ctx.drawImage(image, 0, 0);

  let quality = 0.92;
  let best = canvas.toDataURL("image/jpeg", quality);
  while (byteSizeFromDataUrl(best) > targetBytes && quality > minQuality) {
    quality = Math.max(minQuality, quality - 0.08);
    best = canvas.toDataURL("image/jpeg", quality);
  }

  return best;
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Gagal membaca file gambar."));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Gagal memuat gambar."));
    image.src = src;
  });
}

function byteSizeFromDataUrl(dataUrl: string) {
  const base64 = dataUrl.split(",")[1] || "";
  return Math.ceil((base64.length * 3) / 4);
}
