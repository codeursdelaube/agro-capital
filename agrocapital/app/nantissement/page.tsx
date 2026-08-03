import Image from "next/image";
import { PageShell } from "@/_components/page-shell";
import { CashRequestFlow } from "@/_components/cash-request-flow";
import { PedagogicTooltip } from "@/_components/tooltip";

export default function NantissementPage() {
  return (
    <PageShell>
      <div className="space-y-6">

        {/* En-tête */}
        <header>
          <p className="text-eyebrow">Cash sur votre téléphone</p>
          <div className="mt-2 flex items-center gap-2">
            <h1 className="text-h1">Utiliser mon stock</h1>
            <PedagogicTooltip
              label="Comprendre le nantissement"
              text="Vous gardez votre récolte. Elle sert de garantie pendant que vous recevez du cash. Vous la vendez plus tard au meilleur moment."
            />
          </div>
          <p className="mt-2 text-sm text-muted">
            Votre stock vous aide à attendre le bon prix, sans vendre dans l&apos;urgence.
          </p>
        </header>

        {/* Hero illustration */}
        <section className="card overflow-hidden bg-base-200 border border-base-300">
          <div className="flex items-center gap-4 p-5">
            <div className="flex-1">
              <h2 className="text-h2 text-base-content">
                Votre récolte vous aide aujourd&apos;hui.
              </h2>
              <p className="mt-2 text-sm text-muted">
                Du cash arrive sur votre Mobile Money en quelques heures.
              </p>
            </div>
            <div className="shrink-0">
              <Image
                src="/illustartion2.png"
                alt="Sac de récolte transformé en paiement mobile"
                width={400}
                height={400}
                className="h-28 w-28 object-contain"
              />
            </div>
          </div>
        </section>

        {/* Flux de demande */}
        <CashRequestFlow />

      </div>
    </PageShell>
  );
}