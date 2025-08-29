'use client';

import React, { useCallback } from 'react';

export default function DropPasteArea({ onImage }: { onImage: (f: File) => void }) {
  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) onImage(file);
  }, [onImage]);

  const onPaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const it of items) {
      if (it.type.startsWith('image/')) {
        const file = it.getAsFile();
        if (file) onImage(file);
        break;
      }
    }
  }, [onImage]);

  const onChoose = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) onImage(file);
  }, [onImage]);

  return (
    <div
      onDrop={onDrop}
      onDragOver={(e) => e.preventDefault()}
      onPaste={onPaste}
      tabIndex={0}
      style={{
        border: '2px dashed #888',
        padding: 24,
        borderRadius: 8,
        textAlign: 'center',
        background: '#f9f9f9',
        cursor: 'pointer',
      }}
    >
      <p>拖拽图片到此，或按 <strong>Ctrl+V</strong> 粘贴</p>
      <input type="file" accept="image/*" onChange={onChoose} />
    </div>
  );
}
