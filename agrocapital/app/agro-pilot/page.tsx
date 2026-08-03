"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import {
  Sparkles,
  Send,
  TrendingUp,
  CloudSun,
  Landmark,
  Sprout,
  ArrowRight,
  ShieldCheck,
  Bot,
  User,
  Copy,
  Check,
  AlertTriangle,
  FileText,
  RefreshCw,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import { PageShell } from "@/_components/page-shell";
import { useCurrentUser } from "@/_hooks/useCurrentUser";

type Message = {
  id: string;
  sender: "user" | "bot";
  text: string;
  contexteUtilise?: boolean;
  timestamp: string;
};

type AnalyseRisqueData = {
  niveau_risque_global: "faible" | "modere" | "eleve";
  score_risque: number;
  risques_marche: string[];
  risques_climatiques: string[];
  recommandations: string[];
};

type DossierData = {
  type_demande: string;
  texte_dossier: string;
  documents_requis: string[];
  conseils_redaction: string;
};

export default function AgroPilotPage() {
  const { user } = useCurrentUser();
  const [activeTab, setActiveTab] = useState<"chat" | "financement" | "risques">("chat");

  // State Chat
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loadingChat, setLoadingChat] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // State Financement
  const [typeDemande, setTypeDemande] = useState<"pret_agricole" | "subvention" | "microfinance">("pret_agricole");
  const [dossier, setDossier] = useState<DossierData | null>(null);
  const [loadingDossier, setLoadingDossier] = useState(false);
  const [copied, setCopied] = useState(false);

  // State Risques
  const [risques, setRisques] = useState<AnalyseRisqueData | null>(null);
  const [loadingRisques, setLoadingRisques] = useState(false);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loadingChat]);

  // Initialisation du chat avec message bienveillant
  useEffect(() => {
    if (user && messages.length === 0) {
      setMessages([
        {
          id: "welcome-1",
          sender: "bot",
          text: `Bonjour **${user.nom}** ! Je suis **Agro-Pilot**, votre conseiller agricole virtuel.\n\nJe suis directement connecté à votre compte et à la région **${user.region}**. Posez-moi vos questions sur le marché, vos récoltes ou vos démarches.`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    }
  }, [user, messages.length]);

  // Chargement de l'analyse de risque au changement d'onglet
  useEffect(() => {
    if (activeTab === "risques" && !risques && !loadingRisques) {
      setLoadingRisques(true);
      fetch("/api/agro-pilot/analyse-risque")
        .then((res) => res.json())
        .then((json) => {
          if (json.success && json.data) {
            setRisques(json.data);
          }
        })
        .catch(console.error)
        .finally(() => setLoadingRisques(false));
    }
  }, [activeTab, risques, loadingRisques]);

  // Soumission du Chat
  const handleSendChat = useCallback(async (textToSend?: string) => {
    const query = textToSend || input.trim();
    if (!query || loadingChat) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput("");
    setLoadingChat(true);

    try {
      const res = await fetch("/api/agro-pilot/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: query }),
      });

      const json = await res.json();
      if (res.ok && json.data) {
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            sender: "bot",
            text: json.data.reponse,
            contexteUtilise: json.data.contexte_utilise,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            sender: "bot",
            text: "Impossible de récupérer les conseils pour le moment. Veuillez réessayer.",
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: "bot",
          text: "Erreur de connexion. Veuillez vérifier votre réseau.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setLoadingChat(false);
    }
  }, [input, loadingChat]);

  // Génération de dossier de financement
  const handleGenerateDossier = async () => {
    setLoadingDossier(true);
    setCopied(false);
    try {
      const res = await fetch("/api/agro-pilot/dossier-financement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ typeDemande }),
      });
      const json = await res.json();
      if (res.ok && json.data) {
        setDossier(json.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDossier(false);
    }
  };

  const handleCopyDossier = () => {
    if (!dossier) return;
    const textToCopy = `${dossier.texte_dossier}\n\nDOCUMENTS REQUIS :\n${dossier.documents_requis.map((d) => `- ${d}`).join("\n")}\n\nCONSEILS :\n${dossier.conseils_redaction}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <PageShell>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Header Persona Simplicité */}
        <div className="rounded-3xl bg-gradient-to-r from-emerald-800 to-emerald-950 p-6 sm:p-8 text-white shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-3.5 py-1.5 text-xs font-bold text-emerald-300 border border-emerald-500/30">
              <Sparkles size={14} className="text-emerald-400" />
              Agro-Pilot — Assistant Intelligent
            </div>
            {user && (
              <div className="text-xs font-semibold text-emerald-200 bg-white/10 px-3 py-1 rounded-full">
                {user.nom} ({user.region})
              </div>
            )}
          </div>
          <h1 className="mt-3 text-2xl sm:text-3xl font-extrabold text-white">
            Votre conseiller agricole personnel
          </h1>
          <p className="mt-1 text-sm text-emerald-100 max-w-xl">
            Posez une question, créez un dossier de prêt ou analysez les risques de votre exploitation sans saisie complexe.
          </p>

          {/* Onglets principaux — Grandes zones cliquables */}
          <div className="grid grid-cols-3 gap-2 mt-6 bg-white/10 p-1.5 rounded-2xl backdrop-blur-md">
            <button
              onClick={() => setActiveTab("chat")}
              className={`btn btn-md font-bold rounded-xl border-0 ${
                activeTab === "chat" ? "bg-white text-emerald-900 shadow-md" : "text-white hover:bg-white/10"
              }`}
            >
              <Bot size={18} /> Chat Conseiller
            </button>
            <button
              onClick={() => setActiveTab("financement")}
              className={`btn btn-md font-bold rounded-xl border-0 ${
                activeTab === "financement" ? "bg-white text-emerald-900 shadow-md" : "text-white hover:bg-white/10"
              }`}
            >
              <Landmark size={18} /> Dossier Prêt
            </button>
            <button
              onClick={() => setActiveTab("risques")}
              className={`btn btn-md font-bold rounded-xl border-0 ${
                activeTab === "risques" ? "bg-white text-emerald-900 shadow-md" : "text-white hover:bg-white/10"
              }`}
            >
              <ShieldCheck size={18} /> Risques
            </button>
          </div>
        </div>

        {/* ─── CONTENU ONGLET 1 : CHAT SIMPLE ──────────────────────────────── */}
        {activeTab === "chat" && (
          <div className="card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-lg overflow-hidden flex flex-col min-h-[500px]">
            {/* Bulles de dialogue */}
            <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 max-h-[500px]">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex gap-3 ${m.sender === "user" ? "flex-row-reverse" : "flex-row"}`}
                >
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl font-bold text-xs shadow-xs ${
                      m.sender === "user" ? "bg-slate-900 text-white" : "bg-emerald-600 text-white"
                    }`}
                  >
                    {m.sender === "user" ? <User size={18} /> : <Bot size={18} />}
                  </div>

                  <div
                    className={`space-y-2 max-w-[85%] rounded-3xl p-4 ${
                      m.sender === "user"
                        ? "bg-emerald-600 text-white rounded-tr-xs font-medium text-sm"
                        : "bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200/80 rounded-tl-xs"
                    }`}
                  >
                    <div className="text-sm leading-relaxed whitespace-pre-wrap font-medium">
                      {m.text}
                    </div>

                    {m.contexteUtilise && (
                      <div className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 px-2 py-0.5 rounded-md">
                        <Check size={12} /> Agro-Pilot a utilisé vos données de stock & marché
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {loadingChat && (
                <div className="flex gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white">
                    <Bot size={18} />
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-3xl rounded-tl-xs border border-slate-200 text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-2">
                    <span className="loading loading-dots loading-sm text-emerald-600" />
                    Analyse en cours... Un instant svp
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Saisie simple avec bouton d'envoi clair */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendChat();
              }}
              className="p-3 sm:p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex gap-2"
            >
              <input
                type="text"
                placeholder="Posez votre question à Agro-Pilot..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="input input-bordered input-lg flex-1 text-sm font-semibold text-slate-900 bg-slate-50 focus:bg-white border-slate-200 focus:border-emerald-600 rounded-2xl"
              />
              <button
                type="submit"
                disabled={loadingChat || !input.trim()}
                className="btn bg-emerald-600 hover:bg-emerald-700 text-white border-0 btn-lg font-bold rounded-2xl px-6"
              >
                <Send size={18} />
              </button>
            </form>
          </div>
        )}

        {/* ─── CONTENU ONGLET 2 : GENERATEUR DOSSIER FINANCEMENT ────────────── */}
        {activeTab === "financement" && (
          <div className="card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl space-y-6 shadow-md">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                Générateur de Dossier de Financement
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Choisissez le type de financement. Agro-Pilot génère votre dossier complet basé sur vos stocks enregistrés.
              </p>
            </div>

            {/* Sélecteur type demande */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setTypeDemande("pret_agricole")}
                className={`p-4 rounded-2xl border-2 text-left transition-all ${
                  typeDemande === "pret_agricole"
                    ? "border-emerald-600 bg-emerald-50/50 text-emerald-950 font-bold"
                    : "border-slate-200 text-slate-600"
                }`}
              >
                <span className="text-lg block">🏦</span>
                <span className="text-sm font-bold block">Prêt Agricole</span>
                <span className="text-[11px] text-slate-400">Banque commerciale</span>
              </button>

              <button
                type="button"
                onClick={() => setTypeDemande("microfinance")}
                className={`p-4 rounded-2xl border-2 text-left transition-all ${
                  typeDemande === "microfinance"
                    ? "border-emerald-600 bg-emerald-50/50 text-emerald-950 font-bold"
                    : "border-slate-200 text-slate-600"
                }`}
              >
                <span className="text-lg block">💰</span>
                <span className="text-sm font-bold block">Microfinance</span>
                <span className="text-[11px] text-slate-400">COOPEC / WAGES</span>
              </button>

              <button
                type="button"
                onClick={() => setTypeDemande("subvention")}
                className={`p-4 rounded-2xl border-2 text-left transition-all ${
                  typeDemande === "subvention"
                    ? "border-emerald-600 bg-emerald-50/50 text-emerald-950 font-bold"
                    : "border-slate-200 text-slate-600"
                }`}
              >
                <span className="text-lg block">🎁</span>
                <span className="text-sm font-bold block">Subvention</span>
                <span className="text-[11px] text-slate-400">Aide d&apos;État / MIFA</span>
              </button>
            </div>

            <button
              onClick={handleGenerateDossier}
              disabled={loadingDossier}
              className="btn bg-emerald-600 hover:bg-emerald-700 text-white border-0 btn-lg w-full font-bold rounded-2xl"
            >
              {loadingDossier ? (
                <span className="loading loading-spinner loading-sm" />
              ) : (
                <>
                  <FileText size={18} /> Générer mon dossier avec mes données
                </>
              )}
            </button>

            {/* Rendu du dossier généré */}
            {dossier && (
              <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex justify-between items-center">
                  <h3 className="font-extrabold text-base text-emerald-700 dark:text-emerald-400">
                    Dossier Généré — {dossier.type_demande.replace("_", " ").toUpperCase()}
                  </h3>
                  <button
                    onClick={handleCopyDossier}
                    className="btn btn-sm bg-emerald-600 text-white font-bold gap-1 rounded-xl"
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    {copied ? "Copié !" : "Copier le texte"}
                  </button>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 font-mono text-xs leading-relaxed whitespace-pre-wrap text-slate-800 dark:text-slate-200">
                  {dossier.texte_dossier}
                </div>

                {/* Checklist des pièces */}
                <div className="card bg-emerald-50/50 p-4 border border-emerald-200 rounded-2xl space-y-2">
                  <h4 className="font-bold text-xs text-emerald-900 uppercase">Documents à joindre au dossier :</h4>
                  <ul className="space-y-1 text-xs text-emerald-800 font-medium">
                    {dossier.documents_requis.map((doc, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <Check size={14} className="text-emerald-600" /> {doc}
                      </li>
                    ))}
                  </ul>
                </div>

                <p className="text-xs text-slate-500 italic bg-amber-50 p-3 rounded-xl border border-amber-200 text-amber-900">
                  💡 <strong>Conseil Agro-Pilot :</strong> {dossier.conseils_redaction}
                </p>
              </div>
            )}
          </div>
        )}

        {/* ─── CONTENU ONGLET 3 : ANALYSE DES RISQUES ─────────────────────── */}
        {activeTab === "risques" && (
          <div className="card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl space-y-6 shadow-md">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                Analyse Globale des Risques
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Évaluation automatique des risques climatiques et de marché sur votre exploitation.
              </p>
            </div>

            {loadingRisques ? (
              <div className="flex justify-center p-12">
                <span className="loading loading-spinner loading-lg text-emerald-600" />
              </div>
            ) : risques ? (
              <div className="space-y-6">
                {/* Niveau de risque global avec code couleur */}
                <div
                  className={`p-5 rounded-2xl border flex items-center justify-between ${
                    risques.niveau_risque_global === "faible"
                      ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                      : risques.niveau_risque_global === "modere"
                      ? "bg-amber-50 border-amber-200 text-amber-900"
                      : "bg-rose-50 border-rose-200 text-rose-900"
                  }`}
                >
                  <div>
                    <span className="text-xs font-bold uppercase block opacity-75">Niveau de risque global</span>
                    <strong className="text-2xl font-black uppercase">{risques.niveau_risque_global}</strong>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold block opacity-75">Score de risque</span>
                    <strong className="text-3xl font-black">{risques.score_risque} / 100</strong>
                  </div>
                </div>

                {/* Section Risques Marché & Climatiques */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="card bg-slate-50 dark:bg-slate-800 p-4 border border-slate-200 rounded-2xl space-y-2">
                    <h3 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                      <TrendingUp size={16} className="text-emerald-600" /> Risques de Marché
                    </h3>
                    <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                      {risques.risques_marche.map((rm, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-amber-500 font-bold">•</span> {rm}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="card bg-slate-50 dark:bg-slate-800 p-4 border border-slate-200 rounded-2xl space-y-2">
                    <h3 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                      <CloudSun size={16} className="text-teal-600" /> Risques Climatiques
                    </h3>
                    <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                      {risques.risques_climatiques.map((rc, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-teal-500 font-bold">•</span> {rc}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Recommandations */}
                <div className="card bg-emerald-50/60 p-5 border border-emerald-200 rounded-2xl space-y-2">
                  <h3 className="font-bold text-sm text-emerald-950 flex items-center gap-2">
                    <ShieldCheck size={18} className="text-emerald-600" /> Recommandations d&apos;Agro-Pilot
                  </h3>
                  <ul className="space-y-2 text-xs font-semibold text-emerald-900">
                    {risques.recommandations.map((rec, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <Check size={16} className="text-emerald-600 shrink-0" /> {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </PageShell>
  );
}
