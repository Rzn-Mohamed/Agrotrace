# app/core/config.py
import os
from pydantic_settings import BaseSettings
from pydantic import Field

class Settings(BaseSettings):
    PROJECT_NAME: str = "AgroTrace - RecoIrrigation"
    VERSION: str = "1.0.0"
    
    # Par défaut on tape sur localhost, mais Docker surchargera ça
    POSTGRES_USER: str = Field(default="postgres")
    POSTGRES_PASSWORD: str = Field(default="aeztic")
    POSTGRES_SERVER: str = Field(default="localhost")
    POSTGRES_DB: str = Field(default="agrotrace_db")
    
    # Configuration LLM pour l'analyse IA
    LLM_API_KEY: str = Field(default="")
    LLM_MODEL: str = Field(default="gemini-1.5-flash")
    
    # Pour utiliser SQLite en développement
    USE_SQLITE: str = Field(default="false")
    
    # Activer/désactiver les recommandations AI
    USE_AI_RECOMMENDATIONS: str = Field(default="true")
    
    # Configuration pour charger le fichier .env
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False
    
    # Construction dynamique de l'URL
    @property
    def DATABASE_URL(self) -> str:
        # Par défaut, utilisons PostgreSQL
        # Pour utiliser SQLite en développement, définissez USE_SQLITE=true
        if self.USE_SQLITE.lower() == "true":
            return "sqlite:///./agrotrace.db"
        else:
            return f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:5432/{self.POSTGRES_DB}"

settings = Settings()