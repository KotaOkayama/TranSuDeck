import os
from pathlib import Path
from typing import Dict, List, Optional

import httpx
from pydantic import ConfigDict
from pydantic_settings import BaseSettings

# 設定ディレクトリのパス（環境変数から取得、デフォルトはカレントディレクトリ）
CONFIG_DIR = os.getenv("CONFIG_DIR", ".")
CONFIG_PATH = Path(CONFIG_DIR)
CONFIG_PATH.mkdir(parents=True, exist_ok=True)

# .envファイルのパス
ENV_FILE_PATH = CONFIG_PATH / ".env"


class Settings(BaseSettings):
    """Application settings"""

    # Pydantic V2 configuration
    model_config = ConfigDict(
        env_file=str(ENV_FILE_PATH), case_sensitive=False, extra="allow"
    )

    # Application
    APP_NAME: str = "TranSuDeck"

    # GenAI Hub API
    GENAI_API_KEY: Optional[str] = None
    GENAI_API_URL: Optional[str] = None

    # Directories
    BASE_DIR: Path = Path(__file__).parent.parent
    OUTPUT_DIR: Path = BASE_DIR / "outputs"
    LOG_DIR: Path = BASE_DIR / "logs"
    ENV_FILE: Path = ENV_FILE_PATH

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Create directories if they don't exist
        self.OUTPUT_DIR.mkdir(exist_ok=True)
        self.LOG_DIR.mkdir(exist_ok=True)


# Initialize settings
settings = Settings()


def load_env_config():
    """Load configuration from .env file"""
    global settings
    if ENV_FILE_PATH.exists():
        try:
            # Read .env file manually to ensure it's loaded
            env_vars = {}
            with open(ENV_FILE_PATH, "r") as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#") and "=" in line:
                        key, value = line.split("=", 1)
                        env_vars[key.strip()] = value.strip()

            print(f"Loaded from .env file: {list(env_vars.keys())}")

            # Update settings with loaded values
            if "GENAI_API_KEY" in env_vars:
                settings.GENAI_API_KEY = env_vars["GENAI_API_KEY"]
            if "GENAI_API_URL" in env_vars:
                settings.GENAI_API_URL = env_vars["GENAI_API_URL"]

            print(
                f"Settings updated - API Key: {settings.GENAI_API_KEY is not None}, API URL: {settings.GENAI_API_URL}"
            )
            return True
        except Exception as e:
            print(f"Error loading .env: {e}")
            return False
    return False


def save_env_config(api_key: str, api_url: str) -> bool:
    """Save API configuration to .env file"""
    global settings
    try:
        env_content = f"""GENAI_API_KEY={api_key}
GENAI_API_URL={api_url}
"""
        with open(ENV_FILE_PATH, "w") as f:
            f.write(env_content)

        print(f"Saved to .env file: {ENV_FILE_PATH}")
        print(f"API Key length={len(api_key)}, API URL={api_url}")

        # Update settings directly
        settings.GENAI_API_KEY = api_key
        settings.GENAI_API_URL = api_url

        print(
            f"Settings updated directly - API Key: {settings.GENAI_API_KEY is not None}, API URL: {settings.GENAI_API_URL}"
        )

        # Verify by reading back
        with open(ENV_FILE_PATH, "r") as f:
            content = f.read()
            print(f".env file content:\n{content}")

        return True
    except Exception as e:
        print(f"Error saving config: {e}")
        return False


def is_configured() -> bool:
    """Check if API is configured"""
    has_key = bool(settings.GENAI_API_KEY and settings.GENAI_API_KEY.strip())
    has_url = bool(settings.GENAI_API_URL and settings.GENAI_API_URL.strip())
    result = has_key and has_url

    print(f"is_configured() - Key: {has_key}, URL: {has_url}, Result: {result}")

    return result


def format_model_name(model_id: str) -> str:
    """
    Format model ID to human-readable name

    Examples:
        claude-3-5-sonnet -> Claude 3.5 Sonnet
        claude-4-5-sonnet -> Claude 4.5 Sonnet
        llama3-1-405b -> Llama 3.1 405B
        llama4-maverick-17b -> Llama 4 Maverick 17B
    """
    # Claude models
    if model_id.startswith("claude-"):
        parts = model_id.replace("claude-", "").split("-")

        version_parts = []
        variant_parts = []

        i = 0
        while i < len(parts) and parts[i].isdigit():
            version_parts.append(parts[i])
            i += 1

        variant_parts = parts[i:]

        result = "Claude"
        if version_parts:
            result += " " + ".".join(version_parts)
        if variant_parts:
            variant = " ".join(part.capitalize() for part in variant_parts)
            result += " " + variant

        return result

    # Llama models
    elif model_id.startswith("llama"):
        parts = model_id.replace("llama", "").split("-")

        result = "Llama"
        version_parts = []
        other_parts = []

        for part in parts:
            if part.isdigit():
                version_parts.append(part)
            elif part and part[-1] == "b" and part[:-1].replace(".", "").isdigit():
                other_parts.append(part.upper())
            elif part:
                other_parts.append(part.capitalize())

        if version_parts:
            result += " " + ".".join(version_parts)
        if other_parts:
            result += " " + " ".join(other_parts)

        return result

    return " ".join(word.capitalize() for word in model_id.split("-"))


def is_supported_model(model_id: str) -> bool:
    """
    Check if the model is supported for translation and summarization

    Supported models:
    - Claude models (all variants)
    - Llama models (all variants)
    """
    supported_prefixes = ["claude-", "llama"]
    return any(model_id.startswith(prefix) for prefix in supported_prefixes)


async def get_available_models() -> List[Dict[str, str]]:
    """
    Fetch available AI models from GenAI Hub API
    Returns filtered and formatted model list
    """
    if not settings.GENAI_API_KEY or not settings.GENAI_API_URL:
        return []

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{settings.GENAI_API_URL}/models",
                headers={"Authorization": f"Bearer {settings.GENAI_API_KEY}"},
                timeout=10.0,
            )
            response.raise_for_status()

            models_data = response.json()

            # Filter and format models
            filtered_models = []
            for model in models_data.get("data", []):
                model_id = model.get("id", "")

                if is_supported_model(model_id):
                    filtered_models.append(
                        {
                            "id": model_id,
                            "name": format_model_name(model_id),
                            "original_name": model_id,
                        }
                    )

            # Sort models by name
            filtered_models.sort(key=lambda x: x["name"])

            return filtered_models

    except Exception as e:
        print(f"Error fetching models: {e}")
        return []


async def validate_api_settings(api_key: str, api_url: str) -> bool:
    """Validate GenAI Hub API settings"""
    try:
        # Normalize URL
        api_url = api_url.rstrip("/")

        # Try to build the models endpoint URL
        if "/chat/completions" in api_url:
            models_url = api_url.replace("/chat/completions", "/models")
        elif api_url.endswith("/v1"):
            models_url = f"{api_url}/models"
        else:
            models_url = f"{api_url}/models"

        print(f"Validating with URL: {models_url}")

        async with httpx.AsyncClient() as client:
            response = await client.get(
                models_url, headers={"Authorization": f"Bearer {api_key}"}, timeout=10.0
            )
            print(f"Validation response status: {response.status_code}")
            return response.status_code == 200
    except Exception as e:
        print(f"Validation error: {e}")
        return False
