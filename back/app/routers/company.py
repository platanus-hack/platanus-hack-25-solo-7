from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import models, schemas
from ..core import database

router = APIRouter(
    prefix="/company",
    tags=["company"]
)

@router.post("/añadir_informacion_empresa", response_model=schemas.CompanyInfo)
def create_company_info(info: schemas.CompanyInfoCreate, db: Session = Depends(database.get_db)):
    db_info = models.CompanyInfo(**info.dict())
    db.add(db_info)
    db.commit()
    db.refresh(db_info)
    return db_info
