from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app import crud, schemas
from app.database import get_db

router = APIRouter(prefix="/proveedores", tags=["Proveedores"])

@router.get("/", response_model=List[schemas.ProveedorOut])
def api_listar_proveedores(db: Session = Depends(get_db)):
    try:
        return crud.obtener_proveedores(db)
    except Exception as e:
        import traceback; traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error interno: {e}")

@router.post("/", response_model=schemas.ProveedorOut)
def api_crear_proveedor(proveedor: schemas.ProveedorCreate, db: Session = Depends(get_db)):
    try:
        nuevo = crud.crear_proveedor(db, proveedor)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return nuevo

@router.put("/{id}", response_model=schemas.ProveedorOut)
def api_actualizar_proveedor(id: int, proveedor: schemas.ProveedorUpdate, db: Session = Depends(get_db)):
    try:
        actualizado = crud.actualizar_proveedor(db, id, proveedor)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    if actualizado is None:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado")
    return actualizado

@router.delete("/{id}")
def api_eliminar_proveedor(id: int, db: Session = Depends(get_db)):
    ok = crud.delete_proveedor(db, id)
    if not ok:
        raise HTTPException(status_code=400, detail="No se puede eliminar proveedor (puede tener mantenciones activas o no existe)")
    return {"detail": "Proveedor eliminado correctamente"}
