"use client";

interface OCRSectionProps {
  show: boolean;
  onToggle: () => void;
  onFileSelected: (file: File) => void;
  processing: boolean;
  onCancelProcessing: () => void;
}

export default function OCRSection({
  show,
  onToggle,
  onFileSelected,
  processing,
  onCancelProcessing,
}: OCRSectionProps) {
  return (
    <div style={{ marginTop: 24 }}>
      {/* Toggle button */}
      <button
        onClick={onToggle}
        style={{
          background: "#222",
          color: "#fff",
          padding: "8px 16px",
          borderRadius: 6,
          cursor: "pointer",
          fontWeight: "bold",
        }}
      >
        {show ? "关闭 OCR 上传 ▲" : "更新角色技能 ▼"}
      </button>

      {/* Upload area */}
      {show && (
        <div
          style={{
            marginTop: 16,
            padding: 16,
            border: "1px dashed #aaa",
            borderRadius: 8,
            background: "#fafafa",
            textAlign: "center",
          }}
          onPaste={(e) => {
            const items = e.clipboardData?.items;
            if (items) {
              for (const item of items) {
                if (item.type.startsWith("image/")) {
                  const file = item.getAsFile();
                  if (file) onFileSelected(file);
                }
              }
            }
          }}
        >
          <p style={{ marginBottom: 8, color: "#666" }}>粘贴或者上传</p>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onFileSelected(file);
            }}
          />
        </div>
      )}

      {/* Processing modal */}
      {processing && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 8,
              padding: "24px 32px",
              textAlign: "center",
              width: 360,
            }}
          >
            <h3 style={{ marginBottom: 20 }}>图片已上传</h3>
            <div
              style={{
                width: 40,
                height: 40,
                border: "4px solid #ddd",
                borderTop: "4px solid #333",
                borderRadius: "50%",
                margin: "0 auto 16px",
                animation: "spin 1s linear infinite",
              }}
            />
            <p>OCR处理中</p>
            <div style={{ marginTop: 20 }}>
              <button onClick={onCancelProcessing} style={{ marginRight: 12 }}>
                取消
              </button>
            </div>
            <style>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        </div>
      )}
    </div>
  );
}
