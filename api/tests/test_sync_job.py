from src.api.jobs.sync_apoia_se import sync_all_campaigns
from src.db import SessionLocal
from src.api.models import Supporter

def test_sync_job_updates_and_creates():
    db = SessionLocal()
    try:
        # Antes do sync: altera status de um apoiador existente
        s = db.query(Supporter).filter(Supporter.id == 101, Supporter.campaign_id == 1).first()
        if s:
            s.status = "inactive"
            db.commit()
        # Executa o job
        sync_all_campaigns()
        # Depois do sync: deve estar "active" de novo
        s = db.query(Supporter).filter(Supporter.id == 101, Supporter.campaign_id == 1).first()
        assert s.status == "active"
        # Novo apoiador deve ser criado
        s_new = db.query(Supporter).filter(Supporter.id == 103, Supporter.campaign_id == 1).first()
        assert s_new is not None
        assert s_new.status == "active"
    finally:
        db.close() 