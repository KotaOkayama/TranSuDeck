import logging
import os
from contextlib import asynccontextmanager
from datetime import datetime
from pathlib import Path
from typing import List, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from app.config import (
    format_model_name,
    is_configured,
    is_supported_model,
    load_env_config,
    save_env_config,
    settings,
    validate_api_settings,
)
from app.core.pptx_generator import PPTXGenerator
from app.core.summarizer import Summarizer
from app.core.translator import Translator
from app.models.slide import Slide

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler(os.path.join(settings.LOG_DIR, "app.log")),
        logging.StreamHandler(),
    ],
)
logger = logging.getLogger(__name__)

# Global instances
translator: Optional[Translator] = None
summarizer: Optional[Summarizer] = None
pptx_generator = PPTXGenerator()


# Initialize translator and summarizer if configured
def initialize_services():
    global translator, summarizer
    if is_configured():
        try:
            translator = Translator(settings.GENAI_API_URL, settings.GENAI_API_KEY)
            summarizer = Summarizer(settings.GENAI_API_URL, settings.GENAI_API_KEY)
            logger.info("Services initialized successfully")
            return True
        except Exception as e:
            logger.error(f"Error initializing services: {str(e)}")
            return False
    return False


# Lifespan context manager
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting TranSuDeck application...")
    load_env_config()
    initialize_services()
    logger.info(f"Application started. Configured: {is_configured()}")
    yield
    # Shutdown
    logger.info("Shutting down TranSuDeck application...")


# FastAPI application
app = FastAPI(title=settings.APP_NAME, lifespan=lifespan)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files
app.mount("/static", StaticFiles(directory="app/static"), name="static")


# Request/Response Models
class APIConfig(BaseModel):
    api_key: str
    api_url: str


class TranslateRequest(BaseModel):
    text: str
    source_lang: str
    target_lang: str
    additional_instructions: Optional[str] = ""
    num_slides: int = 1
    model: str


class SlideData(BaseModel):
    id: str
    content: str
    order: int


class PPTXRequest(BaseModel):
    slides: List[SlideData]


class ModelInfo(BaseModel):
    id: str
    name: str
    original_name: str


class ModelListResponse(BaseModel):
    models: List[ModelInfo]
    count: int


@app.get("/", response_class=HTMLResponse)
async def root():
    """Serve the main HTML page"""
    with open("app/static/index.html", "r", encoding="utf-8") as f:
        return HTMLResponse(content=f.read())


@app.post("/api/config")
async def set_config(config: APIConfig):
    """Set GenAI Hub API configuration and save to .env"""
    global translator, summarizer

    try:
        # Validate inputs
        if not config.api_key or not config.api_url:
            raise HTTPException(status_code=400, detail="API Key and URL are required")

        # Validate API credentials
        logger.info("Validating API credentials...")
        is_valid = await validate_api_settings(config.api_key, config.api_url)
        if not is_valid:
            raise HTTPException(
                status_code=400,
                detail="Invalid API credentials. Please check your API Key and URL.",
            )

        # Save to .env file
        if not save_env_config(config.api_key, config.api_url):
            raise HTTPException(status_code=500, detail="Failed to save configuration")

        # Initialize services with new credentials
        translator = Translator(config.api_url, config.api_key)
        summarizer = Summarizer(config.api_url, config.api_key)

        logger.info("API configuration updated and saved to .env")
        logger.info(f"Translator initialized: {translator is not None}")
        logger.info(f"Summarizer initialized: {summarizer is not None}")

        return {
            "status": "success",
            "message": "Configuration saved successfully",
            "configured": True,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error setting configuration: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/config/status")
async def get_config_status():
    """Check if API is configured"""
    # Force reload settings from .env
    load_env_config()

    configured = is_configured() and translator is not None and summarizer is not None

    logger.info("Config status check:")
    logger.info(f"  - is_configured(): {is_configured()}")
    logger.info(f"  - translator is not None: {translator is not None}")
    logger.info(f"  - summarizer is not None: {summarizer is not None}")
    logger.info(f"  - GENAI_API_KEY set: {settings.GENAI_API_KEY is not None}")
    logger.info(f"  - GENAI_API_URL: {settings.GENAI_API_URL}")
    logger.info(f"  - Final configured: {configured}")

    return {
        "configured": configured,
        "has_env_file": Path(settings.ENV_FILE).exists(),
        "api_url_set": settings.GENAI_API_URL is not None
        and settings.GENAI_API_URL != "",
    }


@app.get("/api/models", response_model=ModelListResponse)
async def get_models():
    """Get available AI models from GenAI Hub (filtered and formatted)"""
    logger.info(
        f"get_models called - is_configured: {is_configured()}, translator: {translator is not None}"
    )

    if not is_configured():
        logger.error("API not configured")
        raise HTTPException(
            status_code=400,
            detail="API not configured. Please configure API settings first.",
        )

    if not translator:
        logger.error("Translator not initialized, attempting to initialize...")
        # Try to initialize
        if not initialize_services():
            raise HTTPException(
                status_code=500, detail="Failed to initialize translator service"
            )

    try:
        # Get all models from API
        logger.info("Fetching models from translator...")
        all_models = await translator.get_available_models()
        logger.info(f"Received {len(all_models)} models from API")

        # Filter and format models
        filtered_models = []
        for model_id in all_models:
            # Filter: only Claude and Llama models
            if is_supported_model(model_id):
                filtered_models.append(
                    ModelInfo(
                        id=model_id,
                        name=format_model_name(model_id),
                        original_name=model_id,
                    )
                )

        # Sort by formatted name
        filtered_models.sort(key=lambda x: x.name)

        logger.info(
            f"Returning {len(filtered_models)} filtered models out of {len(all_models)} total"
        )

        return ModelListResponse(models=filtered_models, count=len(filtered_models))
    except Exception as e:
        logger.error(f"Error fetching models: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/translate")
async def translate_and_summarize(request: TranslateRequest):
    """Translate and summarize text"""
    if not is_configured() or not translator or not summarizer:
        raise HTTPException(
            status_code=400,
            detail="API not configured. Please configure API settings first.",
        )

    try:
        # Skip translation if source and target languages are the same
        if request.source_lang == request.target_lang:
            translated_text = request.text
            logger.info(
                "Source and target languages are the same, skipping translation"
            )
        else:
            translated_text = await translator.translate(
                text=request.text,
                source_lang=request.source_lang,
                target_lang=request.target_lang,
                model=request.model,
            )

        # Summarize the translated text
        summary = await summarizer.summarize(
            text=translated_text,
            num_slides=request.num_slides,
            additional_instructions=request.additional_instructions,
            model=request.model,
            target_lang=request.target_lang,
        )

        return {
            "translation": translated_text,
            "summary": summary,
            "num_slides": request.num_slides,
        }
    except Exception as e:
        logger.error(f"Error in translation/summarization: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/pptx/generate")
async def generate_pptx_endpoint(request: PPTXRequest):
    """Generate PPTX file from slides"""
    try:
        # Convert request data to Slide objects
        slides = [
            Slide(id=s.id, content=s.content, order=s.order)
            for s in sorted(request.slides, key=lambda x: x.order)
        ]

        # Generate PPTX
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"presentation_{timestamp}.pptx"
        filepath = os.path.join(settings.OUTPUT_DIR, filename)

        pptx_generator.create_presentation(slides, filepath)

        logger.info(f"PPTX generated: {filename}")
        return {
            "status": "success",
            "filename": filename,
            "download_url": f"/api/pptx/download/{filename}",
        }
    except Exception as e:
        logger.error(f"Error generating PPTX: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/pptx/download/{filename}")
async def download_pptx(filename: str):
    """Download generated PPTX file"""
    filepath = os.path.join(settings.OUTPUT_DIR, filename)

    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="File not found")

    return FileResponse(
        filepath,
        media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation",
        filename=filename,
    )


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "configured": is_configured()}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8001)
