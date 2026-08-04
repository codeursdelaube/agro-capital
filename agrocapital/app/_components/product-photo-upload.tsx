"use client";
import { useRef, useState } from "react";
import { Camera, ImagePlus } from "lucide-react";
import { compressProductImage, MAX_IMAGE_SIZE } from "@/_lib/image-client";
import { useTranslations } from "next-intl";

export function ProductPhotoUpload({ produitId, initialUrl, onPrepared, onUploaded }: { produitId?: string; initialUrl?: string | null; onPrepared?: (file: File) => void; onUploaded?: (url: string) => void }) {
  const t = useTranslations("Components.photoUpload");
  const ref = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState(initialUrl ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function choose(file?: File) {
    if (!file) return;
    if (file.size > MAX_IMAGE_SIZE) return setError(t("imageTooHeavy"));
    setLoading(true);
    setError("");
    try {
      const image = await compressProductImage(file);
      setPreview(URL.createObjectURL(image));
      if (!produitId) return onPrepared?.(image);
      const fd = new FormData();
      fd.append("photo", image);
      const r = await fetch(`/api/marketplace/produits/${produitId}/photo`, { method: "POST", body: fd });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      const u = await fetch(`/api/marketplace/produits/${produitId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoUrl: j.data.publicUrl })
      });
      if (!u.ok) throw new Error(t("photoSaveError"));
      setPreview(j.data.publicUrl);
      onUploaded?.(j.data.publicUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("uploadError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-4 space-y-3">
      {preview && <img src={preview} alt={t("previewAlt")} className="h-40 w-full rounded-xl object-cover" />}
      <input
        ref={ref}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        className="hidden"
        onChange={e => choose(e.target.files?.[0])}
      />
      <button
        type="button"
        className="btn btn-outline btn-primary w-full"
        disabled={loading}
        onClick={() => ref.current?.click()}
      >
        {loading ? <span className="loading loading-spinner loading-sm" /> : preview ? <Camera size={18} /> : <ImagePlus size={18} />}
        {loading ? t("sending") : preview ? t("changePhoto") : t("addPhoto")}
      </button>
      {error && <p className="text-xs text-error">{error}</p>}
      <p className="text-xs text-muted">{t("fileHint")}</p>
    </div>
  );
}
