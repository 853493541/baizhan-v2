// src/components/ImagePreview.tsx
'use client';

import React, { useEffect, useState } from 'react';
import styles from './ImagePreview.module.css';

interface Props {
  imageFile: File | null;
  setImageFile: (file: File | null) => void;
}

export default function ImagePreview({ imageFile, setImageFile }: Props) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!imageFile) return setPreviewUrl(null);

    const url = URL.createObjectURL(imageFile);
    setPreviewUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setImageFile(file);
  };

  return (
    <div className={styles.previewContainer}>
      <input type="file" accept="image/*" onChange={handleFileChange} />
      {previewUrl && (
        <div className={styles.imageBox}>
          <img src={previewUrl} alt="preview" />
        </div>
      )}
    </div>
  );
}
