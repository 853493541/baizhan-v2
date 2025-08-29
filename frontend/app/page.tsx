'use client';

import { useMemo, useState } from 'react';
import { bucketizeByLevel } from '@/utils/ocrLevels';

type OcrResponse = { lines: string[]; count: number };

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:8000';

export default function HomePage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ocr, setOcr] = useState<OcrResponse | null>(null);

  const buckets = useMemo(() => {
    if (!ocr?.lines) return null;
    return bucketizeByLevel(ocr.lines);
  }, [ocr]);

  const level10 = buckets?.[10] ?? [];

  async function handleUpload() {
    if (!file) {
      setError('请选择一张图片');
      return;
    }
    setError(null);
    setLoading(true);
    setOcr(null);

    try {
      const form = new FormData();
      form.append('file', file);

      const res = await fetch(`${API_BASE}/ocr`, {
        method: 'POST',
        body: form,
      });

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

  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">OCR 识别（主页）</h1>

      <section className="rounded-xl border p-4 mb-6">
        <label className="block text-sm font-medium mb-2">选择一张图片</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="mb-3"
        />
        <div className="flex items-center gap-3">
          <button
            onClick={handleUpload}
            disabled={loading || !file}
            className="px-4 py-2 rounded-lg bg-black text-white disabled:opacity-50"
          >
            {loading ? '识别中…' : '上传并识别'}
          </button>
          {file && <span className="text-sm text-gray-600">{file.name}</span>}
        </div>
        {!!error && <p className="mt-3 text-red-600 text-sm">{error}</p>}
      </section>

      {ocr && (
        <section className="rounded-xl border p-4">
          <h2 className="text-lg font-semibold mb-2">识别结果</h2>
          <div className="text-sm text-gray-600 mb-3">
            共 {ocr.count} 行（原始结果），当前仅展示「十重」
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {level10.length === 0 ? (
              <div className="text-gray-500">未检测到「十重」技能</div>
            ) : (
              level10.map((name, i) => (
                <div key={`${name}-${i}`} className="rounded-lg border px-3 py-2 bg-white">
                  {i + 1}. {name}
                </div>
              ))
            )}
          </div>

          <details className="mt-4">
            <summary className="cursor-pointer text-sm text-gray-700">查看原始 OCR 行</summary>
            <pre className="mt-2 text-xs whitespace-pre-wrap bg-gray-50 p-3 rounded">
{JSON.stringify(ocr.lines, null, 2)}
            </pre>
          </details>

          <details className="mt-4">
            <summary className="cursor-pointer text-sm text-gray-700">查看所有分桶（十→一）</summary>
            <pre className="mt-2 text-xs whitespace-pre-wrap bg-gray-50 p-3 rounded">
{JSON.stringify(buckets, null, 2)}
            </pre>
          </details>
        </section>
      )}
    </main>
  );
}
