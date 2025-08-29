export async function localOCR(file: File): Promise<string[]> {
  const Tesseract: any = (await import('tesseract.js')).default;
  const worker = await Tesseract.createWorker();

  try {
    await worker.loadLanguage('chi_sim');
    await worker.initialize('chi_sim');
    const { data } = await worker.recognize(file);
    return (data.text || '')
      .split(/\r?\n/)
      .map((s: string) => s.trim())
      .filter(Boolean);
  } finally {
    await worker.terminate();
  }
}
