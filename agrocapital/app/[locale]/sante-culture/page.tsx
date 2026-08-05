"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import {
  Leaf,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  Stethoscope,
  Info,
  Camera,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useTranslations } from "next-intl";

// ─── Types FastAPI ─────────────────────────────────────────────────────────────

type MaladiePossible = {
  nom: string;
  confiance: "élevée" | "modérée" | "faible" | string;
  symptomes_observes: string[];
  recommandation: string;
};

type DiagnosticResult = {
  culture_identifiee: string;
  etat_general: "sain" | "maladie_probable" | "stress_hydrique" | "indéterminé" | string;
  maladies_possibles: MaladiePossible[];
  conseil_general: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function confianceBadge(confiance: string) {
  if (confiance === "élevée")
    return "bg-rose-100 text-rose-800 border-rose-200";
  if (confiance === "modérée")
    return "bg-amber-100 text-amber-800 border-amber-200";
  return "bg-slate-100 text-slate-700 border-slate-200";
}

function confianceLabel(confiance: string) {
  if (confiance === "élevée") return "⚠️ Confiance élevée";
  if (confiance === "modérée") return "〰️ Confiance modérée";
  return "🔍 Confiance faible";
}

export default function SanteCulturePage() {
  const t = useTranslations("SanteCulture");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(1);
  const [result, setResult] = useState<DiagnosticResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ─── Sélection fichier ─────────────────────────────────────────────────────

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setResult(null);
    setError(null);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setResult(null);
    setError(null);
  };

  // ─── Lancement du diagnostic ───────────────────────────────────────────────

  const handleRunDiagnostic = async () => {
    if (!selectedFile) return;

    setLoading(true);
    setError(null);
    setLoadingStep(1);

    const stepTimer = setTimeout(() => setLoadingStep(2), 2000);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const res = await fetch("/api/agro-pilot/diagnostic-image", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();

      if (json.success && json.data) {
        // Délai min pour que l'animation soit visible
        await new Promise((r) => setTimeout(r, 1000));
        setResult(json.data as DiagnosticResult);
      } else {
        throw new Error(json.error || "Le diagnostic a échoué.");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erreur réseau.";
      setError(message);
    } finally {
      clearTimeout(stepTimer);
      setLoading(false);
    }
  };

  const handleReset = () => {
    setPreviewUrl(null);
    setSelectedFile(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const isHealthy =
    result && result.etat_general === "sain" && result.maladies_possibles.length === 0;

  return (
    <main className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-28 md:pb-12 space-y-8">

      {/* ── Header Banner ── */}
      <section className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-950 text-white p-6 sm:p-12 shadow-2xl border border-emerald-500/20">
        <div aria-hidden className="pointer-events-none absolute -top-24 -right-24 h-80 w-80 rounded-full bg-emerald-400/20 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-yellow-400/10 blur-3xl" />

        <div className="relative space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur-md px-4 py-1.5 text-xs font-extrabold border border-white/20">
            <Leaf size={15} className="text-emerald-300" />
            <span>Détection &amp; Diagnostic IA — Gemini Vision</span>
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
            {t("title")}
          </h1>

          <p className="text-xs sm:text-base text-emerald-100 font-medium leading-relaxed">
            {t("subtitle")}
          </p>
        </div>
      </section>

      {/* ── Upload + Aperçu ── */}
      <div className="grid lg:grid-cols-12 gap-6 items-start">

        {/* Zone Upload */}
        <div className="lg:col-span-6 space-y-4">
          <div className="rounded-3xl border border-slate-200/80 bg-white/80 backdrop-blur-sm p-4 sm:p-6 shadow-sm space-y-5">
            <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
              <UploadCloud size={20} className="text-emerald-600" />
              {t("uploadTitle")}
            </h2>

            {/* Drop zone */}
            <div
              className="relative border-2 border-dashed border-emerald-300/80 hover:border-emerald-500 bg-emerald-50/40 rounded-2xl p-6 text-center transition-colors cursor-pointer"
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="hidden"
                id="plant-image-input"
              />
              <div className="space-y-3 pointer-events-none">
                <div className="h-14 w-14 rounded-2xl bg-white flex items-center justify-center mx-auto text-emerald-600 shadow-sm border border-emerald-100">
                  <Camera size={26} />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-extrabold text-slate-800">
                    {t("uploadInstructions")}
                  </p>
                  <p className="text-[10px] sm:text-xs text-slate-500 font-medium mt-1">
                    {t("uploadFormats")} · Max 5 Mo
                  </p>
                </div>
              </div>
            </div>

            {/* Bouton galerie explicite sur mobile */}
            <label
              htmlFor="plant-image-input"
              className="flex items-center justify-center gap-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 cursor-pointer hover:border-emerald-300 hover:text-emerald-700 transition-all"
            >
              <UploadCloud size={16} className="text-emerald-600" />
              Choisir depuis la galerie
            </label>
          </div>
        </div>

        {/* Aperçu + Action */}
        <div className="lg:col-span-6">
          <div className="rounded-3xl border border-slate-200/80 bg-white/80 backdrop-blur-sm p-6 shadow-sm space-y-6">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Stethoscope size={20} className="text-emerald-600" />
              Aperçu &amp; Analyse
            </h2>

            {previewUrl ? (
              <div className="space-y-4">
                <div className="relative rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 h-64 flex items-center justify-center">
                  <Image
                    src={previewUrl}
                    alt="Plante à analyser"
                    fill
                    className="object-contain p-3"
                  />
                  {loading && (
                    <div className="absolute inset-0 bg-slate-900/65 backdrop-blur-xs flex flex-col items-center justify-center text-white p-6 text-center space-y-3">
                      <div className="h-12 w-12 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                      <p className="text-sm font-extrabold">{t("analyzing")}</p>
                      <p className="text-xs text-emerald-200 max-w-48">
                        {loadingStep === 1 ? t("analyzingStep1") : t("analyzingStep2")}
                      </p>
                    </div>
                  )}
                </div>

                {error && (
                  <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4 text-xs font-bold text-rose-800 flex items-start gap-2">
                    <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                    {error}
                  </div>
                )}

                {!result && !loading && (
                  <button
                    type="button"
                    onClick={handleRunDiagnostic}
                    className="w-full inline-flex items-center justify-center gap-2.5 rounded-2xl bg-emerald-600 px-6 py-4 text-base font-extrabold text-white shadow-xl shadow-emerald-600/25 hover:bg-emerald-700 active:scale-95 transition-all"
                  >
                    <Sparkles size={18} />
                    Lancer le diagnostic IA
                  </button>
                )}

                {result && !loading && (
                  <button
                    type="button"
                    onClick={handleReset}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-extrabold text-slate-700 hover:border-emerald-300 hover:text-emerald-700 transition-all"
                  >
                    <RotateCcw size={16} />
                    {t("newDiagnostic")}
                  </button>
                )}
              </div>
            ) : (
              <div className="h-64 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-2">
                <Info size={32} className="text-slate-300" />
                <p className="text-xs font-semibold">
                  Importez ou prenez en photo une plante pour activer l&apos;analyse IA.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Résultats ── */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.45 }}
            className="space-y-6"
          >
            {/* ── Cas : plante saine ── */}
            {isHealthy ? (
              <div className="rounded-[2.5rem] border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-8 sm:p-10 shadow-xl flex flex-col sm:flex-row items-center gap-6">
                <div className="h-16 w-16 shrink-0 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-lg">
                  <CheckCircle2 size={32} />
                </div>
                <div className="space-y-1 text-center sm:text-left">
                  <span className="inline-block text-xs font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full mb-1">
                    Plante saine
                  </span>
                  <h2 className="text-2xl font-black text-slate-900">
                    Aucune maladie détectée ✓
                  </h2>
                  <p className="text-sm text-slate-600 font-medium leading-relaxed">
                    {result.conseil_general}
                  </p>
                </div>
              </div>
            ) : (
              /* ── Cas : maladies détectées ── */
              <div className="rounded-[2.5rem] border border-amber-200 bg-gradient-to-br from-white via-amber-50/30 to-white p-6 sm:p-10 shadow-xl space-y-8">

                {/* En-tête résultat */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-6">
                  <div className="space-y-1">
                    <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-amber-800 bg-amber-100 px-3 py-1 rounded-full">
                      <AlertTriangle size={13} />
                      {t("resultTitle")}
                    </span>
                    <h2 className="text-xl sm:text-3xl font-black text-slate-900">
                      Culture identifiée : <span className="text-emerald-700 capitalize">{result.culture_identifiee}</span>
                    </h2>
                  </div>
                  <span
                    className={`text-xs font-black px-4 py-2 rounded-2xl border shadow-xs ${
                      result.etat_general === "sain"
                        ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                        : result.etat_general === "maladie_probable"
                        ? "bg-rose-100 text-rose-800 border-rose-200"
                        : "bg-amber-100 text-amber-800 border-amber-200"
                    }`}
                  >
                    {result.etat_general === "sain"
                      ? "✓ État sain"
                      : result.etat_general === "maladie_probable"
                      ? "⚠️ Maladie probable"
                      : result.etat_general === "stress_hydrique"
                      ? "💧 Stress hydrique"
                      : "🔍 " + result.etat_general}
                  </span>
                </div>

                {/* Liste des maladies */}
                <div className="space-y-5">
                  {result.maladies_possibles.map((m, i) => (
                    <div
                      key={i}
                      className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs space-y-4"
                    >
                      {/* Nom + badge confiance */}
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 shrink-0 rounded-2xl bg-rose-100 flex items-center justify-center">
                            <AlertTriangle size={18} className="text-rose-600" />
                          </div>
                          <h3 className="font-extrabold text-base text-slate-900 leading-tight">
                            {m.nom}
                          </h3>
                        </div>
                        <span
                          className={`text-[11px] font-black px-3 py-1 rounded-full border ${confianceBadge(m.confiance)}`}
                        >
                          {confianceLabel(m.confiance)}
                        </span>
                      </div>

                      {/* Symptômes + Recommandation */}
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="rounded-2xl bg-slate-50 border border-slate-200/60 p-4 space-y-2">
                          <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                            Symptômes observés
                          </p>
                          <ul className="space-y-1.5">
                            {m.symptomes_observes.map((s, j) => (
                              <li key={j} className="flex items-start gap-2 text-xs text-slate-700 font-medium">
                                <span className="text-amber-500 font-bold mt-0.5">•</span>
                                {s}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="rounded-2xl bg-emerald-50 border border-emerald-200/60 p-4 space-y-2">
                          <p className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-600">
                            Recommandation
                          </p>
                          <p className="text-xs text-emerald-900 font-medium leading-relaxed">
                            {m.recommandation}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Conseil général */}
                {result.conseil_general && (
                  <div className="rounded-2xl bg-slate-900 border border-emerald-500/30 p-5 flex items-start gap-3">
                    <ShieldCheck size={20} className="text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-extrabold uppercase tracking-wider text-emerald-400 mb-1">
                        Conseil Agro-Pilot
                      </p>
                      <p className="text-sm text-white font-medium leading-relaxed">
                        {result.conseil_general}
                      </p>
                    </div>
                  </div>
                )}

                {/* Nouveau diagnostic */}
                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-extrabold text-slate-700 hover:border-emerald-300 hover:text-emerald-700 shadow-xs transition-all"
                  >
                    <RotateCcw size={16} />
                    {t("newDiagnostic")}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
