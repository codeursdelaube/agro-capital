"use client";

import { useState } from "react";
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
  ChevronRight,
  Info,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useTranslations } from "next-intl";

type DiagnosticResult = {
  maladie: string;
  scoreConfiance: number;
  severite: "FAIBLE" | "MODEREE" | "ELEVEE";
  symptomes: string[];
  traitements: string[];
  prevention: string[];
};

export default function SanteCulturePage() {
  const t = useTranslations("SanteCulture");

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedCrop, setSelectedCrop] = useState<string>("Maïs");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(1);
  const [result, setResult] = useState<DiagnosticResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Échantillons prédéfinis pour test rapide
  const samples = [
    { crop: "Maïs", label: t("sampleMaize"), img: "/illustartion1.png" },
    { crop: "Manioc", label: t("sampleCassava"), img: "/illustartion3.png" },
    { crop: "Tomate", label: t("sampleTomato"), img: "/illustartion2.png" },
  ];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectSample = (sample: (typeof samples)[0]) => {
    setSelectedCrop(sample.crop);
    setSelectedImage(sample.img);
    setResult(null);
  };

  const handleRunDiagnostic = async () => {
    if (!selectedImage) return;

    setLoading(true);
    setError(null);
    setLoadingStep(1);

    // Animation de progression simulée
    setTimeout(() => setLoadingStep(2), 1200);

    try {
      const res = await fetch("/api/sante-culture/diagnostic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cropType: selectedCrop, image: selectedImage }),
      });

      const json = await res.json();

      if (json.success && json.data) {
        setTimeout(() => {
          setResult(json.data);
          setLoading(false);
        }, 2200);
      } else {
        throw new Error(json.error || "Échec du diagnostic");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Erreur de réseau lors de l'analyse.");
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedImage(null);
    setResult(null);
    setError(null);
  };

  return (
    <main className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-28 md:pb-12 space-y-8">
      
      {/* ── Header Banner ── */}
      <section className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-950 text-white p-6 sm:p-12 shadow-2xl border border-emerald-500/20">
        <div aria-hidden className="pointer-events-none absolute -top-24 -right-24 h-80 w-80 rounded-full bg-emerald-400/20 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-yellow-400/10 blur-3xl" />

        <div className="relative space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur-md px-4 py-1.5 text-xs font-extrabold border border-white/20">
            <Leaf size={15} className="text-emerald-300" />
            <span>Détection & Diagnostic IA</span>
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
            {t("title")}
          </h1>

          <p className="text-xs sm:text-base text-emerald-100 font-medium leading-relaxed">
            {t("subtitle")}
          </p>
        </div>
      </section>

      {/* ── Formulaire Upload & Échantillons ── */}
      <div className="grid lg:grid-cols-12 gap-6 sm:gap-8 items-start">
        
        {/* Left Column: Upload & Sample selection */}
        <div className="lg:col-span-6 space-y-6">
          <div className="rounded-3xl border border-slate-200/80 bg-white/80 backdrop-blur-sm p-4 sm:p-6 shadow-sm space-y-5">
            <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
              <UploadCloud size={20} className="text-emerald-600" />
              {t("uploadTitle")}
            </h2>

            {/* Drop Zone */}
            <div className="relative border-2 border-dashed border-emerald-300/80 hover:border-emerald-500 bg-emerald-50/40 rounded-2xl p-4 sm:p-6 text-center transition-colors">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="space-y-2 pointer-events-none">
                <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-white flex items-center justify-center mx-auto text-emerald-600 shadow-sm border border-emerald-100">
                  <Leaf size={24} />
                </div>
                <p className="text-xs sm:text-sm font-extrabold text-slate-800">
                  {t("uploadInstructions")}
                </p>
                <p className="text-[10px] sm:text-xs text-slate-500 font-medium">
                  {t("uploadFormats")}
                </p>
              </div>
            </div>

            {/* Selector d'échantillons */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <p className="text-[10px] sm:text-xs font-extrabold uppercase tracking-wider text-slate-400">
                {t("sampleTitle")}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {samples.map((s) => (
                  <button
                    key={s.crop}
                    type="button"
                    onClick={() => handleSelectSample(s)}
                    className={`p-3 rounded-2xl border text-xs font-bold text-center leading-tight transition-all ${
                      selectedCrop === s.crop && selectedImage === s.img
                        ? "border-emerald-500 bg-emerald-100/70 text-emerald-900 shadow-sm"
                        : "border-slate-200 bg-white hover:border-emerald-300 text-slate-700"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Preview & Action */}
        <div className="lg:col-span-6 space-y-6">
          <div className="rounded-3xl border border-slate-200/80 bg-white/80 backdrop-blur-sm p-6 shadow-sm space-y-6">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Stethoscope size={20} className="text-emerald-600" />
              Aperçu & Analyse
            </h2>

            {selectedImage ? (
              <div className="space-y-4">
                <div className="relative rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 h-64 flex items-center justify-center">
                  <Image
                    src={selectedImage}
                    alt="Plante sélectionnée"
                    width={400}
                    height={400}
                    className="object-contain h-full w-full p-4"
                  />
                  {loading && (
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex flex-col items-center justify-center text-white p-6 text-center space-y-3">
                      <div className="h-10 w-10 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                      <p className="text-sm font-extrabold">{t("analyzing")}</p>
                      <p className="text-xs text-emerald-200">
                        {loadingStep === 1 ? t("analyzingStep1") : t("analyzingStep2")}
                      </p>
                    </div>
                  )}
                </div>

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
              </div>
            ) : (
              <div className="h-64 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-2">
                <Info size={32} className="text-slate-300" />
                <p className="text-xs font-semibold">
                  Sélectionnez ou importez une photo de plante à gauche pour activer l&apos;analyse.
                </p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* ── Section Résultats Diagnostic ── */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.5 }}
            className="rounded-[2.5rem] border border-emerald-200 bg-gradient-to-br from-white via-emerald-50/30 to-white p-8 sm:p-10 shadow-xl space-y-8"
          >
            {/* Header Résultat */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-emerald-100 pb-6">
              <div className="space-y-1">
                <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full">
                  <CheckCircle2 size={14} />
                  {t("resultTitle")}
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
                  {result.maladie}
                </h2>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-sm font-extrabold bg-white px-4 py-2 rounded-2xl border border-emerald-200 text-emerald-800 shadow-xs">
                  {t("confidenceScore", { score: result.scoreConfiance })}
                </span>
                <span
                  className={`text-xs font-black px-4 py-2 rounded-2xl text-white shadow-xs ${
                    result.severite === "ELEVEE"
                      ? "bg-rose-600"
                      : result.severite === "MODEREE"
                      ? "bg-amber-500"
                      : "bg-emerald-600"
                  }`}
                >
                  {result.severite === "ELEVEE"
                    ? t("severityHigh")
                    : result.severite === "MODEREE"
                    ? t("severityMedium")
                    : t("severityLow")}
                </span>
              </div>
            </div>

            {/* Grille Détails Diagnostic */}
            <div className="grid md:grid-cols-3 gap-6">
              
              {/* Symptômes */}
              <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-3">
                <div className="flex items-center gap-2 text-slate-900 font-black text-base">
                  <AlertTriangle size={18} className="text-amber-500" />
                  {t("symptomsTitle")}
                </div>
                <ul className="space-y-2 text-xs text-slate-600 font-medium">
                  {result.symptomes.map((symp, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-amber-500 font-bold">•</span>
                      <span>{symp}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Traitements */}
              <div className="rounded-3xl border border-emerald-200/80 bg-emerald-50/50 p-6 shadow-xs space-y-3">
                <div className="flex items-center gap-2 text-emerald-900 font-black text-base">
                  <Stethoscope size={18} className="text-emerald-600" />
                  {t("treatmentsTitle")}
                </div>
                <ul className="space-y-2 text-xs text-emerald-950 font-medium">
                  {result.traitements.map((trait, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span>{trait}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Prévention */}
              <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-3">
                <div className="flex items-center gap-2 text-slate-900 font-black text-base">
                  <ShieldCheck size={18} className="text-blue-500" />
                  {t("preventionTitle")}
                </div>
                <ul className="space-y-2 text-xs text-slate-600 font-medium">
                  {result.prevention.map((prev, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-blue-500 font-bold">✓</span>
                      <span>{prev}</span>
                    </li>
                  ))}
                </ul>
              </div>

            </div>

            {/* Action Reset */}
            <div className="pt-4 flex justify-end">
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-extrabold text-slate-700 hover:border-emerald-300 hover:text-emerald-700 shadow-xs transition-all"
              >
                <RotateCcw size={16} />
                {t("newDiagnostic")}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </main>
  );
}
