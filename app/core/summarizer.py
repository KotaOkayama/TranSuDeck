import httpx
import logging

logger = logging.getLogger(__name__)

class Summarizer:
    def __init__(self, api_url: str, api_key: str):
        # API URLの正規化
        self.base_url = api_url.rstrip('/')
        self.api_key = api_key
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        logger.info(f"Summarizer initialized with base URL: {self.base_url}")
    
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
    
    async def summarize(
        self,
        text: str,
        num_slides: int = 1,
        additional_instructions: str = "",
        model: str = "claude-3-5-sonnet",
        target_lang: str = "English"
    ) -> str:
        """Summarize text for presentation slides"""
        
        slide_instruction = ""
        if num_slides > 1:
            slide_instruction = f"""
Divide the content into exactly {num_slides} slides.
Separate each slide with a horizontal rule (---) in markdown format.
Each slide should be self-contained and focused on a specific topic.
"""
        
        # ターゲット言語での出力を指示
        language_instruction = f"""
Output the summary in {target_lang}.
All content must be written in {target_lang}.
"""
        
        prompt = f"""Summarize the following text for a presentation slide.
{language_instruction}
{slide_instruction}
Format the output in markdown with:
- Clear headings (##) for slide titles
- Bullet points (-) for key information
- Concise and professional language
- Focus on the most important points

{additional_instructions if additional_instructions else ''}

Text to summarize:
{text}"""
        
        try:
            url = self._build_url('chat/completions')
            payload = {
                "model": model,
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.5
            }
            
            logger.info(f"Sending summarization request to: {url}")
            
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(url, headers=self.headers, json=payload)
                logger.info(f"Response status: {response.status_code}")
                response.raise_for_status()
                data = response.json()
                
                if "choices" in data and len(data["choices"]) > 0:
                    summary = data["choices"][0]["message"]["content"].strip()
                    logger.info("Summarization successful")
                    return summary
                else:
                    logger.error(f"Unexpected response format: {data}")
                    raise Exception("Unexpected API response format")
        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error: {e.response.status_code}")
            logger.error(f"Response body: {e.response.text}")
            raise Exception(f"Summarization failed: {str(e)}")
        except Exception as e:
            logger.error(f"Summarization error: {str(e)}")
            raise Exception(f"Summarization failed: {str(e)}")
