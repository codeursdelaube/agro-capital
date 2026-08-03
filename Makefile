# Agro-Capital — Backend FastAPI
# Commandes disponibles (nécessite make ou Git Bash / WSL sur Windows)

.PHONY: install dev lint clean

## Installe les dépendances dans le virtualenv
install:
	env\Scripts\pip install -r requirements.txt

## Démarre le serveur de développement avec rechargement automatique
dev:
	env\Scripts\uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

## Démarre en mode production (sans rechargement)
start:
	env\Scripts\uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 2

## Vérifie la syntaxe (nécessite flake8 : pip install flake8)
lint:
	env\Scripts\flake8 app/ --max-line-length=100 --exclude=env

## Supprime les caches Python
clean:
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null; \
	find . -name "*.pyc" -delete 2>/dev/null; \
	echo "Nettoyage terminé."
