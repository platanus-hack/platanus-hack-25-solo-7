from pydantic import BaseModel, EmailStr
from typing import Optional

class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class CompanyInfoBase(BaseModel):
    identificacion_giro: str
    ingresos: str
    gastos_rechazados: str
    base_imponible: str
    creditos: str
    impuesto_total_pagado: str

class CompanyInfoCreate(CompanyInfoBase):
    pass

class CompanyInfo(CompanyInfoBase):
    id: int

    class Config:
        from_attributes = True
