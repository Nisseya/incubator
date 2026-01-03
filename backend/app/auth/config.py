from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env.local",),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    DATABASE_URL: str

    JWT_SECRET: str = "change-me"
    JWT_ALG: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MIN: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    CORS_ORIGINS: str = "*"

    GOOGLE_OAUTH_CLIENT_IDS: str = ""

    def cors_origins_list(self) -> list[str]:
        s = self.CORS_ORIGINS.strip()
        if s == "*":
            return ["*"]
        return [x.strip() for x in s.split(",") if x.strip()]

    def google_client_ids(self) -> list[str]:
        return [x.strip() for x in self.GOOGLE_OAUTH_CLIENT_IDS.split(",") if x.strip()]


settings = Settings()
