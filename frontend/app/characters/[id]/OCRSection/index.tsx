"use client";

import { useState, useEffect } from "react";
import ComparisonModal from "../ComparisonModal";
import { runOCR, confirmOCRUpdate } from "../../../../lib/ocrService";
import styles from "./styles.module.css";
interface Props {
  characterId: string;
  currentAbilities: Record<string, number>;
  onAbilitiesUpdated: (updates: Record<string, number>) => void;
}

export default function CharacterOCRSection({
  characterId,
  currentAbilities,
  onAbilitiesUpdated,
}: Props) {
  const [ocrFile, setOcrFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [compareResult, setCompareResult] = useState<any | null>(null);
  const [processing, setProcessing] = useState(false);

  // Run OCR when file selected
  useEffect(() => {
    if (ocrFile && characterId) {
      setPreviewImage(URL.createObjectURL(ocrFile));

      setProcessing(true);
      runOCR(ocrFile, characterId)
        .then((result) => setCompareResult(result))
        .catch((err) => {
          console.error(err);
          alert("OCR 请求失败");
        })
        .finally(() => setProcessing(false));
    }
  }, [ocrFile, characterId]);

  const handleConfirmUpdate = async (dbOnlyValues: Record<string, number>) => {
    try {
      const updates = await confirmOCRUpdate(characterId, {
        ...compareResult,
        dbOnlyValues,
      });
      onAbilitiesUpdated(updates);
      setCompareResult(null);
      alert("角色技能更新成功！");
    } catch (err) {
      console.error(err);
      alert("更新失败");
    }
  };

  return (
    <div className={styles.wrapper}>
      {/* ✅ Always visible upload area */}
      <div
        className={styles.uploadArea}
        onPaste={(e) => {
          const items = e.clipboardData?.items;
          if (items) {
            for (const item of items) {
              if (item.type.startsWith("image/")) {
                const file = item.getAsFile();
                if (file) setOcrFile(file);
              }
            }
          }
        }}
      >
        <p className={styles.uploadText}>上传或者粘贴枫影插件统计截图</p>

        {/* Hidden input */}
        <input
          id="ocr-upload"
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) setOcrFile(file);
          }}
        />

        {/* Custom Chinese button */}
        <label htmlFor="ocr-upload" className={styles.uploadButton}>
          选择文件
        </label>
        <span className={styles.fileName}>
          {ocrFile ? ocrFile.name : "未选择文件"}
        </span>
      </div>

      {/* Processing modal */}
      {processing && (
        <div className={styles.processingOverlay}>
          <div className={styles.processingBox}>
            <h3 style={{ marginBottom: 20 }}>图片已上传</h3>
            <div className={styles.spinner} />
            <p>正在进行 OCR 识别...</p>
            <div style={{ marginTop: 20 }}>
              <button onClick={() => setProcessing(false)}>取消</button>
            </div>
          </div>
        </div>
      )}

      {/* Comparison results */}
      {compareResult && (
        <ComparisonModal
          toUpdate={compareResult.toUpdate || []}
          ocrOnly={compareResult.ocrOnly || []}
          dbOnly={compareResult.dbOnly || []}
          previewImage={previewImage}
          currentAbilities={currentAbilities}
          onConfirm={handleConfirmUpdate}
          onClose={() => setCompareResult(null)}
        />
      )}
    </div>
  );
}
