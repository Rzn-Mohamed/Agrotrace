from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Configuration centralisée du microservice PrévisionEau."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        env_prefix="PREVISION_EAU_",
        validate_default=True,
    )

    app_name: str = "AgroTrace PrévisionEau"
    environment: str = Field(default="dev")

    db_host: str = Field(default="timescaledb")
    db_port: int = Field(default=5432)
    db_name: str = Field(default="agrotrace_db")
    db_user: str = Field(default="agrotrace_admin")
    db_password: str = Field(default="")
    db_sslmode: str = Field(default="prefer")

    default_horizon_days: int = Field(default=5, ge=1, le=14)
    max_horizon_days: int = Field(default=14, ge=1, le=30)
    min_history_days: int = Field(default=10, ge=5, le=90)
    history_window_days: int = Field(default=45, ge=7, le=180)

    resample_frequency: str = Field(default="1h")  # 'H' deprecated, utiliser 'h'
    aggregation_frequency: str = Field(default="1D")

    lstm_hidden_size: int = Field(default=64)
    lstm_layers: int = Field(default=2)
    lstm_dropout: float = Field(default=0.1)
    lstm_learning_rate: float = Field(default=1e-3)
    lstm_epochs: int = Field(default=35)
    lstm_sequence_hours: int = Field(default=24)

    irrigation_threshold: float = Field(default=55.0)
    irrigation_max_mm: float = Field(default=25.0)
    fallback_seed: int = Field(default=42)
    fallback_rows: int = Field(default=200)

    # Intégration avec RèglesAgro
    regles_agro_url: str = Field(
        default="http://ms5-regles:8004",
        description="URL de base du microservice RèglesAgro"
    )
    regles_agro_enabled: bool = Field(
        default=True,
        description="Activer l'intégration avec RèglesAgro"
    )
    regles_agro_timeout: int = Field(
        default=10,
        description="Timeout en secondes pour les appels à RèglesAgro"
    )

    def build_timescale_dsn(self) -> str:
        """Retourne une DSN PostgreSQL/Timescale prête à l'emploi."""

        return (
            f"host={self.db_host} port={self.db_port} dbname={self.db_name} "
            f"user={self.db_user} password={self.db_password} sslmode={self.db_sslmode}"
        )


@lru_cache
def get_settings() -> Settings:
    """Instance unique de Settings (singleton)."""

    return Settings()

