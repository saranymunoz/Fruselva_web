from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app import crud, schemas
from app.database import get_db

router = APIRouter(prefix="/vehiculos", tags=["Vehículos"])

@router.post("/", response_model=schemas.Vehiculo)
def crear_vehiculo(vehiculo: schemas.VehiculoCreate, db: Session = Depends(get_db)):
    db_vehiculo = crud.get_vehiculo_por_patente(db, vehiculo.patente)
    if db_vehiculo:
        raise HTTPException(status_code=400, detail="La patente ya existe.")
    return crud.crear_vehiculo(db, vehiculo)

@router.get("/", response_model=List[schemas.Vehiculo])
def listar_vehiculos(db: Session = Depends(get_db)):
    return crud.obtener_vehiculos(db)

@router.get("/{patente}", response_model=schemas.Vehiculo)
def obtener_vehiculo_por_patente(patente: str, db: Session = Depends(get_db)):
    vehiculo = crud.get_vehiculo_por_patente(db, patente)
    if not vehiculo:
        raise HTTPException(status_code=404, detail="Vehículo no encontrado.")
    return vehiculo

@router.put("/{id}", response_model=schemas.Vehiculo)
def actualizar_vehiculo(id: int, datos: schemas.VehiculoCreate, db: Session = Depends(get_db)):
    actualizado = crud.actualizar_vehiculo(db, id, datos)
    if not actualizado:
        raise HTTPException(status_code=404, detail="Vehículo no encontrado.")
    return actualizado

@router.delete("/{id}")
def eliminar_vehiculo(id: int, db: Session = Depends(get_db)):
    eliminado = crud.eliminar_vehiculo(db, id)
    if not eliminado:
        raise HTTPException(status_code=404, detail="Vehículo no encontrado.")
    return {"detail": "Vehículo eliminado correctamente"}
