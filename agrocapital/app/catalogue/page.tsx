"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ShoppingBag, Store, Search, Filter, CheckCircle2, UserPlus } from "lucide-react";
import { PageShell } from "@/_components/page-shell";
import { formatFcfa, REGIONS_TOGO, CULTURES_COURANTES } from "@/_lib/utils";

type Produit = {
  id: string;
  culture: string;
  nom: string;
  description: string | null;
  prixUnitaire: number;
  uniteMesure: string;
  quantiteDisponible: number;
  statut: string;
  boutique: {
    id: string;
    nom: string;
    user: {
      id: string;
      nom: string;
      prenom: string | null;
      region: string;
      telephone: string;
    };
  };
};

function CatalogueForm() {
  const searchParams = useSearchParams();
  const boutiqueIdParam = searchParams.get("boutiqueId") ?? "";

  const [produits, setProduits] = useState<Produit[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtres
  const [culture, setCulture] = useState("");
  const [region, setRegion] = useState("");

  // Modale de commande
  const [produitSelectionne, setProduitSelectionne] = useState<Produit | null>(null);
  const [quantiteCommande, setQuantiteCommande] = useState(1);
  const [adresse, setAdresse] = useState("");
  const [commandeEnCours, setCommandeEnCours] = useState(false);
  const [commandeSucces, setCommandeSucces] = useState(false);
  const [erreurCommande, setErreurCommande] = useState<string | null>(null);

  const loadProduits = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (culture) params.set("culture", culture);
      if (region) params.set("region", region);
      if (boutiqueIdParam) params.set("boutiqueId", boutiqueIdParam);

      const res = await fetch(`/api/marketplace/produits?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setProduits(json.data.produits ?? []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [culture, region, boutiqueIdParam]);

  useEffect(() => {
    loadProduits();
  }, [loadProduits]);

  const handleOuvrirCommande = (p: Produit) => {
    setProduitSelectionne(p);
    setQuantiteCommande(1);
    setCommandeSucces(false);
    setErreurCommande(null);
  };

  const handlePasserCommande = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!produitSelectionne) return;

    setCommandeEnCours(true);
    setErreurCommande(null);

    try {
      const res = await fetch("/api/marketplace/commandes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          produitId: produitSelectionne.id,
          quantite: Number(quantiteCommande),
          adresseLivraison: adresse.trim() || undefined,
        }),
      });

      if (res.ok) {
        setCommandeSucces(true);
        loadProduits(); // Rafraîchir les stocks
      } else {
        const json = await res.json();
        setErreurCommande(json.error ?? "Commande impossible");
      }
    } catch {
      setErreurCommande("Erreur réseau");
    } finally {
      setCommandeEnCours(false);
    }
  };

  const handleSuivreAgriculteur = async (userId: string) => {
    try {
      await fetch("/api/notifications/suivis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ followedUserId: userId }),
      });
      alert("Abonnement enregistré ! Vous recevrez des notifications lors des futures récoltes.");
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <PageShell>
      <div className="space-y-6">
        <header>
          <p className="text-eyebrow">Marketplace Directe</p>
          <h1 className="mt-1 text-h1">Catalogue des Produits Vivriers</h1>
          <p className="mt-2 text-sm text-muted">
            Commandez directement auprès des agriculteurs togolais. Paiement sécurisé à la livraison via Mobile Money.
          </p>
        </header>

        {/* Filtres */}
        <div className="card bg-white p-4 border border-base-200 shadow-xs space-y-3">
          <div className="flex items-center gap-2 font-bold text-sm text-base-content">
            <Filter size={16} className="text-primary" /> Filtrer le catalogue
          </div>
          <div className="grid grid-cols-2 gap-3">
            <select
              value={culture}
              onChange={(e) => setCulture(e.target.value)}
              className="select select-bordered select-sm font-semibold w-full"
            >
              <option value="">Toutes les cultures</option>
              {CULTURES_COURANTES.map((c) => {
                const val = c.replace(/^[^\s]+\s/, "");
                return <option key={val} value={val}>{c}</option>;
              })}
            </select>

            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="select select-bordered select-sm font-semibold w-full"
            >
              <option value="">Toutes les régions</option>
              {REGIONS_TOGO.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Produits */}
        {loading ? (
          <div className="flex justify-center p-12">
            <span className="loading loading-spinner loading-lg text-primary" />
          </div>
        ) : produits.length === 0 ? (
          <div className="card bg-white p-8 text-center border border-base-200 space-y-2">
            <Search size={36} className="mx-auto text-muted" />
            <p className="text-sm font-semibold text-muted">Aucun produit ne correspond à vos filtres.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {produits.map((p) => {
              const estDispo = p.statut === "DISPONIBLE" && p.quantiteDisponible > 0;
              return (
                <div key={p.id} className="card bg-white border border-base-200 p-5 space-y-3 shadow-xs">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="badge badge-sm badge-outline font-bold text-primary mb-1">
                        {p.culture}
                      </span>
                      <h3 className="font-bold text-lg text-base-content">{p.nom}</h3>
                    </div>
                    <span className={`badge border-0 font-bold text-xs ${estDispo ? "bg-primary/10 text-primary" : "bg-error/20 text-error"}`}>
                      {estDispo ? `${p.quantiteDisponible} dispo` : "Rupture"}
                    </span>
                  </div>

                  <p className="text-2xl font-extrabold text-primary">
                    {formatFcfa(p.prixUnitaire)}{" "}
                    <span className="text-xs text-muted font-normal">/ {p.uniteMesure}</span>
                  </p>

                  <div className="flex items-center justify-between text-xs text-muted pt-2 border-t border-base-100">
                    <span className="flex items-center gap-1 font-semibold text-base-content">
                      <Store size={14} className="text-primary" />
                      {p.boutique.nom} ({p.boutique.user.region})
                    </span>
                    <button
                      onClick={() => handleSuivreAgriculteur(p.boutique.user.id)}
                      className="btn btn-ghost btn-xs text-primary font-bold gap-1"
                      title="Suivre cet agriculteur"
                    >
                      <UserPlus size={12} /> Suivre
                    </button>
                  </div>

                  <button
                    onClick={() => handleOuvrirCommande(p)}
                    disabled={!estDispo}
                    className="btn btn-primary btn-md w-full font-bold mt-2"
                  >
                    <ShoppingBag size={18} /> Commander maintenant
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Modale de Commande */}
        {produitSelectionne && (
          <dialog className="modal modal-open">
            <div className="modal-box bg-white p-6 space-y-4">
              <h3 className="font-bold text-lg text-base-content">
                Passer commande : {produitSelectionne.nom}
              </h3>

              {commandeSucces ? (
                <div className="text-center py-6 space-y-3">
                  <CheckCircle2 size={48} className="text-primary mx-auto" />
                  <h4 className="text-h2">Commande validée !</h4>
                  <p className="text-sm text-muted">
                    Le vendeur a été notifié. Vous règlerez{" "}
                    <strong>{formatFcfa(produitSelectionne.prixUnitaire * quantiteCommande)}</strong> à la livraison par Mobile Money.
                  </p>
                  <button
                    onClick={() => setProduitSelectionne(null)}
                    className="btn btn-primary btn-md w-full mt-2"
                  >
                    Fermer
                  </button>
                </div>
              ) : (
                <form onSubmit={handlePasserCommande} className="space-y-4">
                  {erreurCommande && <div className="alert alert-error text-xs">{erreurCommande}</div>}

                  <div className="form-control gap-1">
                    <label htmlFor="qte-cmd" className="label-text font-bold">Quantité souhaitée ({produitSelectionne.uniteMesure})</label>
                    <input
                      id="qte-cmd"
                      type="number"
                      min={1}
                      max={produitSelectionne.quantiteDisponible}
                      value={quantiteCommande}
                      onChange={(e) => setQuantiteCommande(Number(e.target.value))}
                      className="input input-bordered input-lg font-bold text-lg w-full"
                      required
                    />
                  </div>

                  <div className="form-control gap-1">
                    <label htmlFor="adr-cmd" className="label-text font-bold">Lieu / Adresse de livraison</label>
                    <input
                      id="adr-cmd"
                      type="text"
                      placeholder="Ex: Marché d'Adawlato, Lomé"
                      value={adresse}
                      onChange={(e) => setAdresse(e.target.value)}
                      className="input input-bordered w-full"
                    />
                  </div>

                  <div className="bg-base-200 p-3 rounded-xl flex justify-between items-center text-sm">
                    <span>Montant total à la livraison :</span>
                    <strong className="text-primary text-lg">{formatFcfa(produitSelectionne.prixUnitaire * quantiteCommande)}</strong>
                  </div>

                  <div className="modal-action flex gap-2">
                    <button
                      type="button"
                      onClick={() => setProduitSelectionne(null)}
                      className="btn btn-ghost flex-1"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={commandeEnCours}
                      className="btn btn-primary flex-1 font-bold"
                    >
                      {commandeEnCours ? <span className="loading loading-spinner" /> : "Confirmer la commande"}
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

export default function CataloguePage() {
  return (
    <Suspense fallback={<PageShell><div className="flex justify-center p-12"><span className="loading loading-spinner loading-lg text-primary" /></div></PageShell>}>
      <CatalogueForm />
    </Suspense>
  );
}
