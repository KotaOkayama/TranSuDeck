import httpx
import logging
from typing import List

logger = logging.getLogger(__name__)

class Translator:
    def __init__(self, api_url: str, api_key: str):
        self.base_url = api_url.rstrip('/')
        self.api_key = api_key
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        logger.info(f"Translator initialized with base URL: {self.base_url}")
    
    def _build_url(self, endpoint: str) -> str:
        """
        Build complete URL from base URL and endpoint
        Handles cases where base URL already contains the endpoint
        """
        endpoint = endpoint.lstrip('/')
        
        # base_url が既に指定されたエンドポイントを含んでいる場合
        if endpoint == 'chat/completions' and self.base_url.endswith('/chat/completions'):
            logger.info(f"Base URL already contains chat/completions: {self.base_url}")
            return self.base_url
        
        if endpoint == 'models':
            # models エンドポイントの場合
            if '/chat/completions' in self.base_url:
                # /chat/completions を /models に置き換え
                url = self.base_url.replace('/chat/completions', '/models')
                logger.info(f"Built models URL: {url}")
                return url
            elif self.base_url.endswith('/v1'):
                # /v1 で終わっている場合
                url = f"{self.base_url}/models"
                logger.info(f"Built models URL: {url}")
                return url
            else:
                # その他の場合
                url = f"{self.base_url}/{endpoint}"
                logger.info(f"Built models URL: {url}")
                return url
        
        # chat/completions エンドポイントの場合
        if endpoint == 'chat/completions':
            if '/chat/completions' not in self.base_url:
                # base_url に chat/completions が含まれていない場合のみ追加
                url = f"{self.base_url}/{endpoint}"
                logger.info(f"Built URL: {url}")
                return url
            else:
                # 既に含まれている場合はそのまま
                logger.info(f"Using base URL as-is: {self.base_url}")
                return self.base_url
        
        # その他のエンドポイント
        url = f"{self.base_url}/{endpoint}"
        logger.info(f"Built URL: {url}")
        return url
    
    async def get_available_models(self) -> List[str]:
        """Fetch available models from GenAI Hub"""
        try:
            url = self._build_url('models')
            
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(url, headers=self.headers)
                response.raise_for_status()
                data = response.json()
                
                if isinstance(data, dict) and "data" in data:
                    models = [model["id"] for model in data["data"]]
                elif isinstance(data, list):
                    models = [model.get("id", str(model)) if isinstance(model, dict) else str(model) for model in data]
                else:
                    models = []
                
                logger.info(f"Found {len(models)} models")
                return models if models else ["claude-3-5-sonnet", "gpt-4", "gpt-3.5-turbo"]
        except Exception as e:
            logger.error(f"Error fetching models: {str(e)}")
            return ["claude-3-5-sonnet", "gpt-4", "gpt-3.5-turbo"]
    
    async def translate(self, text: str, source_lang: str, target_lang: str, model: str) -> str:
        """Translate text using GenAI Hub API"""
        prompt = f"""Translate the following text from {source_lang} to {target_lang}.
Only provide the translation without any explanations or additional text.

Text to translate:
{text}"""
        
        try:
            url = self._build_url('chat/completions')
            payload = {
                "model": model,
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.3
            }
            
            logger.info(f"Sending translation request to: {url}")
            
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(url, headers=self.headers, json=payload)
                logger.info(f"Response status: {response.status_code}")
                response.raise_for_status()
                data = response.json()
                
                if "choices" in data and len(data["choices"]) > 0:
                    translated = data["choices"][0]["message"]["content"].strip()
                    logger.info("Translation successful")
                    return translated
                else:
                    logger.error(f"Unexpected response format: {data}")
                    raise Exception("Unexpected API response format")
        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error: {e.response.status_code}")
            logger.error(f"Response body: {e.response.text}")
            raise Exception(f"Translation failed: {str(e)}")
        except Exception as e:
            logger.error(f"Translation error: {str(e)}")
            raise Exception(f"Translation failed: {str(e)}")
