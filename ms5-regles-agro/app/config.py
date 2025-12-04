from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Configuration centralisée du microservice RèglesAgro."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        env_prefix="REGLES_AGRO_",
        validate_default=True,
    )

    app_name: str = "AgroTrace RèglesAgro"
    environment: str = Field(default="dev")

    # PostgreSQL pour les référentiels agricoles
    db_host: str = Field(default="timescaledb")
    db_port: int = Field(default=5432)
    db_name: str = Field(default="agrotrace_db")
    db_user: str = Field(default="agrotrace_admin")
    db_password: str = Field(default="")
    db_sslmode: str = Field(default="prefer")

    # Seuils pour les règles agronomiques
    soil_moisture_critical: float = Field(default=20.0, description="Seuil critique d'humidité du sol (%)")
    soil_moisture_low: float = Field(default=35.0, description="Seuil bas d'humidité du sol (%)")
    temperature_high: float = Field(default=30.0, description="Température élevée (°C)")
    temperature_critical: float = Field(default=35.0, description="Température critique (°C)")
    hydric_stress_threshold: float = Field(default=50.0, description="Seuil de stress hydrique (%)")
    ph_min: float = Field(default=6.0, description="pH minimum acceptable")
    ph_max: float = Field(default=7.5, description="pH maximum acceptable")

    def build_postgres_dsn(self) -> str:
        """Retourne une DSN PostgreSQL prête à l'emploi."""
        return (
            f"host={self.db_host} port={self.db_port} dbname={self.db_name} "
            f"user={self.db_user} password={self.db_password} sslmode={self.db_sslmode}"
        )


@lru_cache
def get_settings() -> Settings:
    """Instance unique de Settings (singleton)."""
    return Settings()

