from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app import crud, schemas
from app.database import get_db

router = APIRouter(prefix="/programar-mantenciones", tags=["Programar Mantenciones"])

@router.post("/", response_model=schemas.ProgramarMantencion)
def crear_programacion(programacion: schemas.ProgramarMantencionCreate, db: Session = Depends(get_db)):
    return crud.crear_programacion(db, programacion)

@router.get("/", response_model=List[schemas.ProgramarMantencion])
def listar_programaciones(db: Session = Depends(get_db)):
    return crud.obtener_programaciones(db)

@router.get("/{id}", response_model=schemas.ProgramarMantencion)
def obtener_programacion(id: int, db: Session = Depends(get_db)):
    programacion = crud.get_programacion(db, id)
    if not programacion:
        raise HTTPException(status_code=404, detail="Programación no encontrada")
    return programacion

@router.put("/{id}", response_model=schemas.ProgramarMantencion)
def actualizar_programacion(id: int, datos: schemas.ProgramarMantencionCreate, db: Session = Depends(get_db)):
    programacion = crud.actualizar_programacion(db, id, datos)
    if not programacion:
        raise HTTPException(status_code=404, detail="Programación no encontrada")
    return programacion

@router.delete("/{id}")
def eliminar_programacion(id: int, db: Session = Depends(get_db)):
    eliminado = crud.eliminar_programacion(db, id)
    if not eliminado:
        raise HTTPException(status_code=404, detail="Programación no encontrada")
    return {"detail": "Programación eliminada correctamente"}
