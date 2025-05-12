from fastapi import FastAPI
from loguru import logger
from fastapi.responses import JSONResponse
from src.api.modules import campaign, supporters

app = FastAPI(
    title="Apoia.se Telegram Bot API",
    description="API para integração entre a plataforma Apoia.se e grupos privados do Telegram. Permite liberar ou remover o acesso de apoiadores a grupos como recompensa de apoio recorrente.",
    version="0.1.0",
    contact={
        "name": "Equipe Apoia.se Bot",
        "email": "suporte@apoiase.com",
    },
    openapi_tags=[
        {"name": "health", "description": "Endpoints de verificação de saúde da API."},
        {"name": "supporters", "description": "Gerenciamento e simulação de apoiadores."},
        {"name": "campaigns", "description": "Gerenciamento de campanhas."},
    ],
)

@app.get("/health", tags=["health"], response_description="Status da API")
def health():
    """Endpoint de verificação de saúde da API."""
    logger.info("Health check endpoint chamado.")
    return JSONResponse({"status": "ok"})

app.include_router(campaign.router)
app.include_router(supporters.router) 