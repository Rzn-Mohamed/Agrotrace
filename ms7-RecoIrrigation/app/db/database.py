from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from ..core.config import settings

# 1. Création du moteur (Engine)
# On récupère l'URL depuis ton fichier de config (qui gère localhost ou Docker automatiquement)
engine = create_engine(settings.DATABASE_URL)

# 2. Création de la session locale
# C'est l'usine qui va créer une nouvelle connexion pour chaque requête
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 3. Classe de base pour les modèles (ORM)
Base = declarative_base()

# 4. Dépendance (Dependency)
# Cette fonction sera appelée par tes routes API (dans routers/irrigation.py)
# pour obtenir une connexion à la base de données et la fermer proprement après.
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()