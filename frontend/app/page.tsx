'use client';

import { useMemo, useState } from 'react';
import { bucketizeByLevel } from '@/utils/ocrLevels';
import styles from './page.module.css';

type OcrResponse = { lines: string[]; count: number };
const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:8000';

const headerClassByLevel: Record<number, string> = {
  10: styles.header10,
  9: styles.header9,
  8: styles.header8,
  7: styles.header7,
  6: styles.header6,
  5: styles.header5,
  4: styles.header4,
  3: styles.header3,
  2: styles.header2,
  1: styles.header1,
};

export default function HomePage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ocr, setOcr] = useState<OcrResponse | null>(null);

  const buckets = useMemo(() => (ocr?.lines ? bucketizeByLevel(ocr.lines) : null), [ocr]);

  async function runOcr(selected: File) {
    setError(null);
    setLoading(true);
    setOcr(null);

    try {
      const form = new FormData();
      form.append('file', selected);

      const res = await fetch(`${API_BASE}/ocr`, { method: 'POST', body: form });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`OCR失败：${res.status} ${text}`);
      }
      const data = (await res.json()) as OcrResponse;
      setOcr(data);
    } catch (e: any) {
      setError(e?.message ?? '上传或识别失败');
    } finally {
      setLoading(false);
    }
  }

  // 自动识别：选择文件后立刻上传并识别
  function onChooseFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    if (f) void runOcr(f);
  }

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>百战 V2</h1>

      <section className={styles.panel}>
        <label className={styles.label}>上传枫影插件百战技能统计</label>
        <input type="file" accept="image/*" onChange={onChooseFile} />
        <div className={styles.subtle}>
          {file ? <>已选择：<span className={styles.strong}>{file.name}</span></> : '尚未选择文件'}
        </div>
        {!!error && <p className={styles.error}>{error}</p>}
        {loading && <p className={styles.loading}>识别中..</p>}
      </section>

      {buckets && (
        <section className={styles.results}>
          {Array.from({ length: 10 }, (_, i) => 10 - i).map((L) => {
            const items = buckets[L] ?? [];
            if (!items.length) return null;

            return (
              <div key={L} className={styles.levelCard}>
                <div className={`${styles.header} ${headerClassByLevel[L] || ''}`}>
                  {L}重 <span className={styles.count}>{items.length}个</span>
                </div>

                <div className={styles.body}>
                  <ul className={styles.grid3}>
                    {items.map((name, i) => (
                      <li key={`${name}-${i}`} className={styles.item}>
                        <span className={styles.dot} />
                        <span className={styles.truncate} title={name}>{name}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}

          <details className={styles.debug}>
            <summary>查看原始 OCR 结果</summary>
            <pre>{JSON.stringify(ocr?.lines ?? [], null, 2)}</pre>
          </details>
        </section>
      )}
    </main>
  );
}
