"use client";

import styles from "./styles.module.css";

interface ProcessingModalProps {
  previewImage?: string | null;
  onCancel: () => void;
}

export default function ProcessingModal({ previewImage, onCancel }: ProcessingModalProps) {
  return (
    <div className={styles.overlay}>
      <div className={styles.box}>
        <h3 className={styles.title}>图片处理</h3>

        {previewImage && (
          <img
            src={previewImage}
            alt="预览"
            className={styles.previewImage}
          />
        )}

        <p className={styles.text}>正在扫描...</p>

        <div className={styles.progressBarWrapper}>
          <div className={styles.progressBar} />
        </div>

        <div className={styles.footer}>
          <button onClick={onCancel} className={styles.cancelButton}>
            取消
          </button>
        </div>
      </div>
    </div>
  );
}
