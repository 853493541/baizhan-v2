export async function downscaleToWebP(file: File, maxDim = 1600, quality = 0.8): Promise<Blob> {
  const img = await fileToImage(file);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(), 'image/webp', quality)
  );
}

function fileToImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = reject;
    img.src = url;
  });
}
