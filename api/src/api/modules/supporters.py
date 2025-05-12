from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from src.db import get_db
from src.api.models import Supporter as SupporterModel, TelegramLink as TelegramLinkModel

router = APIRouter()

class LinkRequest(BaseModel):
    campaign_id: int
    supporter_id: int
    telegram_id: int

class LinkResponse(BaseModel):
    message: str

class CheckRequest(BaseModel):
    campaign_id: int
    telegram_id: int

class CheckResponse(BaseModel):
    is_active: bool
    message: str

@router.post("/supporters/link", response_model=LinkResponse, tags=["supporters"], summary="Vincular apoiador ao Telegram")
def link_supporter(req: LinkRequest, db: Session = Depends(get_db)):
    """Vincula um apoiador a um usuário do Telegram."""
    supporter = db.query(SupporterModel).filter(SupporterModel.id == req.supporter_id, SupporterModel.campaign_id == req.campaign_id).first()
    if not supporter:
        raise HTTPException(status_code=404, detail="Apoiador não encontrado para a campanha")
    if supporter.status != "active":
        raise HTTPException(status_code=400, detail="Apoiador não está ativo")
    # Cria ou atualiza o vínculo
    link = db.query(TelegramLinkModel).filter(TelegramLinkModel.supporter_id == supporter.id).first()
    if not link:
        link = TelegramLinkModel(supporter_id=supporter.id, telegram_id=str(req.telegram_id))
        db.add(link)
    else:
        link.telegram_id = str(req.telegram_id)
    db.commit()
    return LinkResponse(message=f"Apoiador {req.supporter_id} vinculado ao Telegram ID {req.telegram_id} na campanha {req.campaign_id}.")

@router.post("/supporters/check", response_model=CheckResponse, tags=["supporters"], summary="Checar se usuário é apoiador ativo")
def check_supporter(req: CheckRequest, db: Session = Depends(get_db)):
    """Checa se o Telegram ID está vinculado a um apoiador ativo na campanha."""
    link = db.query(TelegramLinkModel).filter(TelegramLinkModel.telegram_id == str(req.telegram_id)).first()
    if not link:
        return CheckResponse(is_active=False, message="Usuário não vinculado a nenhum apoio.")
    supporter = db.query(SupporterModel).filter(SupporterModel.id == link.supporter_id, SupporterModel.campaign_id == req.campaign_id).first()
    if not supporter or supporter.status != "active":
        return CheckResponse(is_active=False, message="Usuário não é apoiador ativo nesta campanha.")
    return CheckResponse(is_active=True, message="Usuário é apoiador ativo nesta campanha.") 