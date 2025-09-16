from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app import models, schemas

router = APIRouter(prefix="/direcciones", tags=["Direcciones"])

@router.get("/", response_model=List[schemas.DireccionOut])
def listar_direcciones(db: Session = Depends(get_db)):
    direcciones = db.query(models.Direccion).all()
    return direcciones
