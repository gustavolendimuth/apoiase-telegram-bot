from src.db import SessionLocal
from src.api.models import Campaign, Supporter

def seed():
    db = SessionLocal()
    try:
        # Campanhas
        c1 = Campaign(id=1, name="Campanha do Criador 1", group_link="https://t.me/joinchat/AAAAA1")
        c2 = Campaign(id=2, name="Campanha do Criador 2", group_link="https://t.me/joinchat/AAAAA2")
        db.merge(c1)
        db.merge(c2)
        db.commit()

        # Apoiadores - Campanha 1
        s1 = Supporter(id=101, name="Apoiador 1", status="active", campaign_id=1)
        s2 = Supporter(id=102, name="Apoiador 2", status="inactive", campaign_id=1)
        s3 = Supporter(id=103, name="Apoiador 3", status="active", campaign_id=1)  # Novo apoiador
        s4 = Supporter(id=104, name="Apoiador 4", status="inactive", campaign_id=1) # Cancelou apoio
        s5 = Supporter(id=105, name="Apoiador 5", status="active", campaign_id=1)   # Reativou apoio
        # Apoiadores - Campanha 2
        s6 = Supporter(id=201, name="Apoiador 6", status="active", campaign_id=2)
        s7 = Supporter(id=202, name="Apoiador 7", status="inactive", campaign_id=2)
        s8 = Supporter(id=203, name="Apoiador 8", status="active", campaign_id=2)  # Novo apoiador
        db.merge(s1)
        db.merge(s2)
        db.merge(s3)
        db.merge(s4)
        db.merge(s5)
        db.merge(s6)
        db.merge(s7)
        db.merge(s8)
        db.commit()
        print("Seed concluído.")
    finally:
        db.close()

if __name__ == "__main__":
    seed() 