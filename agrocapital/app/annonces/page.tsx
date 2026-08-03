"use client";

import { useEffect, useState, useCallback } from "react";
import { Tag, Plus, Calendar, BookmarkPlus, CheckCircle2 } from "lucide-react";
import { PageShell } from "@/_components/page-shell";
import { formatFcfa, CULTURES_COURANTES, REGIONS_TOGO, dateCourteFr } from "@/_lib/utils";
import { useCurrentUser } from "@/_hooks/useCurrentUser";

type Annonce = {
  id: string;
  culture: string;
  quantiteEstimee: number;
  prixEstime: number | null;
  dateRecoltePrevu: string;
  description: string | null;
  region: string;
  statut: string;
  userId: string;
  user: {
    nom: string;
    telephone: string;
    region: string;
  };
  _count?: {
    reservations: number;
  };
};

export default function AnnoncesPage() {
  const { user } = useCurrentUser();
  const [annonces, setAnnonces] = useState<Annonce[]>([]);
  const [loading, setLoading] = useState(true);

  // Formulaire nouvelle annonce (agriculteur)
  const [culture, setCulture] = useState("Maïs");
  const [quantiteEstimee, setQuantiteEstimee] = useState(5000);
  const [prixEstime, setPrixEstime] = useState(10000);
  const [dateRecoltePrevu, setDateRecoltePrevu] = useState("2026-10-15");
  const [description, setDescription] = useState("");
  const [region, setRegion] = useState("Plateaux");
  const [creationModal, setCreationModal] = useState(false);
  const [creerState, setCreerState] = useState(false);

  // Modale de réservation (client ou agriculteur acheteur)
  const [annonceSelectionnee, setAnnonceSelectionnee] = useState<Annonce | null>(null);
  const [quantiteReservation, setQuantiteReservation] = useState(100);
  const [commentaire, setCommentaire] = useState("");
  const [reserverState, setReserverState] = useState(false);
  const [succesRes, setSuccesRes] = useState(false);

  const loadAnnonces = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/annonces");
      if (res.ok) {
        const json = await res.json();
        setAnnonces(json.data.annonces ?? []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAnnonces();
  }, [loadAnnonces]);

  const handleCreerAnnonce = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreerState(true);

    try {
      const res = await fetch("/api/annonces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          culture,
          quantiteEstimee: Number(quantiteEstimee),
          prixEstime: Number(prixEstime),
          dateRecoltePrevu: new Date(dateRecoltePrevu).toISOString(),
          description: description.trim() || undefined,
          region,
        }),
      });

      if (res.ok) {
        setCreationModal(false);
        loadAnnonces();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCreerState(false);
    }
  };

  const handleReserver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annonceSelectionnee) return;

    setReserverState(true);

    try {
      const res = await fetch("/api/annonces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          annonceId: annonceSelectionnee.id,
          quantiteKg: Number(quantiteReservation),
          commentaire: commentaire.trim() || undefined,
        }),
      });

      if (res.ok) {
        setSuccesRes(true);
        loadAnnonces();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setReserverState(false);
    }
  };

  return (
    <PageShell>
      <div className="space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-eyebrow">Préventes & Réservations</p>
            <h1 className="mt-1 text-h1">Récoltes à Venir</h1>
          </div>
          {user?.role === "AGRICULTEUR" && (
            <button onClick={() => setCreationModal(true)} className="btn btn-primary btn-sm font-bold">
              <Plus size={16} /> Annoncer une récolte
            </button>
          )}
        </header>

        {loading ? (
          <div className="flex justify-center p-12">
            <span className="loading loading-spinner loading-lg text-primary" />
          </div>
        ) : annonces.length === 0 ? (
          <div className="card bg-white p-8 text-center border border-base-200 space-y-2">
            <Tag size={40} className="mx-auto text-muted" />
            <p className="text-sm font-semibold text-muted">Aucune récolte annoncée pour le moment.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {annonces.map((a) => (
              <div key={a.id} className="card bg-white border border-base-200 p-5 space-y-3 shadow-xs">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="badge badge-sm badge-outline font-bold text-primary mb-1">
                      {a.culture}
                    </span>
                    <h3 className="font-bold text-lg text-base-content">
                      Récolte prévue : {dateCourteFr(a.dateRecoltePrevu)}
                    </h3>
                    <p className="text-xs text-muted">Producteur : {a.user.nom} ({a.region})</p>
                  </div>
                  <span className="badge badge-primary font-bold text-xs">
                    {a.statut}
                  </span>
                </div>

                <div className="flex justify-between items-baseline bg-base-100 p-3 rounded-xl">
                  <div>
                    <span className="text-xs text-muted block">Quantité estimée :</span>
                    <strong className="text-base font-bold">{a.quantiteEstimee} kg</strong>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-muted block">Prix estimé :</span>
                    <strong className="text-base font-bold text-primary">{a.prixEstime ? formatFcfa(a.prixEstime) : "À négocier"}</strong>
                  </div>
                </div>

                {a.description && <p className="text-xs text-muted line-clamp-2">{a.description}</p>}

                <div className="flex justify-between items-center pt-2 border-t border-base-100">
                  <span className="text-xs text-muted font-semibold">
                    {a._count?.reservations ?? 0} réservation(s)
                  </span>
                  <button
                    onClick={() => {
                      setAnnonceSelectionnee(a);
                      setSuccesRes(false);
                    }}
                    className="btn btn-outline btn-primary btn-xs font-bold"
                  >
                    <BookmarkPlus size={14} /> Réserver ma part
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modale Création Annonce */}
        {creationModal && (
          <dialog className="modal modal-open">
            <div className="modal-box bg-white p-6 space-y-4">
              <h3 className="font-bold text-lg">Annoncer une récolte future</h3>
              <form onSubmit={handleCreerAnnonce} className="space-y-3">
                <div className="form-control gap-1">
                  <label htmlFor="a-cult" className="label-text text-xs font-bold">Culture</label>
                  <select
                    id="a-cult"
                    value={culture}
                    onChange={(e) => setCulture(e.target.value)}
                    className="select select-bordered select-md w-full font-bold"
                  >
                    {CULTURES_COURANTES.map((c) => {
                      const val = c.replace(/^[^\s]+\s/, "");
                      return <option key={val} value={val}>{c}</option>;
                    })}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="form-control gap-1">
                    <label htmlFor="a-qte" className="label-text text-xs font-bold">Quantité estimée (kg)</label>
                    <input
                      id="a-qte"
                      type="number"
                      value={quantiteEstimee}
                      onChange={(e) => setQuantiteEstimee(Number(e.target.value))}
                      className="input input-bordered input-md w-full font-bold"
                      required
                    />
                  </div>
                  <div className="form-control gap-1">
                    <label htmlFor="a-prix" className="label-text text-xs font-bold">Prix estimé (FCFA)</label>
                    <input
                      id="a-prix"
                      type="number"
                      value={prixEstime}
                      onChange={(e) => setPrixEstime(Number(e.target.value))}
                      className="input input-bordered input-md w-full font-bold"
                    />
                  </div>
                </div>

                <div className="form-control gap-1">
                  <label htmlFor="a-date" className="label-text text-xs font-bold flex items-center gap-1">
                    <Calendar size={14} /> Date de récolte prévue
                  </label>
                  <input
                    id="a-date"
                    type="date"
                    value={dateRecoltePrevu}
                    onChange={(e) => setDateRecoltePrevu(e.target.value)}
                    className="input input-bordered input-md w-full font-bold"
                    required
                  />
                </div>

                <div className="form-control gap-1">
                  <label htmlFor="a-reg" className="label-text text-xs font-bold">Région</label>
                  <select
                    id="a-reg"
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className="select select-bordered select-md w-full font-bold"
                  >
                    {REGIONS_TOGO.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                <div className="modal-action flex gap-2">
                  <button type="button" onClick={() => setCreationModal(false)} className="btn btn-ghost flex-1">
                    Annuler
                  </button>
                  <button type="submit" disabled={creerState} className="btn btn-primary flex-1 font-bold">
                    {creerState ? <span className="loading loading-spinner" /> : "Publier l'annonce"}
                  </button>
                </div>
              </form>
            </div>
          </dialog>
        )}

        {/* Modale Réservation */}
        {annonceSelectionnee && (
          <dialog className="modal modal-open">
            <div className="modal-box bg-white p-6 space-y-4">
              <h3 className="font-bold text-lg">Réserver sur la récolte de {annonceSelectionnee.culture}</h3>

              {succesRes ? (
                <div className="text-center py-6 space-y-3">
                  <CheckCircle2 size={48} className="text-primary mx-auto" />
                  <h4 className="text-h2">Réservation enregistrée !</h4>
                  <p className="text-sm text-muted">
                    L&apos;agriculteur {annonceSelectionnee.user.nom} vous tiendra informé lors du lancement de la récolte.
                  </p>
                  <button onClick={() => setAnnonceSelectionnee(null)} className="btn btn-primary btn-md w-full">
                    Fermer
                  </button>
                </div>
              ) : (
                <form onSubmit={handleReserver} className="space-y-3">
                  <div className="form-control gap-1">
                    <label htmlFor="res-qte" className="label-text text-xs font-bold">Quantité souhaitée en kg</label>
                    <input
                      id="res-qte"
                      type="number"
                      min={10}
                      value={quantiteReservation}
                      onChange={(e) => setQuantiteReservation(Number(e.target.value))}
                      className="input input-bordered input-lg font-bold text-xl w-full"
                      required
                    />
                  </div>

                  <div className="form-control gap-1">
                    <label htmlFor="res-comm" className="label-text text-xs font-bold">Commentaire / Préférence</label>
                    <textarea
                      id="res-comm"
                      placeholder="Ex: Intéressé si livraison à Lomé..."
                      value={commentaire}
                      onChange={(e) => setCommentaire(e.target.value)}
                      className="textarea textarea-bordered text-sm w-full"
                    />
                  </div>

                  <div className="modal-action flex gap-2">
                    <button type="button" onClick={() => setAnnonceSelectionnee(null)} className="btn btn-ghost flex-1">
                      Annuler
                    </button>
                    <button type="submit" disabled={reserverState} className="btn btn-primary flex-1 font-bold">
                      {reserverState ? <span className="loading loading-spinner" /> : "Confirmer ma réservation"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </dialog>
        )}
      </div>
    </PageShell>
  );
}
