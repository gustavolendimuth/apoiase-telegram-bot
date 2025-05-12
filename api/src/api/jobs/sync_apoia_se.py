from sqlalchemy.orm import Session
from src.db import SessionLocal
from src.api.models import Campaign, Supporter

# Simulação: função que consultaria a API do Apoia.se
# No futuro, implemente a chamada real à API do Apoia.se

def fetch_supporters_from_apoia_se(campaign: Campaign):
    # Simulação de diferentes cenários por campanha
    if campaign.id == 1:
        # Campanha 1: novo apoiador, reativação, cancelamento
        return [
            {"id": 101, "name": "Apoiador 1", "status": "active"},
            {"id": 102, "name": "Apoiador 2", "status": "inactive"},
            {"id": 103, "name": "Apoiador 3", "status": "active"},  # Novo
            {"id": 104, "name": "Apoiador 4", "status": "inactive"}, # Cancelado
            {"id": 105, "name": "Apoiador 5", "status": "active"},   # Reativado
        ]
    elif campaign.id == 2:
        # Campanha 2: novo apoiador, cancelamento
        return [
            {"id": 201, "name": "Apoiador 6", "status": "active"},
            {"id": 202, "name": "Apoiador 7", "status": "inactive"},
            {"id": 203, "name": "Apoiador 8", "status": "active"},  # Novo
        ]
    else:
        return []

def sync_all_campaigns():
    db: Session = SessionLocal()
    try:
        campaigns = db.query(Campaign).all()
        for campaign in campaigns:
            apoia_se_supporters = fetch_supporters_from_apoia_se(campaign)
            for s in apoia_se_supporters:
                supporter = db.query(Supporter).filter(
                    Supporter.id == s["id"],
                    Supporter.campaign_id == campaign.id
                ).first()
                if supporter:
                    supporter.status = s["status"]
                    supporter.name = s["name"]
                else:
                    supporter = Supporter(
                        id=s["id"], name=s["name"], status=s["status"], campaign_id=campaign.id
                    )
                    db.add(supporter)
            db.commit()
        print("Sincronização concluída.")
    finally:
        db.close()

if __name__ == "__main__":
    sync_all_campaigns() 