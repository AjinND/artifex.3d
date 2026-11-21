"use client";
import { useState } from "react";
import styles from "./studio.module.css";

export default function MediaUpload({
  onUse,
}: {
  onUse: (path: string) => void;
}) {
  const [paths, setPaths] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function upload(file?: File) {
    if (!file || uploading) return;
    setError("");
    setMessage("");
    setUploading(true);
    try {
      const res = await fetch(
        "/api/staff/media?ext=" +
          encodeURIComponent(file.name.split(".").pop()?.toLowerCase() || ""),
        { method: "POST", body: file },
      );
      const r = await res.json();
      if (!res.ok) throw new Error(r.error);
      setPaths((previous) => [...new Set([...previous, r.data.url])]);
      setMessage("File uploaded. Choose where to use it in the listing.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploading(false);
    }
  }
  return (
    <details className={styles.mediaPanel}>
      <summary>Upload approved public media</summary>
      <p>Choose a studio photo or reduced-detail public GLB, up to 10 MB.</p>
      <input
        type="file"
        aria-label="Approved catalog asset"
        accept=".jpg,.jpeg,.webp,.png,.glb"
        disabled={uploading}
        onChange={(e) => {
          const file = e.currentTarget.files?.[0];
          e.currentTarget.value = "";
          void upload(file);
        }}
      />
      <p role="status" hidden={!uploading && !message}>
        {uploading ? "Uploading media…" : message}
      </p>
      {error && <p role="alert">{error}</p>}
      {paths.length > 0 && (
        <ul aria-label="Uploaded asset paths">
          {paths.map((path) => (
            <li key={path}>
              <code>{path}</code>
              <button
                className="shop-secondary"
                type="button"
                onClick={() => onUse(path)}
              >
                {path.endsWith(".glb")
                  ? "Use as 3D preview"
                  : "Add to approved photos"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </details>
  );
}
