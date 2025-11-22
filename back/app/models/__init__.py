from sqlalchemy import Column, Integer, String
from app.core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)

class CompanyInfo(Base):
    __tablename__ = "company_info"

    id = Column(Integer, primary_key=True, index=True)
    identificacion_giro = Column(String)
    ingresos = Column(String)
    gastos_rechazados = Column(String)
    base_imponible = Column(String)
    creditos = Column(String)
    impuesto_total_pagado = Column(String)
