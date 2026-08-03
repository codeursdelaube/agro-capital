# Agro-Capital — Backend FastAPI

Service FastAPI analytique (lecture seule) pour la plateforme Agro-Capital.
Construit pour le hackathon étudiant **Djanta 2026** 🇹🇬

## Modules

| Module | Préfixe | Description |
|---|---|---|
| Market Radar | `/market-radar` | Prédictions de prix agricoles à J+15 (Prophet + sklearn) |
| Agro-Pilot | `/agro-pilot` | Assistant IA personnalisé (Gemini 1.5 Flash) |

## Architecture

```
Ce service est en LECTURE SEULE sur Supabase PostgreSQL.
Next.js gère tous les CRUD (comptes, commandes, paiements).
FastAPI est le cerveau analytique uniquement.
```

## Prérequis

- Python 3.11+
- Un environnement virtuel (le dossier `env/` est déjà créé)
- Compte Supabase avec la base de données Agro-Capital
- Clé API Google Gemini (gratuite sur [aistudio.google.com](https://aistudio.google.com/app/apikey))

## Installation

```bash
# 1. Activer l'environnement virtuel
# Windows :
env\Scripts\activate
# Linux/Mac :
source env/bin/activate

# 2. Installer les dépendances
pip install -r requirements.txt

# 3. Configurer les variables d'environnement
copy .env.example .env
# Éditer .env avec vos vraies valeurs
```

## Configuration (.env)

```dotenv
DATABASE_URL=postgresql+asyncpg://USER:PASSWORD@HOST:5432/postgres
GEMINI_API_KEY=your_gemini_api_key_here
ALLOWED_ORIGINS=http://localhost:3000,https://votre-domaine-nextjs.com
PREDICTION_CACHE_TTL=1800
```

> **Note sur la base de données** : Utilisez de préférence un rôle PostgreSQL
> en lecture seule sur Supabase (Settings → Database → Roles).
> Le Connection Pooler Supabase (port 6543) est recommandé en production.

## Démarrage

```bash
# Développement (avec rechargement automatique)
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Ou via le Makefile (Git Bash / WSL)
make dev
```

## Documentation API

Une fois lancé, accédez à :
- Swagger UI : http://localhost:8000/docs
- ReDoc : http://localhost:8000/redoc
- Health check : http://localhost:8000/health

## Endpoints disponibles

### Market Radar

```
POST /market-radar/predict
     Body: {"culture": "maïs", "region": "Maritime"}
     → Prédiction J+15 avec tendance, confiance, recommandation

GET  /market-radar/score-vente?culture=maïs&region=Maritime
     → Score 0-100 d'opportunité de vente
```

### Agro-Pilot

```
POST /agro-pilot/chat
     Body: {"user_id": "uuid", "message": "Dois-je vendre mon maïs maintenant ?"}

GET  /agro-pilot/recommandation-culture?user_id=uuid

GET  /agro-pilot/meilleur-moment-vente?user_id=uuid&stock_id=uuid

GET  /agro-pilot/periode-plantation?culture=maïs&region=Maritime

GET  /agro-pilot/analyse-risque?user_id=uuid

POST /agro-pilot/dossier-financement
     Body: {"user_id": "uuid", "type_demande": "pret_agricole"}
```

## ⚠️ Adaptation du schéma DB

Les noms de colonnes SQL dans ce code correspondent au schéma décrit dans le brief.
Si le schéma Prisma réel diffère (noms en camelCase ou colonnes renommées), adapter les
requêtes dans les fichiers suivants :

- `app/agro_pilot/context_builder.py` — requêtes users, stocks, commandes, annonces_recolte
- `app/market_radar/service.py` — requête prix_historiques
- `app/agro_pilot/service.py` — requête recommandations_culture

## Notes Prophet (installation)

Prophet nécessite `cmdstanpy` sur Windows :

```bash
pip install pystan==2.19.1.1   # Option A (plus simple)
# OU
pip install cmdstanpy          # Option B, puis :
python -c "import cmdstanpy; cmdstanpy.install_cmdstan()"
pip install prophet
```

En cas d'échec, le service bascule automatiquement sur la régression linéaire (fallback intégré).

## Structure du projet

```
backend_agrocapital/
├── app/
│   ├── main.py                    # FastAPI app + CORS + routers
│   ├── config.py                  # Settings (pydantic-settings)
│   ├── database.py                # Engine SQLAlchemy async
│   ├── dependencies.py            # get_db()
│   ├── cache/store.py             # TTLCache in-memory
│   ├── schemas/                   # Modèles Pydantic I/O
│   ├── market_radar/              # Module Market Radar
│   │   ├── router.py
│   │   ├── service.py
│   │   ├── forecaster.py          # Prophet + fallback linéaire
│   │   └── synthetic.py           # Données démo (fallback)
│   └── agro_pilot/                # Module Agro-Pilot
│       ├── router.py
│       ├── service.py
│       ├── context_builder.py     # Contexte agriculteur depuis DB
│       ├── llm_client.py          # Gemini 1.5 Flash
│       ├── risk_analyzer.py       # Analyse risques (règles métier)
│       └── financement.py         # Dossiers de financement
├── env/                           # Virtualenv Python
├── .env.example                   # Template variables d'environnement
├── requirements.txt
├── Makefile
└── README.md
```
