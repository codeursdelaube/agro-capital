"""
test_app.py - Script de validation rapide du service FastAPI Agro-Capital.
Executer depuis le dossier backend_agrocapital :
    env/Scripts/python test_app.py
"""
import os
import sys

# Variables d'env mock pour le test (pas de vraie DB nécessaire)
os.environ.setdefault("DATABASE_URL", "postgresql+asyncpg://test:test@localhost:5432/test")
os.environ.setdefault("GEMINI_API_KEY", "test_key_for_import_validation")

print("=" * 60)
print("AGRO-CAPITAL — Validation des imports et logique metier")
print("=" * 60)

errors = []

# ── 1. Imports fondation ──────────────────────────────────────────────────────
try:
    from app.config import settings
    from app.database import engine, AsyncSessionLocal
    from app.dependencies import get_db
    from app.cache.store import get_prediction, set_prediction, get_context
    print("[OK] Fondation : config, database, dependencies, cache")
except Exception as e:
    errors.append(f"ERREUR fondation: {e}")
    print(f"[ERREUR] Fondation: {e}")

# ── 2. Schemas Pydantic ───────────────────────────────────────────────────────
try:
    from app.schemas.market_radar import PredictRequest, PredictResponse, ScoreVenteResponse
    from app.schemas.agro_pilot import (
        ChatRequest, ChatResponse, RecommandationCultureResponse,
        MeilleurMomentVenteResponse, PeriodePlantationResponse,
        AnalyseRisqueResponse, DossierFinancementRequest, DossierFinancementResponse,
    )
    print("[OK] Schemas Pydantic : market_radar + agro_pilot")
except Exception as e:
    errors.append(f"ERREUR schemas: {e}")
    print(f"[ERREUR] Schemas: {e}")

# ── 3. Market Radar ───────────────────────────────────────────────────────────
try:
    from app.market_radar.synthetic import generate_price_history, PRIX_BASE
    df = generate_price_history("mais", "Maritime", n_jours=365)
    assert len(df) == 365
    assert df["prix_par_kg"].mean() > 50
    print(f"[OK] Donnees synthetiques : {len(df)} lignes, prix moy = {df['prix_par_kg'].mean():.0f} FCFA/kg")
except Exception as e:
    errors.append(f"ERREUR synthetic: {e}")
    print(f"[ERREUR] Synthetic: {e}")

try:
    from app.market_radar.forecaster import predict_price, classify_direction, compute_score_vente
    result = predict_price(df, horizon_jours=15)
    assert "prix_actuel" in result
    assert "prix_prevu" in result
    assert result["prix_actuel"] > 0
    tendance, confiance = classify_direction(result["prix_actuel"], result["prix_prevu"])
    assert tendance in ("hausse", "baisse", "stable")
    assert 0 <= confiance <= 1
    score, interp, justif = compute_score_vente(
        result["prix_actuel"], result["prix_prevu"],
        tendance, confiance, df["prix_par_kg"].mean()
    )
    assert 0 <= score <= 100
    print(f"[OK] Forecaster : prix_actuel={result['prix_actuel']:.0f}, prix_prevu={result['prix_prevu']:.0f}, tendance={tendance}, score={score}")
except Exception as e:
    errors.append(f"ERREUR forecaster: {e}")
    print(f"[ERREUR] Forecaster: {e}")

try:
    from app.market_radar.router import router as mr_router
    routes_mr = [r.path for r in mr_router.routes]
    assert "/predict" in routes_mr or any("predict" in p for p in routes_mr)
    print(f"[OK] Market Radar router : {routes_mr}")
except Exception as e:
    errors.append(f"ERREUR market_radar router: {e}")
    print(f"[ERREUR] Market Radar router: {e}")

# ── 4. Agro-Pilot ─────────────────────────────────────────────────────────────
try:
    from app.agro_pilot.risk_analyzer import analyze_risk, get_plantation_period
    ctx = {
        "user": {"region": "Maritime", "nom": "Test"},
        "stocks": [{"culture": "mais", "quantite_kg": 500, "valeur_estimee": 110000,
                    "statut": "ACTIF", "date": "2026-05-01", "id": "abc"}],
        "ventes_recentes": [],
        "annonces_recolte": [],
        "resume_stats": {"ca_90j_fcfa": 0, "kg_vendus_90j": 0,
                         "culture_principale": "mais", "stock_total_kg": 500, "nb_cultures_en_stock": 1},
    }
    risk = analyze_risk(ctx)
    assert risk["niveau_risque_global"] in ("faible", "modere", "eleve")
    assert 0 <= risk["score_risque"] <= 100

    plant = get_plantation_period("mais", "Maritime")
    assert "periode_optimale" in plant
    assert 1 <= plant["mois_debut"] <= 12
    print(f"[OK] Risk analyzer : niveau={risk['niveau_risque_global']}, score={risk['score_risque']}")
    print(f"[OK] Plantation mais/Maritime : {plant['periode_optimale']}")
except Exception as e:
    errors.append(f"ERREUR risk_analyzer: {e}")
    print(f"[ERREUR] Risk analyzer: {e}")

try:
    from app.agro_pilot.context_builder import format_context_for_llm
    texte = format_context_for_llm(ctx)
    assert "Maritime" in texte
    assert len(texte) > 50
    print(f"[OK] Context builder : {len(texte)} caracteres generes")
except Exception as e:
    errors.append(f"ERREUR context_builder: {e}")
    print(f"[ERREUR] Context builder: {e}")

try:
    from app.agro_pilot.router import router as ap_router
    routes_ap = [r.path for r in ap_router.routes]
    expected = ["/chat", "/recommandation-culture", "/meilleur-moment-vente",
                "/periode-plantation", "/analyse-risque", "/dossier-financement"]
    for ep in expected:
        assert any(ep in p for p in routes_ap), f"Route manquante: {ep}"
    print(f"[OK] Agro-Pilot router : {len(routes_ap)} routes detectees")
except Exception as e:
    errors.append(f"ERREUR agro_pilot router: {e}")
    print(f"[ERREUR] Agro-Pilot router: {e}")

# ── 5. App principale ─────────────────────────────────────────────────────────
try:
    from app.main import app
    assert app.title == "Agro-Capital — Backend IA"
    # app.routes contient des APIRoute et des _IncludedRouter (sans .path)
    routes_all = [r.path for r in app.routes if hasattr(r, "path")]
    print(f"[OK] app.main : {len(app.routes)} objets montes, {len(routes_all)} routes directes")
except Exception as e:
    errors.append(f"ERREUR main: {e}")
    print(f"[ERREUR] main: {e}")

# ── 6. Test schema Pydantic complet ──────────────────────────────────────────
try:
    resp = PredictResponse(
        culture="mais",
        region="Maritime",
        tendance="hausse",
        confiance=0.78,
        prix_actuel=220.0,
        prix_prevu_j15=265.0,
        recommandation="Attendez 10-15 jours avant de vendre.",
        donnees_demo=True,
    )
    assert resp.tendance == "hausse"
    print(f"[OK] Schema PredictResponse valide : {resp.model_dump()}")
except Exception as e:
    errors.append(f"ERREUR schema PredictResponse: {e}")
    print(f"[ERREUR] Schema: {e}")

# ── Resultat final ────────────────────────────────────────────────────────────
print()
print("=" * 60)
if errors:
    print(f"ECHEC — {len(errors)} erreur(s) detectee(s):")
    for err in errors:
        print(f"  - {err}")
    sys.exit(1)
else:
    print("SUCCES COMPLET — Tous les modules sont operationnels")
    print("Prochaine etape : configurer .env et lancer uvicorn")
print("=" * 60)
