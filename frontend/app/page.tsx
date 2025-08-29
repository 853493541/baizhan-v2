// src/app/ocr/page.tsx
'use client';

import { useState } from 'react';
import ImagePreview from '@/components/ImagePreview';
import styles from './page.module.css';

export default function OCRPage() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLocalOCR = async () => {
    if (!imageFile) return;
    setLoading(true);

    const { default: Tesseract } = await import('tesseract.js');
    const { data } = await Tesseract.recognize(imageFile, 'eng+chi_sim', {
      logger: m => console.log(m),
    });
    setResult(data.text);
    setLoading(false);
  };

  return (
    <div className={styles.ocrContainer}>
      <h1>图像识别（仅本地识别）</h1>

      <ImagePreview imageFile={imageFile} setImageFile={setImageFile} />

      <div className={styles.buttonRow}>
        <button onClick={handleLocalOCR} disabled={!imageFile || loading}>
          {loading ? '识别中...' : '开始本地识别'}
        </button>
      </div>

      {result && (
        <div className={styles.resultContainer}>
          <h2>识别结果</h2>
          <pre>{result}</pre>
        </div>
      )}
    </div>
  );
}
