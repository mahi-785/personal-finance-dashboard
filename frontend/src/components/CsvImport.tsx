import { useRef, useState } from "react";
import { api, ImportResult } from "../services/api";

export default function CsvImport({ onImported }: { onImported: () => Promise<void> }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    setResult(null);
    try {
      const res = await api.importCsv(file);
      setResult(res);
      if (res.imported > 0) await onImported();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div>
      <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 0 }}>
        Upload a CSV with columns: <code>date, description, category, amount, type</code>
      </p>
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileChange}
        disabled={uploading}
      />
      {uploading && <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 8 }}>Importing…</div>}
      {error && <div className="error-banner" style={{ marginTop: 10 }}>{error}</div>}
      {result && (
        <div style={{ marginTop: 12, fontSize: 13 }}>
          <div style={{ color: "var(--income)", fontWeight: 600 }}>
            Imported {result.imported} transaction{result.imported === 1 ? "" : "s"}.
          </div>
          {result.failed > 0 && (
            <div style={{ marginTop: 8 }}>
              <div style={{ color: "var(--expense)", fontWeight: 600 }}>
                {result.failed} row{result.failed === 1 ? "" : "s"} skipped:
              </div>
              <ul style={{ margin: "6px 0 0", paddingLeft: 18, color: "var(--muted)" }}>
                {result.errors.map((e) => (
                  <li key={e.row}>
                    Row {e.row}: {e.error}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
