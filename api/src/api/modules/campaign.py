from fastapi import APIRouter, HTTPException, Depends
from typing import List
from pydantic import BaseModel
from sqlalchemy.orm import Session
from src.db import get_db
from src.api.models import Campaign as CampaignModel, Supporter as SupporterModel

router = APIRouter()

class Campaign(BaseModel):
    id: int
    name: str
    group_link: str
    class Config:
        orm_mode = True

class Supporter(BaseModel):
    id: int
    name: str
    telegram_id: int | None = None
    status: str
    class Config:
        orm_mode = True

@router.get("/campaigns", response_model=List[Campaign], tags=["campaigns"], summary="Listar campanhas")
def list_campaigns(db: Session = Depends(get_db)):
    """Retorna todas as campanhas do banco."""
    return db.query(CampaignModel).all()

@router.get("/campaigns/{campaign_id}/supporters", response_model=List[Supporter], tags=["supporters"], summary="Listar apoiadores de uma campanha")
def list_supporters(campaign_id: int, db: Session = Depends(get_db)):
    """Retorna os apoiadores de uma campanha."""
    campaign = db.query(CampaignModel).filter(CampaignModel.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campanha não encontrada")
    supporters = db.query(SupporterModel).filter(SupporterModel.campaign_id == campaign_id).all()
    return supporters 