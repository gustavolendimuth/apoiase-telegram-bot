from sqlalchemy import Column, Integer, String, ForeignKey, UniqueConstraint
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

class Campaign(Base):
    __tablename__ = "campaigns"
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    group_link = Column(String, nullable=False)
    supporters = relationship("Supporter", back_populates="campaign")

class Supporter(Base):
    __tablename__ = "supporters"
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    status = Column(String, nullable=False)  # 'active' ou 'inactive'
    campaign_id = Column(Integer, ForeignKey("campaigns.id"), nullable=False)
    telegram_link = relationship("TelegramLink", uselist=False, back_populates="supporter")
    campaign = relationship("Campaign", back_populates="supporters")

class TelegramLink(Base):
    __tablename__ = "telegram_links"
    id = Column(Integer, primary_key=True)
    supporter_id = Column(Integer, ForeignKey("supporters.id"), nullable=False, unique=True)
    telegram_id = Column(String, nullable=False, unique=True)
    supporter = relationship("Supporter", back_populates="telegram_link")
    __table_args__ = (UniqueConstraint('supporter_id', 'telegram_id', name='_supporter_telegram_uc'),) 