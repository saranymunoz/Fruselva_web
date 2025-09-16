from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional, List
from sqlalchemy.orm import Session
from datetime import date
from app import crud, schemas
from app.database import get_db

router = APIRouter(prefix="/mantenciones", tags=["Mantenciones"])


@router.get("/", response_model=List[schemas.MantencionBase])
def api_listar_mantenciones(
    fecha_desde: Optional[date] = Query(None, description="Fecha desde para filtrar"),
    fecha_hasta: Optional[date] = Query(None, description="Fecha hasta para filtrar"),
    db: Session = Depends(get_db)
):
    try:
        return crud.obtener_mantenciones(db, fecha_desde, fecha_hasta)
    except Exception as e:
        import traceback; traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error interno: {e}")
    
def validar_campos_obligatorios(mantencion: schemas.MantencionCreate):
    campos_obligatorios = ['vehiculo_id', 'tipo_id', 'fecha', 'kilometraje', 'costo', 'proveedor_id']
    for campo in campos_obligatorios:
        valor = getattr(mantencion, campo)
        if valor is None or (isinstance(valor, str) and valor.strip() == ''):
            raise HTTPException(status_code=400, detail=f"El campo '{campo}' es obligatorio.")

@router.post("/", response_model=schemas.Mantencion)
def crear_mantencion(mantencion: schemas.MantencionCreate, db: Session = Depends(get_db)):
    validar_campos_obligatorios(mantencion)

    # Fecha no puede ser futura
    if mantencion.fecha > date.today():
        raise HTTPException(status_code=400, detail="La fecha no puede ser futura.")

    # Kilometraje debe ser >= último registrado
    ultimo_km = crud.obtener_ultimo_kilometraje(db, mantencion.vehiculo_id)
    if ultimo_km is not None and mantencion.kilometraje < ultimo_km:
        raise HTTPException(status_code=400, detail=f"El kilometraje debe ser mayor o igual al último registrado: {ultimo_km} km.")

    return crud.crear_mantencion(db, mantencion)

@router.put("/{id}", response_model=schemas.Mantencion)
def actualizar_mantencion(id: int, datos: schemas.MantencionCreate, db: Session = Depends(get_db)):
    validar_campos_obligatorios(datos)

    # Fecha no puede ser futura
    if datos.fecha > date.today():
        raise HTTPException(status_code=400, detail="La fecha no puede ser futura.")

    mantencion_actual = crud.get_mantencion(db, id)
    if not mantencion_actual:
        raise HTTPException(status_code=404, detail="Mantención no encontrada")

    # No permitir disminuir el kilometraje (para mantener orden lógico)
    if datos.kilometraje < mantencion_actual.kilometraje:
        raise HTTPException(status_code=400, detail=f"El kilometraje no puede ser menor al actual registrado: {mantencion_actual.kilometraje} km.")

    return crud.actualizar_mantencion(db, id, datos)


@router.get("/tipos_mantencion", response_model=List[schemas.TipoMantencion])
def listar_tipos_mantencion(db: Session = Depends(get_db)):
    try:
        return crud.obtener_tipos_mantencion(db)
    except Exception as e:
        import traceback; traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error al obtener tipos de mantención: {e}")