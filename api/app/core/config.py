import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()


class Settings(BaseSettings):
    firebase_credentials_path: str = "firebase-credentials.json"
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()